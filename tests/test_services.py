"""The actions, the websocket commands, live updates and diagnostics."""

from __future__ import annotations

import asyncio

from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_API_KEY, CONF_URL
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.setup import async_setup_component
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import ClientSessionGenerator, WebSocketGenerator

from custom_components.pecklist.api import PeckListApiError, PeckListConnectionError
from custom_components.pecklist.const import CONF_HA_USER, DOMAIN, POLL_WITH_STREAM, POLL_WITHOUT_STREAM

from .conftest import CHORES, FakePeckList, refresh


async def _call(hass: HomeAssistant, name: str, data: dict, response: bool = True) -> dict | None:
    return await hass.services.async_call(DOMAIN, name, data, blocking=True, return_response=response)


async def test_add_task_goes_through_quick_add(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry
) -> None:
    answer = await _call(hass, "add_task", {"text": "Empty the dishwasher #home !high", "list": "chores"})
    assert server.writes() == [
        (
            "quick",
            {"text": "Empty the dishwasher #home !high", "listId": CHORES, "timeZone": "America/Chicago"},
        )
    ]
    assert answer["task"]["title"] == "Empty the dishwasher"
    await hass.async_block_till_done()
    assert hass.states.get("todo.pecklist_ben_chores").state == "1"


async def test_complete_by_title_then_reopen_and_delete(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry
) -> None:
    server.put_task("T1", "Empty the dishwasher")
    await refresh(hass, loaded)

    answer = await _call(hass, "complete_task", {"title": "empty the DISHWASHER", "list": "Chores"})
    assert answer["completed"]["status"] == "done"
    with pytest.raises(ServiceValidationError):  # no open task of that name is left
        await _call(hass, "complete_task", {"title": "Empty the dishwasher"})

    await _call(hass, "reopen_task", {"task_id": "T1"})
    await _call(
        hass, "update_task", {"task_id": "T1", "priority": "high", "date": "2026-11-20", "add_tags": ["home"]}
    )
    assert server.writes()[-1] == (
        "update",
        {
            "id": "T1",
            "priority": 3,
            "addTags": ["home"],
            "schedule": {"start": "2026-11-20", "end": None, "allDay": True},
        },
    )
    await _call(hass, "delete_task", {"task_id": "T1"}, response=False)
    assert server.writes()[-1] == ("delete", "T1")

    tasks = await _call(hass, "get_tasks", {"filter": "open"})
    assert tasks == {"tasks": []}


async def test_actions_say_what_is_wrong(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry
) -> None:
    for name, data, key in (
        ("add_task", {"text": "x", "list": "Nope"}, "list_not_found"),
        ("complete_task", {}, "task_needed"),
        ("complete_task", {"task_id": "missing"}, "not_found"),
        ("add_task", {"text": "x", "config_entry_id": "missing"}, "entry_not_found"),
    ):
        with pytest.raises(ServiceValidationError) as raised:
            await _call(hass, name, data)
        assert raised.value.translation_key == key


async def test_two_accounts_need_naming(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry
) -> None:
    second = MockConfigEntry(
        domain=DOMAIN,
        title="sam",
        unique_id="tasks.example.com/other",
        data={CONF_URL: "https://tasks.example.com", CONF_API_KEY: "pl_2"},
    )
    second.add_to_hass(hass)
    assert await hass.config_entries.async_setup(second.entry_id)
    await hass.async_block_till_done()

    with pytest.raises(ServiceValidationError) as raised:
        await _call(hass, "add_task", {"text": "x"})
    assert raised.value.translation_key == "entry_needed"
    assert await _call(hass, "add_task", {"text": "x", "config_entry_id": second.entry_id})


