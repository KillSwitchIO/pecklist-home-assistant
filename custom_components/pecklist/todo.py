"""One to-do list entity for each PeckList list."""

from __future__ import annotations

from typing import Any

from homeassistant.components.todo import (
    TodoItem,
    TodoItemStatus,
    TodoListEntity,
    TodoListEntityFeature,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .coordinator import PeckListConfigEntry, PeckListCoordinator
from .entity import PeckListEntity
from .model import date_change, due_value, is_open

PARALLEL_UPDATES = 0

WRITE_FEATURES = (
    TodoListEntityFeature.CREATE_TODO_ITEM
    | TodoListEntityFeature.UPDATE_TODO_ITEM
    | TodoListEntityFeature.DELETE_TODO_ITEM
    | TodoListEntityFeature.SET_DUE_DATE_ON_ITEM
    | TodoListEntityFeature.SET_DUE_DATETIME_ON_ITEM
    | TodoListEntityFeature.SET_DESCRIPTION_ON_ITEM
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: PeckListConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Add an entity per list, and keep up as lists come and go."""
    coordinator = entry.runtime_data
    known: set[str] = set()

    @callback
    def sync_lists() -> None:
        current = {lst["id"] for lst in coordinator.visible_lists()}
        new = current - known
        if new:
            known.update(new)
            async_add_entities(PeckListTodoList(coordinator, list_id) for list_id in new)
        gone = known - current
        if gone:
            # Deleted, archived or no longer shared: its entity goes too.
            registry = er.async_get(hass)
            for list_id in gone:
                known.discard(list_id)
                entity_id = registry.async_get_entity_id("todo", DOMAIN, f"{entry.entry_id}_list_{list_id}")
                if entity_id:
                    registry.async_remove(entity_id)

    sync_lists()
    entry.async_on_unload(coordinator.async_add_listener(sync_lists))

    # Lists that went away while Home Assistant was not running.
    registry = er.async_get(hass)
    prefix = f"{entry.entry_id}_list_"
    for entity in er.async_entries_for_config_entry(registry, entry.entry_id):
        if (
            entity.domain == "todo"
            and entity.unique_id.startswith(prefix)
            and entity.unique_id[len(prefix) :] not in known
        ):
            registry.async_remove(entity.entity_id)


class PeckListTodoList(PeckListEntity, TodoListEntity):
    """A PeckList list. Read-only when the account may only view it, or the key may only read."""

    def __init__(self, coordinator: PeckListCoordinator, list_id: str) -> None:
        super().__init__(coordinator, f"list_{list_id}")
        self._list_id = list_id

    @property
    def _list(self) -> dict[str, Any]:
        return self.coordinator.lists.get(self._list_id) or {}

    @property
    def available(self) -> bool:
        return super().available and self._list_id in self.coordinator.lists

    @property
    def name(self) -> str | None:
        return self._list.get("name") or None

    @property
    def supported_features(self) -> TodoListEntityFeature:
        if self.coordinator.list_writable(self._list_id):
            return WRITE_FEATURES
        return TodoListEntityFeature(0)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        lst = self._list
        return {
            "list_id": self._list_id,
            "color": lst.get("color"),
            "role": lst.get("role"),
            "shared": bool(lst.get("shared")),
        }

    @property
    def todo_items(self) -> list[TodoItem]:
        local = dt_util.DEFAULT_TIME_ZONE
        return [
            TodoItem(
                uid=task["id"],
                summary=task.get("title") or "",
                status=TodoItemStatus.NEEDS_ACTION if is_open(task) else TodoItemStatus.COMPLETED,
                due=due_value(task, local),
                description=task.get("notes") or None,
            )
            for task in self.coordinator.shown_tasks(self._list_id)
        ]

    async def async_create_todo_item(self, item: TodoItem) -> None:
        coordinator = self.coordinator
        fields: dict[str, Any] = {"title": item.summary or "", "listId": self._list_id}
        if item.description:
            fields["notes"] = item.description
        if item.due is not None:
            fields.update(date_change(None, item.due, dt_util.DEFAULT_TIME_ZONE, coordinator.date_field))
        task = await coordinator.async_create_task(fields)
        if item.status == TodoItemStatus.COMPLETED:
            await coordinator.async_complete_task(task["id"])

    async def async_update_todo_item(self, item: TodoItem) -> None:
        """Send only what changed, so an edit made meanwhile to another field survives."""
        coordinator = self.coordinator
        task = coordinator.tasks.get(item.uid or "")
        if task is None or task.get("listId") != self._list_id:
            raise HomeAssistantError(
                translation_domain=DOMAIN,
                translation_key="not_found",
                translation_placeholders={"detail": item.summary or item.uid or ""},
            )
        local = dt_util.DEFAULT_TIME_ZONE
        changes: dict[str, Any] = {}
        if item.summary is not None and item.summary != task.get("title"):
            changes["title"] = item.summary
        if (item.description or "") != (task.get("notes") or ""):
            changes["notes"] = item.description or ""
        if item.due != due_value(task, local):
            changes.update(date_change(task, item.due, local, coordinator.date_field))
        if changes:
            await coordinator.async_update_task(task["id"], changes)
        if item.status == TodoItemStatus.COMPLETED and is_open(task):
            await coordinator.async_complete_task(task["id"])
        elif item.status == TodoItemStatus.NEEDS_ACTION and not is_open(task):
            await coordinator.async_reopen_task(task["id"])

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        for uid in uids:
            task = self.coordinator.tasks.get(uid)
            if task is not None and task.get("listId") == self._list_id:
                await self.coordinator.async_delete_task(uid)
