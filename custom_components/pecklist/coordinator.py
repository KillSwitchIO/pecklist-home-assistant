"""Keeps a copy of one PeckList account's tasks, fed by the changes feed and the live stream."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_API_KEY, CONF_URL
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import ConfigEntryAuthFailed, HomeAssistantError
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.debounce import Debouncer
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .api import (
    PeckListApiError,
    PeckListAuthError,
    PeckListClient,
    PeckListConnectionError,
    PeckListError,
)
from .const import (
    CONF_COMPLETED_DAYS,
    CONF_DATE_FIELD,
    DEFAULT_COMPLETED_DAYS,
    DEFAULT_DATE_FIELD,
    DOMAIN,
    EVENT_TASK,
    LOGGER,
    POLL_WITH_STREAM,
    POLL_WITHOUT_STREAM,
    SCOPE_WRITE,
    STREAM_RETRY_MAX,
    STREAM_RETRY_MIN,
    STREAM_SILENCE,
    UPCOMING_DAYS,
)
from .model import Task, is_open, parse_utc, sort_key, task_day

type PeckListConfigEntry = ConfigEntry[PeckListCoordinator]

# A first load pages through everything; this only stops a server that never says "no more".
MAX_PAGES = 400
# A task first seen within this long of being made counts as created (not as newly shared).
FRESH = timedelta(minutes=15)


@dataclass(frozen=True)
class Counts:
    """The numbers the sensors show."""

    open: list[Task]
    today: list[Task]
    overdue: list[Task]
    upcoming: list[Task]
    assigned: list[Task]


class PeckListCoordinator(DataUpdateCoordinator[int]):
    """One account's lists, sections, tags and tasks. Its data is a revision number."""

    config_entry: PeckListConfigEntry

    def __init__(self, hass: HomeAssistant, entry: PeckListConfigEntry) -> None:
        super().__init__(
            hass,
            LOGGER,
            config_entry=entry,
            name=f"{DOMAIN} {entry.title}",
            update_interval=POLL_WITHOUT_STREAM,
            # Batches a burst of changes into one read, and keeps reads well under once a second.
            request_refresh_debouncer=Debouncer(hass, LOGGER, cooldown=1.5, immediate=False),
        )
        self.client = PeckListClient(
            async_get_clientsession(hass), entry.data[CONF_URL], entry.data[CONF_API_KEY]
        )
        self.me: dict[str, Any] = {}
        self.display_name: str | None = None
        self.tasks: dict[str, Task] = {}
        self.lists: dict[str, dict[str, Any]] = {}
        self.sections: dict[str, dict[str, Any]] = {}
        self.tags: dict[str, dict[str, Any]] = {}
        self.cursor: str | None = None
        self.stream_connected = False
        self._revision = 0

    # Reading the account

    @property
    def user_id(self) -> str:
        return str(self.me.get("id") or "")

    @property
    def username(self) -> str:
        return str(self.me.get("username") or "")

    @property
    def can_write(self) -> bool:
        return SCOPE_WRITE in ((self.me.get("key") or {}).get("scopes") or [])

    @property
    def completed_days(self) -> int:
        return int(self.config_entry.options.get(CONF_COMPLETED_DAYS, DEFAULT_COMPLETED_DAYS))

    @property
    def date_field(self) -> str:
        return str(self.config_entry.options.get(CONF_DATE_FIELD, DEFAULT_DATE_FIELD))

    def visible_lists(self) -> list[dict[str, Any]]:
        """Lists that get a to-do entity: not archived."""
        return sorted(
            (lst for lst in self.lists.values() if not lst.get("archived")),
            key=lambda lst: (not lst.get("isInbox"), str(lst.get("name") or "").casefold()),
        )

    def list_writable(self, list_id: str | None) -> bool:
        lst = self.lists.get(list_id or "")
        return self.can_write and lst is not None and lst.get("role") in ("owner", "editor")

    def find_list(self, name_or_id: str) -> dict[str, Any] | None:
        """A list by id, else by name without regard to case."""
        if name_or_id in self.lists:
            return self.lists[name_or_id]
        wanted = name_or_id.strip().casefold()
        for lst in self.visible_lists():
            if str(lst.get("name") or "").casefold() == wanted:
                return lst
        return None

    def _recent(self, task: Task, today: date) -> bool:
        """An open task, or one closed within the days closed tasks stay shown."""
        if is_open(task):
            return True
        closed = parse_utc(task.get("completedAt"))
        if closed is None:
            return False
        return closed.astimezone(dt_util.DEFAULT_TIME_ZONE).date() >= today - timedelta(
            days=self.completed_days
        )

    def shown_tasks(self, list_id: str | None = None) -> list[Task]:
        """Open and recently closed tasks, sorted, of one list or of every list that is not archived."""
        today = dt_util.now().date()
        local = dt_util.DEFAULT_TIME_ZONE
        if list_id is None:
            hidden = {lid for lid, lst in self.lists.items() if lst.get("archived")}
            tasks = (t for t in self.tasks.values() if t.get("listId") not in hidden)
        else:
            tasks = (t for t in self.tasks.values() if t.get("listId") == list_id)
        return sorted((t for t in tasks if self._recent(t, today)), key=lambda t: sort_key(t, local))

    def counts(self, list_id: str | None = None) -> Counts:
        today = dt_util.now().date()
        local = dt_util.DEFAULT_TIME_ZONE
        horizon = today + timedelta(days=UPCOMING_DAYS)
        me = f"user:{self.user_id}"
        open_tasks = [t for t in self.shown_tasks(list_id) if is_open(t)]
        days = [(t, task_day(t, local)) for t in open_tasks]
        return Counts(
            open=open_tasks,
            today=[t for t, d in days if d == today],
            overdue=[t for t, d in days if d is not None and d < today],
            upcoming=[t for t, d in days if d is not None and today < d <= horizon],
            assigned=[t for t in open_tasks if me in (t.get("assignees") or [])],
        )

    # Loading

    async def _async_update_data(self) -> int:
        try:
            if not self.me or self.cursor is None:
                self.me = await self.client.me()
            for _ in range(MAX_PAGES):
                try:
                    page = await self.client.changes(self.cursor)
                except PeckListApiError as err:
                    if err.code != "invalid_cursor" or self.cursor is None:
                        raise
                    # The server no longer knows our place (restored from a backup): start over.
                    self._forget()
                    continue
                first = self.cursor is None
                self._apply_page(page, announce=not first)
                self.cursor = str(page["cursor"])
                if not page.get("more"):
                    break
        except PeckListAuthError as err:
            raise ConfigEntryAuthFailed(str(err)) from err
        except (PeckListError, KeyError, TypeError) as err:
            raise UpdateFailed(str(err) or type(err).__name__) from err
        self._revision += 1
        return self._revision

    def _forget(self) -> None:
        self.cursor = None
        self.tasks.clear()
        self.lists.clear()
        self.sections.clear()
        self.tags.clear()

    def _apply_page(self, page: dict[str, Any], announce: bool) -> None:
        for kind, store in (("lists", self.lists), ("sections", self.sections), ("tags", self.tags)):
            for item in page.get(kind) or []:
                if item.get("deletedAt"):
                    store.pop(item["id"], None)
                else:
                    store[item["id"]] = item
        for task in page.get("tasks") or []:
            self._apply_task(task, announce)
        for gone in page.get("revoked") or []:
            for store in (self.tasks, self.lists, self.sections, self.tags):
                store.pop(gone, None)

    def _apply_task(self, task: Task, announce: bool) -> None:
        old = self.tasks.get(task["id"])
        if task.get("deletedAt"):
            self.tasks.pop(task["id"], None)
            if announce and old is not None:
                self._announce("deleted", old)
            return
        self.tasks[task["id"]] = task
        if not announce:
            return
        if old is None:
            now = dt_util.utcnow()
            closed = parse_utc(task.get("completedAt"))
            made = parse_utc(task.get("createdAt"))
            if not is_open(task):
                # The closed copy a repeating task leaves behind.
                if closed is not None and now - closed < FRESH:
                    self._announce("completed", task)
            elif made is not None and now - made < FRESH:
                self._announce("created", task)
        elif is_open(old) and not is_open(task):
            self._announce("completed", task)
        elif not is_open(old) and is_open(task):
            self._announce("reopened", task)
        elif old.get("updatedAt") != task.get("updatedAt"):
            self._announce("updated", task)

    def _announce(self, kind: str, task: Task) -> None:
        """Tell automations what happened to a task."""
        lst = self.lists.get(task.get("listId") or "") or {}
        self.hass.bus.async_fire(
            EVENT_TASK,
            {
                "type": kind,
                "entry_id": self.config_entry.entry_id,
                "username": self.username,
                "task_id": task["id"],
                "title": task.get("title"),
                "status": task.get("status"),
                "list_id": task.get("listId"),
                "list_name": lst.get("name"),
                "tags": task.get("tags") or [],
                "priority": task.get("priority") or 0,
            },
        )

    # Writing. Each applies the server's answer at once; the stream's nudge then finds nothing new.

    @callback
    def _took(self, *tasks: Task | None) -> None:
        for task in tasks:
            if task:
                self._apply_task(task, announce=True)
        self._revision += 1
        self.async_update_listeners()

    async def async_create_task(self, fields: dict[str, Any]) -> Task:
        task = await self._write(self.client.create_task(fields))
        self._took(task)
        return task

    async def async_quick_add(self, text: str, list_id: str | None = None) -> dict[str, Any]:
        answer = await self._write(self.client.quick_add(text, list_id, self.hass.config.time_zone))
        self._took(answer.get("task"))
        if answer.get("task", {}).get("listId") not in self.lists or answer.get("tokens"):
            # Quick add can make tags (and names a list we may not have yet): read them soon.
            await self.async_request_refresh()
        return answer

    async def async_update_task(self, task_id: str, changes: dict[str, Any]) -> Task:
        task = await self._write(self.client.update_task(task_id, changes))
        self._took(task)
        return task

    async def async_complete_task(self, task_id: str, status: str = "done") -> dict[str, Any]:
        answer = await self._write(self.client.complete_task(task_id, status))
        self._took(answer.get("completed"), answer.get("next"))
        return answer

    async def async_reopen_task(self, task_id: str) -> Task:
        task = await self._write(self.client.reopen_task(task_id))
        self._took(task)
        return task

    async def async_delete_task(self, task_id: str) -> None:
        await self._write(self.client.delete_task(task_id))
        old = self.tasks.get(task_id)
        if old is not None:
            # Its subtasks go with it; the changes feed says which.
            self._took({**old, "deletedAt": dt_util.utcnow().isoformat()})
            await self.async_request_refresh()

    async def _write(self, call: Any) -> Any:
        """Run a write, turning PeckList's refusals into errors Home Assistant shows."""
        try:
            return await call
        except PeckListAuthError as err:
            self.config_entry.async_start_reauth(self.hass)
            raise HomeAssistantError(translation_domain=DOMAIN, translation_key="auth_failed") from err
        except PeckListApiError as err:
            key = {
                "scope": "read_only_key",
                "forbidden": "forbidden",
                "not_found": "not_found",
                "rate_limited": "rate_limited",
            }.get(err.code, "refused")
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key=key,
                translation_placeholders={"detail": err.detail or err.code},
            ) from err
        except PeckListConnectionError as err:
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="cannot_connect",
                translation_placeholders={"detail": str(err)},
            ) from err

    # Live updates

    @callback
    def _set_stream(self, connected: bool) -> None:
        if self.stream_connected == connected:
            return
        self.stream_connected = connected
        self.update_interval = POLL_WITH_STREAM if connected else POLL_WITHOUT_STREAM
        self.async_update_listeners()

    async def async_stream(self) -> None:
        """Listen for "something changed" for as long as the entry is loaded."""
        delay = STREAM_RETRY_MIN
        while True:
            try:
                async for event in self.client.events(STREAM_SILENCE):
                    if not event:
                        LOGGER.debug("Live updates connected for %s", self.config_entry.title)
                        self._set_stream(True)
                        delay = STREAM_RETRY_MIN
                    # On connect too: catch up on whatever changed while the stream was down.
                    await self.async_request_refresh()
            except PeckListAuthError:
                self._set_stream(False)
                self.config_entry.async_start_reauth(self.hass)
                return
            except PeckListApiError as err:
                LOGGER.debug("Live updates refused (%s); polling instead", err.code)
                delay = max(delay, err.retry_after or 0.0)
            except PeckListConnectionError as err:
                LOGGER.debug("Live updates lost (%s); polling until they are back", err)
            if self.stream_connected:
                self._set_stream(False)
                # The poll timer was set for the stream's long interval: bring it back in.
                await self.async_request_refresh()
            await asyncio.sleep(delay)
            delay = min(delay * 2, STREAM_RETRY_MAX)

    # A day rolling over changes "today" and "overdue" with no change on the server.

    @callback
    def async_day_changed(self, _now: datetime) -> None:
        self._revision += 1
        self.async_update_listeners()
