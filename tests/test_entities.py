"""The to-do lists, the calendar and the sensors."""

from __future__ import annotations

from datetime import datetime
import sys
import threading
from unittest.mock import patch

from freezegun.api import FrozenDateTimeFactory
from homeassistant.components.todo import TodoListEntityFeature
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from .conftest import CHORES, SHARED, FakePeckList, refresh

CHORES_ENTITY = "todo.pecklist_ben_chores"
NOW = "2026-11-12 18:00:00+00:00"  # noon in Chicago


@pytest.fixture(autouse=True)
def noon(freezer: FrozenDateTimeFactory) -> None:
    freezer.move_to(NOW)


@pytest.fixture
def seeded(server: FakePeckList) -> FakePeckList:
    server.put_task(
        "T1",
        "Mow the lawn",
        schedule={"start": "2026-11-12", "end": None, "allDay": True, "timeZone": "America/Chicago"},
        priority=2,
    )
    server.put_task(
        "T2",
        "Pay rent",
        due={"at": "2026-11-10", "allDay": True, "timeZone": "America/Chicago"},
        notes="Landlord portal",
    )
    server.put_task(
        "T3",
        "Dentist",
        schedule={
            "start": "2026-11-14T09:00",
            "end": "2026-11-14T10:00",
            "allDay": False,
            "timeZone": "America/Chicago",
        },
    )
    server.put_task("T4", "Someday", assignees=["user:01USERAAAAAAAAAAAAAAAAAAAA"])
    server.put_task("T5", "Old news", status="done", completedAt="2026-10-01T12:00:00.000Z")
    server.put_task("T6", "Just done", status="done", completedAt="2026-11-11T12:00:00.000Z")
    server.put_task(
        "T7", "Bins out", SHARED, due={"at": "2026-11-12", "allDay": True, "timeZone": "America/Chicago"}
    )
    return server


async def _items(hass: HomeAssistant, entity_id: str) -> list[dict]:
    answer = await hass.services.async_call(
        "todo", "get_items", {"entity_id": entity_id}, blocking=True, return_response=True
    )
    return answer[entity_id]["items"]


async def test_a_to_do_list_per_list(
    hass: HomeAssistant, seeded: FakePeckList, loaded: MockConfigEntry
) -> None:
    assert hass.states.get("todo.pecklist_ben_inbox").state == "0"
    chores = hass.states.get(CHORES_ENTITY)
    assert chores.state == "4"
    assert chores.attributes["color"] == "#5A8A4E"
    assert chores.attributes["friendly_name"] == "PeckList ben Chores"
    assert chores.attributes["supported_features"] & TodoListEntityFeature.CREATE_TODO_ITEM

    items = await _items(hass, CHORES_ENTITY)
    assert [i["summary"] for i in items] == ["Pay rent", "Mow the lawn", "Dentist", "Someday", "Just done"]
    assert items[0] == {
        "summary": "Pay rent",
        "uid": "T2",
        "status": "needs_action",
        "due": "2026-11-10",
        "description": "Landlord portal",
    }
    assert items[2]["due"] == "2026-11-14T09:00:00-06:00"
    assert items[4]["status"] == "completed"


async def test_a_list_you_may_only_view_is_read_only(
    hass: HomeAssistant, seeded: FakePeckList, loaded: MockConfigEntry
) -> None:
    household = hass.states.get("todo.pecklist_ben_household")
    assert household.state == "1"
    assert household.attributes["supported_features"] == 0
    assert household.attributes["role"] == "viewer"


async def test_a_read_only_key_makes_every_list_read_only(
    hass: HomeAssistant, seeded: FakePeckList, entry: MockConfigEntry
) -> None:
    seeded.scopes = ["tasks:read"]
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert hass.states.get(CHORES_ENTITY).attributes["supported_features"] == 0


async def test_adding_from_the_to_do_card(
    hass: HomeAssistant, seeded: FakePeckList, loaded: MockConfigEntry
) -> None:
    await hass.services.async_call(
        "todo",
        "add_item",
        {
            "entity_id": CHORES_ENTITY,
            "item": "Water plants",
            "due_date": "2026-11-20",
            "description": "Ferns too",
        },
        blocking=True,
    )
    assert seeded.writes() == [
        (
            "create",
            {
                "title": "Water plants",
                "listId": CHORES,
                "notes": "Ferns too",
                "schedule": {"start": "2026-11-20", "end": None, "allDay": True},
            },
        )
    ]
    # Shown at once, before any poll.
    assert "Water plants" in [i["summary"] for i in await _items(hass, CHORES_ENTITY)]


