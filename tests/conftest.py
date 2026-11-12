"""Fixtures: a fake PeckList server behind the client's interface, and a connected entry."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator, Generator
from typing import Any
from unittest.mock import patch

from homeassistant.const import CONF_API_KEY, CONF_URL
from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.pecklist.api import PeckListApiError, PeckListAuthError, PeckListScopeError
from custom_components.pecklist.const import DOMAIN

URL = "https://tasks.example.com"
USER_ID = "01USERAAAAAAAAAAAAAAAAAAAA"
INBOX = "01LISTINBOXAAAAAAAAAAAAAAA"
CHORES = "01LISTCHORESAAAAAAAAAAAAAA"
SHARED = "01LISTSHAREDAAAAAAAAAAAAAA"


class FakePeckList:
    """An in-memory PeckList that answers as /api/v1 does, with a changes feed."""

    def __init__(self) -> None:
        self.user_id = USER_ID
        self.username = "ben"
        self.scopes = ["tasks:read", "tasks:write"]
        self.valid = True
        self.offline = False
        self.calls: list[tuple[str, Any]] = []
        self.log: list[tuple[str, dict[str, Any]]] = []
        self.revoked: list[tuple[int, str]] = []
        self.tasks: dict[str, dict[str, Any]] = {}
        self.cursor_lost = False
        self._n = 0
        self.stream: asyncio.Queue[dict[str, Any] | Exception | None] = asyncio.Queue()
        self.stream_opens = 0
        self.stream_refusal: Exception | None = None
        self.add_list(INBOX, "Inbox", isInbox=True)
        self.add_list(CHORES, "Chores", color="#5A8A4E")
        self.add_list(SHARED, "Household", role="viewer", shared=True)

    # Seeding

    def _stamp(self) -> str:
        self._n += 1
        return f"2026-11-01T00:00:{self._n % 60:02d}.{self._n:03d}Z"

    def add_list(self, list_id: str, name: str, **extra: Any) -> dict[str, Any]:
        lst = {
            "id": list_id,
            "name": name,
            "color": None,
            "folderId": None,
            "archived": False,
            "isInbox": False,
            "shared": False,
            "role": "owner",
            "createdAt": self._stamp(),
            "updatedAt": self._stamp(),
            "deletedAt": None,
            **extra,
        }
        self.log.append(("lists", lst))
        return lst

    def add_section(self, section_id: str, list_id: str, name: str) -> None:
        self.log.append(("sections", {"id": section_id, "listId": list_id, "name": name, "deletedAt": None}))

    def add_tag(self, name: str) -> None:
        self.log.append(("tags", {"id": f"tag-{name}", "name": name, "color": "#F2A7B5", "deletedAt": None}))

    def put_task(self, task_id: str, title: str, list_id: str = CHORES, **extra: Any) -> dict[str, Any]:
        """Make or change a task as another device would."""
        old = self.tasks.get(task_id)
        task = {
            "id": task_id,
            "notes": "",
            "listId": list_id,
            "sectionId": None,
            "parentId": None,
            "status": "open",
            "completedAt": None,
            "completedBy": None,
            "priority": 0,
            "schedule": None,
            "due": None,
            "tags": [],
            "assignees": [],
            "recurrence": None,
            "progress": 0,
            "pinned": False,
            "createdAt": "2026-11-01T00:00:00.000Z",
            "createdBy": self.user_id,
            "deletedAt": None,
            **(old or {}),
            **extra,
            "title": title,
        }
        task["updatedAt"] = self._stamp()
        self.tasks[task_id] = task
        self.log.append(("tasks", dict(task)))
        return task

    def revoke(self, item_id: str) -> None:
        self.revoked.append((len(self.log), item_id))
        self.log.append(("none", {}))

    # The client's interface

    def _guard(self, write: bool = False) -> None:
        if self.offline:
            from custom_components.pecklist.api import PeckListConnectionError

            raise PeckListConnectionError("offline")
        if not self.valid:
            raise PeckListAuthError(401, "unauthorized", "sign in")
        if write and "tasks:write" not in self.scopes:
            raise PeckListScopeError(403, "scope", "needs tasks:write")

    async def me(self) -> dict[str, Any]:
        self._guard()
        return {
            "id": self.user_id,
            "username": self.username,
            "role": "user",
            "key": {"id": "k1", "name": "ha", "scopes": list(self.scopes)},
        }

    async def changes(self, cursor: str | None) -> dict[str, Any]:
        self._guard()
        self.calls.append(("changes", cursor))
        if cursor and self.cursor_lost:
            self.cursor_lost = False
            raise PeckListApiError(400, "invalid_cursor", "not ours")
        start = int(cursor) if cursor else 0
        page: dict[str, Any] = {
            "cursor": str(len(self.log)),
            "more": False,
            "tasks": [],
            "lists": [],
            "sections": [],
            "tags": [],
            "revoked": [gone for at, gone in self.revoked if at >= start],
        }
        latest: dict[tuple[str, str], dict[str, Any]] = {}
        for kind, item in self.log[start:]:
            if kind != "none":
                latest[(kind, item["id"])] = item
        for (kind, _), item in latest.items():
            if start == 0 and item.get("deletedAt"):
                continue
            page[kind].append(item)
        return page

    def _writable(self, task_id: str) -> dict[str, Any]:
        self._guard(write=True)
        task = self.tasks.get(task_id)
        if task is None or task.get("deletedAt"):
            raise PeckListApiError(404, "not_found", "no such task")
        if task["listId"] == SHARED:
            raise PeckListApiError(403, "forbidden", "a viewer cannot change tasks")
        return task

    async def create_task(self, fields: dict[str, Any]) -> dict[str, Any]:
        self._guard(write=True)
        self.calls.append(("create", fields))
        task_id = fields.get("id") or f"01TASKNEW{len(self.tasks):017d}"
        extra = {k: v for k, v in fields.items() if k not in ("id", "title", "listId")}
        return dict(self.put_task(task_id, fields["title"], fields.get("listId") or INBOX, **extra))

    async def quick_add(
        self, text: str, list_id: str | None = None, time_zone: str | None = None
    ) -> dict[str, Any]:
        self._guard(write=True)
        self.calls.append(("quick", {"text": text, "listId": list_id, "timeZone": time_zone}))
        title = " ".join(w for w in text.split() if w[0] not in "#^!")
        tags = [w[1:] for w in text.split() if w.startswith("#")]
        task = self.put_task(f"01TASKQUICK{len(self.tasks):015d}", title, list_id or INBOX, tags=tags)
        return {"task": dict(task), "tokens": [{"kind": "tag"}] if tags else []}

    async def update_task(self, task_id: str, changes: dict[str, Any]) -> dict[str, Any]:
        task = self._writable(task_id)
        self.calls.append(("update", {"id": task_id, **changes}))
        merged = {**task, **changes}
        extra = {k: v for k, v in changes.items() if k not in ("title", "listId")}
        return dict(self.put_task(task_id, merged["title"], merged["listId"], **extra))

    async def complete_task(self, task_id: str, status: str = "done") -> dict[str, Any]:
        task = self._writable(task_id)
        self.calls.append(("complete", {"id": task_id, "status": status}))
        done = self.put_task(
            task_id, task["title"], task["listId"], status=status, completedAt="2026-11-12T12:00:00.000Z"
        )
        return {"completed": dict(done), "next": None}

    async def reopen_task(self, task_id: str) -> dict[str, Any]:
        task = self._writable(task_id)
        self.calls.append(("reopen", task_id))
        return dict(self.put_task(task_id, task["title"], task["listId"], status="open", completedAt=None))

    async def delete_task(self, task_id: str) -> None:
        task = self._writable(task_id)
        self.calls.append(("delete", task_id))
        self.put_task(task_id, task["title"], task["listId"], deletedAt="2026-11-12T12:00:00.000Z")

    async def events(self, silence: float) -> AsyncIterator[dict[str, Any]]:
        self.stream_opens += 1
        if self.stream_refusal is not None:
            raise self.stream_refusal
        self._guard()
        yield {}
        while True:
            item = await self.stream.get()
            if item is None:
                return
            if isinstance(item, Exception):
                raise item
            yield item

    def writes(self) -> list[tuple[str, Any]]:
        return [call for call in self.calls if call[0] != "changes"]


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: None) -> None:
    """Let Home Assistant load custom_components/pecklist."""


@pytest.fixture(autouse=True)
async def chicago(hass: HomeAssistant) -> None:
    await hass.config.async_set_time_zone("America/Chicago")


@pytest.fixture
def server() -> Generator[FakePeckList]:
    fake = FakePeckList()
    with (
        patch("custom_components.pecklist.coordinator.PeckListClient", return_value=fake),
        patch("custom_components.pecklist.config_flow.PeckListClient", return_value=fake),
        patch("custom_components.pecklist.coordinator.STREAM_RETRY_MIN", 0.01),
    ):
        yield fake


@pytest.fixture
def entry(hass: HomeAssistant) -> MockConfigEntry:
    config_entry = MockConfigEntry(
        domain=DOMAIN,
        title="ben (tasks.example.com)",
        unique_id=f"tasks.example.com/{USER_ID}",
        data={CONF_URL: URL, CONF_API_KEY: "pl_secret"},
    )
    config_entry.add_to_hass(hass)
    return config_entry


@pytest.fixture
async def loaded(hass: HomeAssistant, server: FakePeckList, entry: MockConfigEntry) -> MockConfigEntry:
    """The entry set up against the fake server."""
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def refresh(hass: HomeAssistant, entry: MockConfigEntry) -> None:
    """Read the changes feed now, as the poll or a stream nudge would."""
    await entry.runtime_data.async_refresh()
    await hass.async_block_till_done()