async def test_websocket_commands(
    hass: HomeAssistant,
    server: FakePeckList,
    entry: MockConfigEntry,
    hass_ws_client: WebSocketGenerator,
    hass_admin_user,
) -> None:
    server.put_task("T1", "Mow the lawn", priority=3, tags=["yard"])
    server.add_section("S1", CHORES, "Outside")
    server.add_tag("yard")
    hass.config_entries.async_update_entry(entry, options={CONF_HA_USER: hass_admin_user.id})
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    ws = await hass_ws_client(hass)

    await ws.send_json_auto_id({"type": "pecklist/accounts"})
    answer = (await ws.receive_json())["result"]
    assert answer["mine"] == entry.entry_id
    account = answer["accounts"][0]
    assert (account["username"], account["can_write"]) == ("ben", True)
    assert account["name"] == hass_admin_user.name
    assert "api_key" not in str(answer) and "pl_secret" not in str(answer)

    await ws.send_json_auto_id({"type": "pecklist/subscribe", "entry_id": entry.entry_id})
    subscribed = await ws.receive_json()
    assert subscribed["success"]
    snapshot = (await ws.receive_json())["event"]
    assert [t["title"] for t in snapshot["tasks"]] == ["Mow the lawn"]
    assert snapshot["tasks"][0]["priority"] == 3
    assert [s["name"] for s in snapshot["sections"]] == ["Outside"]
    assert [t["name"] for t in snapshot["tags"]] == ["yard"]
    assert {lst["name"] for lst in snapshot["lists"]} == {"Inbox", "Chores", "Household"}

    await ws.send_json_auto_id(
        {
            "type": "pecklist/task/update",
            "entry_id": entry.entry_id,
            "task_id": "T1",
            "changes": {"priority": 1, "tags": ["yard", "home"]},
        }
    )
    messages = [await ws.receive_json(), await ws.receive_json()]
    pushed = next(m for m in messages if m["type"] == "event")["event"]
    result = next(m for m in messages if m["type"] == "result")
    assert result["result"]["priority"] == 1
    assert pushed["tasks"][0]["tags"] == ["yard", "home"]

    # Only task fields the card may set get through.
    await ws.send_json_auto_id(
        {
            "type": "pecklist/task/update",
            "entry_id": entry.entry_id,
            "task_id": "T1",
            "changes": {"createdBy": "me"},
        }
    )
    assert (await ws.receive_json())["error"]["code"] == "invalid_format"

    await ws.send_json_auto_id(
        {"type": "pecklist/task/complete", "entry_id": entry.entry_id, "task_id": "nope"}
    )
    messages = [await ws.receive_json()]
    assert messages[0]["error"]["code"] == "pecklist_error"

    await ws.send_json_auto_id({"type": "pecklist/task/quick_add", "entry_id": "missing", "text": "x"})
    assert (await ws.receive_json())["error"]["code"] == "not_found"


async def test_the_stream_nudges_a_refresh_and_slows_the_poll(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry
) -> None:
    coordinator = loaded.runtime_data
    await asyncio.sleep(0.05)
    assert coordinator.stream_connected
    assert coordinator.update_interval == POLL_WITH_STREAM

    server.put_task("T9", "From my phone")
    server.stream.put_nowait({"cursor": "9", "source": "phone"})
    await asyncio.sleep(0)
    await coordinator.async_refresh()  # the debounced refresh the nudge asked for
    await hass.async_block_till_done()
    assert hass.states.get("todo.pecklist_ben_chores").state == "1"

    # The stream breaks: back to polling once a minute, and it reconnects on its own.
    opens = server.stream_opens
    server.stream.put_nowait(PeckListConnectionError("reset"))
    await asyncio.sleep(0.005)
    assert not coordinator.stream_connected
    assert coordinator.update_interval == POLL_WITHOUT_STREAM
    await asyncio.sleep(0.1)
    assert server.stream_opens > opens
    assert coordinator.stream_connected


async def test_a_reminder_on_the_stream_becomes_an_event_for_automations(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry
) -> None:
    server.put_task("T1", "Take out the bins")
    await refresh(hass, loaded)
    heard = []
    hass.bus.async_listen("pecklist_notification", lambda event: heard.append(event.data))
    refreshes = len(server.calls)

    server.stream.put_nowait(
        {
            "notification": {
                "id": "N1",
                "kind": "reminder",
                "at": "2026-11-12T18:00:00+00:00",
                "taskId": "T1",
                "listId": CHORES,
            }
        }
    )
    server.stream.put_nowait(
        {
            "notification": {
                "id": "N2",
                "kind": "assigned",
                "taskId": "T1",
                "listId": CHORES,
                "actorId": "01USERSAMAAAAAAAAAAAAAAAAA",
            }
        }
    )
    await asyncio.sleep(0.05)
    await hass.async_block_till_done()

    assert [(e["type"], e["title"], e["list_name"], e["by"]) for e in heard] == [
        ("reminder", "Take out the bins", "Chores", None),
        ("assigned", "Take out the bins", "Chores", "Sam"),
    ]
    assert heard[0]["username"] == "ben"
    # A notification is not a change: nothing is read again for it.
    assert len(server.calls) == refreshes