async def test_an_edit_sends_only_what_changed(
    hass: HomeAssistant, seeded: FakePeckList, loaded: MockConfigEntry
) -> None:
    await hass.services.async_call(
        "todo",
        "update_item",
        {"entity_id": CHORES_ENTITY, "item": "Pay rent", "rename": "Pay the rent"},
        blocking=True,
    )
    assert seeded.writes() == [("update", {"id": "T2", "title": "Pay the rent"})]

    seeded.calls.clear()
    await hass.services.async_call(
        "todo",
        "update_item",
        {"entity_id": CHORES_ENTITY, "item": "T2", "due_datetime": "2026-11-20 08:30:00"},
        blocking=True,
    )
    assert seeded.writes() == [
        (
            "update",
            {"id": "T2", "due": {"at": "2026-11-20T08:30", "allDay": False, "timeZone": "America/Chicago"}},
        )
    ]


async def test_checking_off_and_reopening(
    hass: HomeAssistant, seeded: FakePeckList, loaded: MockConfigEntry
) -> None:
    events = []
    hass.bus.async_listen("pecklist_task", lambda event: events.append(event.data))

    await hass.services.async_call(
        "todo",
        "update_item",
        {"entity_id": CHORES_ENTITY, "item": "T1", "status": "completed"},
        blocking=True,
    )
    await hass.async_block_till_done()
    assert seeded.writes() == [("complete", {"id": "T1", "status": "done"})]
    assert hass.states.get(CHORES_ENTITY).state == "3"
    assert [(e["type"], e["title"], e["list_name"]) for e in events] == [
        ("completed", "Mow the lawn", "Chores")
    ]

    await hass.services.async_call(
        "todo",
        "update_item",
        {"entity_id": CHORES_ENTITY, "item": "T1", "status": "needs_action"},
        blocking=True,
    )
    await hass.async_block_till_done()
    assert seeded.writes()[-1] == ("reopen", "T1")
    assert events[-1]["type"] == "reopened"


async def test_deleting(hass: HomeAssistant, seeded: FakePeckList, loaded: MockConfigEntry) -> None:
    await hass.services.async_call(
        "todo", "remove_item", {"entity_id": CHORES_ENTITY, "item": ["T4"]}, blocking=True
    )
    await hass.async_block_till_done()
    assert ("delete", "T4") in seeded.writes()
    assert "Someday" not in [i["summary"] for i in await _items(hass, CHORES_ENTITY)]


async def test_a_refused_change_is_an_error_with_the_reason(
    hass: HomeAssistant, seeded: FakePeckList, loaded: MockConfigEntry
) -> None:
    seeded.scopes = ["tasks:read"]  # the key was narrowed after setup
    with pytest.raises(HomeAssistantError) as raised:
        await hass.services.async_call(
            "todo", "update_item", {"entity_id": CHORES_ENTITY, "item": "T1", "rename": "x"}, blocking=True
        )
    assert raised.value.translation_key == "read_only_key"


async def test_lists_come_and_go(hass: HomeAssistant, seeded: FakePeckList, loaded: MockConfigEntry) -> None:
    seeded.add_list("01LISTNEWAAAAAAAAAAAAAAAAA", "Garden")
    await refresh(hass, loaded)
    assert hass.states.get("todo.pecklist_ben_garden") is not None

    seeded.revoke(SHARED)
    seeded.add_list(CHORES, "Chores", archived=True)
    await refresh(hass, loaded)
    registry = er.async_get(hass)
    assert registry.async_get("todo.pecklist_ben_household") is None
    assert registry.async_get(CHORES_ENTITY) is None
    assert registry.async_get("todo.pecklist_ben_garden") is not None


async def test_calendar(hass: HomeAssistant, seeded: FakePeckList, loaded: MockConfigEntry) -> None:
    state = hass.states.get("calendar.pecklist_ben_tasks")
    # Now: the all-day task that is on today (overdue ones are past).
    assert state.attributes["message"] in ("Bins out", "Mow the lawn")
    assert state.state == "on"

    answer = await hass.services.async_call(
        "calendar",
        "get_events",
        {
            "entity_id": "calendar.pecklist_ben_tasks",
            "start_date_time": "2026-11-09 00:00:00",
            "end_date_time": "2026-11-16 00:00:00",
        },
        blocking=True,
        return_response=True,
    )
    events = answer["calendar.pecklist_ben_tasks"]["events"]
    assert [(e["summary"], e["start"], e["end"]) for e in events] == [
        ("Pay rent", "2026-11-10", "2026-11-11"),
        ("Bins out", "2026-11-12", "2026-11-13"),
        ("Mow the lawn", "2026-11-12", "2026-11-13"),
        ("Dentist", "2026-11-14T09:00:00-06:00", "2026-11-14T10:00:00-06:00"),
    ]
    assert events[3]["location"] == "Chores"


