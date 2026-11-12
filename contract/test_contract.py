"""The client against a real PeckList server. Run against a throwaway container, never a server
with real data:

    PECKLIST_URL=http://localhost:18190 PECKLIST_TOKEN=pl_... pytest contract -p no:homeassistant -p no:socket

It runs without the Home Assistant test plugin, which blocks the network.

It makes its own list and deletes the tasks it made. Skipped when the two variables are not set.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
import os
import uuid

import aiohttp
import pytest

from custom_components.pecklist.api import (
    PeckListApiError,
    PeckListAuthError,
    PeckListClient,
)

URL = os.environ.get("PECKLIST_URL", "")
TOKEN = os.environ.get("PECKLIST_TOKEN", "")

pytestmark = pytest.mark.skipif(not (URL and TOKEN), reason="PECKLIST_URL and PECKLIST_TOKEN are not set")


@pytest.fixture
async def client() -> AsyncIterator[PeckListClient]:
    async with aiohttp.ClientSession() as session:
        yield PeckListClient(session, URL, TOKEN)


@pytest.fixture
async def list_id(client: PeckListClient) -> str:
    made = await client._request("POST", "/lists", body={"name": f"HA contract {uuid.uuid4().hex[:8]}"})
    return made["id"]


async def _drain(client: PeckListClient, cursor: str | None) -> tuple[dict[str, dict], str]:
    """Follow the changes feed to its end, as the coordinator does."""
    tasks: dict[str, dict] = {}
    while True:
        page = await client.changes(cursor)
        for task in page["tasks"]:
            tasks[task["id"]] = task
        cursor = page["cursor"]
        if not page["more"]:
            return tasks, cursor


async def test_me_names_the_account_and_the_key(client: PeckListClient) -> None:
    me = await client.me()
    assert me["id"] and me["username"]
    assert "tasks:read" in me["key"]["scopes"] or "tasks:write" in me["key"]["scopes"]


async def test_people_name_the_account_itself(client: PeckListClient) -> None:
    people = await client.people()
    if people is None:
        pytest.skip("this server has no /api/v1/people yet")
    me = await client.me()
    mine = [person for person in people if person["me"]]
    assert [person["id"] for person in mine] == [f"user:{me['id']}"]
    assert mine[0]["name"] and mine[0]["kind"] == "user" and mine[0]["assignable"] is True


async def test_tasks_and_lists_carry_the_apps_order(client: PeckListClient, list_id: str) -> None:
    first = await client.create_task({"title": "Contract order 1", "listId": list_id})
    if "order" not in first:
        await client.delete_task(first["id"])
        pytest.skip("this server does not send order yet")
    second = await client.create_task({"title": "Contract order 2", "listId": list_id})
    assert first["order"] < second["order"]
    # A task sent back as it was read, order and all, is taken.
    again = await client.update_task(first["id"], {**first, "priority": 1})
    assert (again["priority"], again["order"]) == (1, first["order"])
    lists = (await client.changes(None))["lists"]
    assert all("order" in each and "icon" in each for each in lists)
    for task in (first, second):
        await client.delete_task(task["id"])


async def test_a_wrong_key_is_an_auth_error() -> None:
    async with aiohttp.ClientSession() as session:
        with pytest.raises(PeckListAuthError):
            await PeckListClient(session, URL, "pl_not_a_key").me()


async def test_a_task_from_make_to_delete_shows_in_the_changes_feed(
    client: PeckListClient, list_id: str
) -> None:
    _, cursor = await _drain(client, None)

    made = await client.create_task(
        {
            "title": "Contract task",
            "listId": list_id,
            "notes": "From Home Assistant",
            "schedule": {"start": "2026-11-20", "end": None, "allDay": True},
        }
    )
    assert (made["title"], made["listId"], made["status"]) == ("Contract task", list_id, "open")
    assert made["schedule"]["start"] == "2026-11-20"
    assert made["schedule"]["allDay"] is True

    changed = await client.update_task(
        made["id"],
        {"priority": 3, "due": {"at": "2026-11-21T08:30", "allDay": False, "timeZone": "America/Chicago"}},
    )
    assert changed["priority"] == 3
    assert changed["title"] == "Contract task"  # fields not sent stay
    assert (changed["due"]["at"], changed["due"]["timeZone"]) == ("2026-11-21T08:30", "America/Chicago")

    cleared = await client.update_task(made["id"], {"due": None})
    assert cleared["due"] is None

    seen, cursor = await _drain(client, cursor)
    assert seen[made["id"]]["priority"] == 3

    done = await client.complete_task(made["id"])
    assert done["completed"]["status"] == "done"
    assert done["next"] is None
    reopened = await client.reopen_task(made["id"])
    assert reopened["status"] == "open"

    await client.delete_task(made["id"])
    seen, _ = await _drain(client, cursor)
    assert seen[made["id"]]["deletedAt"]


async def test_completing_a_repeating_task_answers_the_next_one(client: PeckListClient, list_id: str) -> None:
    made = await client.create_task(
        {
            "title": "Contract repeat",
            "listId": list_id,
            "schedule": {"start": "2026-11-20", "end": None, "allDay": True},
            "recurrence": "FREQ=WEEKLY",
        }
    )
    done = await client.complete_task(made["id"])
    assert done["completed"]["status"] == "done"
    assert done["next"]["status"] == "open"
    assert done["next"]["schedule"]["start"] == "2026-11-27"
    for task in (done["completed"], done["next"]):
        await client.delete_task(task["id"])


async def test_quick_add_reads_the_line(client: PeckListClient, list_id: str) -> None:
    answer = await client.quick_add("Contract quick tomorrow #ha-contract !high", list_id, "America/Chicago")
    task = answer["task"]
    assert (task["title"], task["priority"], task["tags"], task["listId"]) == (
        "Contract quick",
        3,
        ["ha-contract"],
        list_id,
    )
    assert task["schedule"]["timeZone"] == "America/Chicago"
    assert {token["kind"] for token in answer["tokens"]} == {"date", "tag", "priority"}
    await client.delete_task(task["id"])


async def test_refusals_carry_their_code(client: PeckListClient) -> None:
    with pytest.raises(PeckListApiError) as missing:
        await client.update_task("01AAAAAAAAAAAAAAAAAAAAAAAA", {"title": "x"})
    assert (missing.value.status, missing.value.code) == (404, "not_found")
    with pytest.raises(PeckListApiError) as invalid:
        await client.create_task({"title": ""})
    assert invalid.value.code == "invalid_request"
    with pytest.raises(PeckListApiError) as cursor:
        await client.changes("not-a-cursor")
    assert cursor.value.code == "invalid_cursor"


async def test_the_stream_says_when_something_changed(client: PeckListClient, list_id: str) -> None:
    seen: list[dict] = []
    opened = asyncio.Event()

    async def listen() -> None:
        async for event in client.events(30):
            if not event:
                opened.set()
            else:
                seen.append(event)
                return

    listener = asyncio.create_task(listen())
    await asyncio.wait_for(opened.wait(), 10)
    made = await client.create_task({"title": "Contract nudge", "listId": list_id})
    await asyncio.wait_for(listener, 10)
    assert seen and "cursor" in seen[0]
    await client.delete_task(made["id"])