async def test_people_give_assignees_their_names(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry, hass_ws_client: WebSocketGenerator
) -> None:
    server.put_task("T1", "Dishes")
    await refresh(hass, loaded)
    assert server.calls.count(("people", None)) == 1  # read once, not on every refresh

    await _call(hass, "update_task", {"task_id": "T1", "assign": ["sam", "me"]})
    assert server.writes()[-1] == (
        "update",
        {"id": "T1", "assignees": ["user:01USERSAMAAAAAAAAAAAAAAAAA", "user:01USERAAAAAAAAAAAAAAAAAAAA"]},
    )
    with pytest.raises(ServiceValidationError) as raised:
        await _call(hass, "update_task", {"task_id": "T1", "assign": ["Nobody"]})
    assert raised.value.translation_key == "person_not_found"

    ws = await hass_ws_client(hass)
    await ws.send_json_auto_id({"type": "pecklist/subscribe", "entry_id": loaded.entry_id})
    await ws.receive_json()
    snapshot = (await ws.receive_json())["event"]
    assert [p["name"] for p in snapshot["people"]] == ["Ben", "Sam"]


async def test_an_older_server_without_people_still_loads(
    hass: HomeAssistant, server: FakePeckList, entry: MockConfigEntry
) -> None:
    server.persons = None
    server.put_task("T1", "Dishes", assignees=["user:01USERSAMAAAAAAAAAAAAAAAAA"])
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await refresh(hass, entry)
    await refresh(hass, entry)
    assert entry.runtime_data.people == {}
    assert server.calls.count(("people", None)) == 1  # asked once, then left alone
    assert hass.states.get("todo.pecklist_ben_chores").state == "1"


async def test_lists_come_in_the_apps_order(
    hass: HomeAssistant, server: FakePeckList, entry: MockConfigEntry
) -> None:
    server.add_list("01LISTZEBRAAAAAAAAAAAAAAAA", "Zebra", order="A")
    server.add_list("01LISTAPPLEAAAAAAAAAAAAAAA", "Apple", order="B")
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    names = [lst["name"] for lst in entry.runtime_data.visible_lists()]
    # The inbox first, lists with an order by it, the rest (an older server's) by name.
    assert names == ["Inbox", "Zebra", "Apple", "Chores", "Household"]


async def test_a_refused_stream_leaves_polling(
    hass: HomeAssistant, server: FakePeckList, entry: MockConfigEntry
) -> None:
    server.stream_refusal = PeckListApiError(429, "rate_limited", "too many streams", retry_after=25)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    await asyncio.sleep(0.05)
    assert entry.state is ConfigEntryState.LOADED
    assert not entry.runtime_data.stream_connected
    assert entry.runtime_data.update_interval == POLL_WITHOUT_STREAM
    assert server.stream_opens == 1  # waiting as Retry-After said, not hammering


async def test_a_revoked_key_asks_for_a_new_one(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry
) -> None:
    server.valid = False
    await refresh(hass, loaded)
    flows = hass.config_entries.flow.async_progress_by_handler(DOMAIN)
    assert [flow["context"]["source"] for flow in flows] == ["reauth"]


async def test_a_lost_cursor_starts_over(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry
) -> None:
    server.put_task("T1", "Kept")
    await refresh(hass, loaded)
    server.cursor_lost = True
    await refresh(hass, loaded)
    assert loaded.runtime_data.last_update_success
    assert list(loaded.runtime_data.tasks) == ["T1"]
    assert server.calls[-1] == ("changes", None)


async def test_an_unreachable_server_makes_entities_unavailable(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry
) -> None:
    server.offline = True
    await refresh(hass, loaded)
    assert hass.states.get("todo.pecklist_ben_chores").state == "unavailable"
    server.offline = False
    await refresh(hass, loaded)
    assert hass.states.get("todo.pecklist_ben_chores").state == "0"


async def test_diagnostics_leave_out_the_key_and_the_tasks(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry, hass_client: ClientSessionGenerator
) -> None:
    server.put_task("T1", "A private thing")
    await refresh(hass, loaded)
    assert await async_setup_component(hass, "diagnostics", {})
    client = await hass_client()
    response = await client.get(f"/api/diagnostics/config_entry/{loaded.entry_id}")
    assert response.status == 200
    text = await response.text()
    assert "pl_secret" not in text
    assert "A private thing" not in text
    data = (await response.json())["data"]
    assert data["entry"]["data"]["api_key"] == "**REDACTED**"
    assert data["counts"]["tasks"] == 1