async def test_sensors(
    hass: HomeAssistant, seeded: FakePeckList, loaded: MockConfigEntry, freezer: FrozenDateTimeFactory
) -> None:
    def value(key: str) -> str:
        return hass.states.get(f"sensor.pecklist_ben_{key}").state

    assert (
        value("due_today"),
        value("overdue"),
        value("upcoming"),
        value("assigned_to_me"),
        value("open_tasks"),
    ) == (
        "2",
        "1",
        "1",
        "1",
        "5",
    )
    listed = hass.states.get("sensor.pecklist_ben_overdue").attributes["tasks"]
    assert listed == [
        {"id": "T2", "title": "Pay rent", "date": "2026-11-10", "list": "Chores", "priority": 0}
    ]

    # The per-list sensors exist but are off until someone turns them on.
    registry = er.async_get(hass)
    per_list = registry.async_get("sensor.pecklist_ben_chores_open_tasks")
    assert per_list is not None and per_list.disabled

    # Midnight moves today's tasks to overdue with no change on the server.
    freezer.move_to("2026-11-13 06:00:05+00:00")
    loaded.runtime_data.async_day_changed(datetime.now(dt_util.UTC))
    await hass.async_block_till_done()
    assert (value("due_today"), value("overdue")) == ("0", "3")


# Opens of tz files, by thread, while a test listens. An audit hook sees opens made in C too,
# which zoneinfo does; audit hooks can't be removed, so one is added and switched on and off.
_TZ_OPENS: list[tuple[int, str]] | None = None
_TZ_HOOKED = False


def _tz_open_hook(event: str, args: tuple) -> None:
    if _TZ_OPENS is not None and event == "open" and "zoneinfo" in str(args[0]):
        _TZ_OPENS.append((threading.get_ident(), str(args[0])))


async def test_task_zones_are_loaded_off_the_event_loop(
    hass: HomeAssistant, server: FakePeckList, entry: MockConfigEntry
) -> None:
    """Loading a zone reads a file: each zone a task names is loaded once, in the executor."""
    global _TZ_OPENS, _TZ_HOOKED
    if not _TZ_HOOKED:
        sys.addaudithook(_tz_open_hook)
        _TZ_HOOKED = True
    asked: list[str] = []
    real = dt_util.async_get_time_zone

    async def spy(name: str):
        asked.append(name)
        return await real(name)

    def at(when: str, zone: str) -> dict:
        return {"at": when, "allDay": False, "timeZone": zone}

    # Zones no other test loads, so each is read from disk here.
    server.put_task("TZ", "Call Kathmandu", due=at("2026-11-13T08:00", "Asia/Kathmandu"))
    server.put_task("TX", "Moon base", due=at("2026-11-13T08:00", "Mars/Base"))
    loop_thread = threading.get_ident()
    _TZ_OPENS = []
    try:
        with patch("custom_components.pecklist.coordinator.dt_util.async_get_time_zone", spy):
            assert await hass.config_entries.async_setup(entry.entry_id)
            await hass.async_block_till_done()
            items = {i["summary"]: i for i in await _items(hass, CHORES_ENTITY)}
            assert items["Call Kathmandu"]["due"] == "2026-11-13T08:00:00+05:45"
            # An unknown zone reads as Home Assistant's own.
            assert items["Moon base"]["due"] == "2026-11-13T08:00:00-06:00"
            assert sorted(asked) == ["Asia/Kathmandu", "Mars/Base"]

            # A zone first seen in a write's answer is loaded before the answer is used.
            await entry.runtime_data.async_update_task(
                "TZ", {"due": at("2026-11-13T08:00", "Pacific/Chatham")}
            )
            items = {i["summary"]: i for i in await _items(hass, CHORES_ENTITY)}
            assert items["Call Kathmandu"]["due"] == "2026-11-13T08:00:00+13:45"

            # Zones already loaded (or known to be unknown) are not asked for again.
            server.put_task("TZ2", "Kathmandu again", due=at("2026-11-14T08:00", "Asia/Kathmandu"))
            await refresh(hass, entry)
            assert sorted(asked) == ["Asia/Kathmandu", "Mars/Base", "Pacific/Chatham"]

            # The calendar reads the same zones.
            answer = await hass.services.async_call(
                "calendar",
                "get_events",
                {
                    "entity_id": "calendar.pecklist_ben_tasks",
                    "start_date_time": "2026-11-12 00:00:00",
                    "end_date_time": "2026-11-16 00:00:00",
                },
                blocking=True,
                return_response=True,
            )
            starts = {e["summary"]: e["start"] for e in answer["calendar.pecklist_ben_tasks"]["events"]}
            assert starts["Kathmandu again"] == "2026-11-14T08:00:00+05:45"
        opens = list(_TZ_OPENS)
    finally:
        _TZ_OPENS = None
    # The zone files were read, and never on the event loop.
    assert any("Kathmandu" in path for _, path in opens)
    assert any("Chatham" in path for _, path in opens)
    assert [path for thread, path in opens if thread == loop_thread] == []
