"""Actions for automations: add, complete, reopen, change, delete and look up tasks."""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
import voluptuous as vol

from .const import (
    DOMAIN,
    SERVICE_ADD_TASK,
    SERVICE_COMPLETE_TASK,
    SERVICE_DELETE_TASK,
    SERVICE_GET_TASKS,
    SERVICE_REOPEN_TASK,
    SERVICE_UPDATE_TASK,
)
from .coordinator import PeckListCoordinator
from .model import Task, date_change, is_open

ATTR_ENTRY = "config_entry_id"
ATTR_TEXT = "text"
ATTR_LIST = "list"
ATTR_TASK_ID = "task_id"
ATTR_TITLE = "title"
ATTR_STATUS = "status"
ATTR_NOTES = "notes"
ATTR_PRIORITY = "priority"
ATTR_DATE = "date"
ATTR_CLEAR_DATE = "clear_date"
ATTR_TAGS = "tags"
ATTR_ADD_TAGS = "add_tags"
ATTR_REMOVE_TAGS = "remove_tags"
ATTR_ASSIGN = "assign"
ATTR_FILTER = "filter"

PRIORITIES = {"none": 0, "low": 1, "medium": 2, "high": 3}
FILTERS = ("open", "today", "overdue", "upcoming", "assigned")

_ENTRY = {vol.Optional(ATTR_ENTRY): cv.string}
_WHICH = {
    vol.Optional(ATTR_TASK_ID): cv.string,
    vol.Optional(ATTR_TITLE): cv.string,
    vol.Optional(ATTR_LIST): cv.string,
}
_TAGS = vol.All(cv.ensure_list, [cv.string])

ADD_SCHEMA = vol.Schema(
    {
        **_ENTRY,
        vol.Required(ATTR_TEXT): vol.All(cv.string, vol.Length(min=1, max=1000)),
        vol.Optional(ATTR_LIST): cv.string,
    }
)
COMPLETE_SCHEMA = vol.Schema(
    {**_ENTRY, **_WHICH, vol.Optional(ATTR_STATUS, default="done"): vol.In(("done", "wontdo"))}
)
WHICH_SCHEMA = vol.Schema({**_ENTRY, **_WHICH})
UPDATE_SCHEMA = vol.Schema(
    {
        **_ENTRY,
        vol.Required(ATTR_TASK_ID): cv.string,
        vol.Optional(ATTR_TITLE): vol.All(cv.string, vol.Length(min=1)),
        vol.Optional(ATTR_NOTES): cv.string,
        vol.Optional(ATTR_PRIORITY): vol.In(tuple(PRIORITIES)),
        vol.Optional(ATTR_DATE): vol.Any(cv.date, cv.datetime),
        vol.Optional(ATTR_CLEAR_DATE): cv.boolean,
        vol.Optional(ATTR_LIST): cv.string,
        vol.Optional(ATTR_TAGS): _TAGS,
        vol.Optional(ATTR_ADD_TAGS): _TAGS,
        vol.Optional(ATTR_REMOVE_TAGS): _TAGS,
        vol.Optional(ATTR_ASSIGN): _TAGS,
    }
)
GET_SCHEMA = vol.Schema(
    {**_ENTRY, vol.Optional(ATTR_LIST): cv.string, vol.Optional(ATTR_FILTER, default="open"): vol.In(FILTERS)}
)


def _error(key: str, **placeholders: str) -> ServiceValidationError:
    return ServiceValidationError(
        translation_domain=DOMAIN, translation_key=key, translation_placeholders=placeholders
    )


def coordinator_for(hass: HomeAssistant, entry_id: str | None) -> PeckListCoordinator:
    """The account an action is for: the one named, or the only one there is."""
    loaded = [
        entry for entry in hass.config_entries.async_entries(DOMAIN) if entry.state is ConfigEntryState.LOADED
    ]
    if entry_id:
        for entry in loaded:
            if entry.entry_id == entry_id:
                return entry.runtime_data
        raise _error("entry_not_found")
    if len(loaded) == 1:
        return loaded[0].runtime_data
    raise _error("entry_needed" if loaded else "entry_not_found")


def _list_id(coordinator: PeckListCoordinator, name: str | None) -> str | None:
    if not name:
        return None
    lst = coordinator.find_list(name)
    if lst is None:
        raise _error("list_not_found", list=name)
    return lst["id"]


def _principals(coordinator: PeckListCoordinator, names: list[str]) -> list[str]:
    """People and groups by name, handle or id, as /people names them. An empty list unassigns."""
    found = []
    for name in names:
        wanted = name.strip().removeprefix("@").casefold()
        match = next(
            (
                person
                for person in coordinator.people.values()
                if wanted
                in (
                    str(person.get("name") or "").casefold(),
                    str(person.get("handle") or "").casefold(),
                    person["id"].casefold(),
                )
                or (wanted == "me" and person.get("me"))
            ),
            None,
        )
        if match is None:
            raise _error("person_not_found", person=name)
        found.append(match["id"])
    return found


def _task(coordinator: PeckListCoordinator, call: ServiceCall, want_open: bool | None) -> Task:
    """The task an action names: by id, or by title (and list) among open or closed ones."""
    task_id = call.data.get(ATTR_TASK_ID)
    if task_id:
        task = coordinator.tasks.get(task_id)
        if task is None:
            raise _error("not_found", detail=task_id)
        return task
    title = call.data.get(ATTR_TITLE)
    if not title:
        raise _error("task_needed")
    list_id = _list_id(coordinator, call.data.get(ATTR_LIST))
    wanted = title.strip().casefold()
    for task in coordinator.shown_tasks(list_id):
        if (want_open is None or is_open(task) == want_open) and str(
            task.get("title") or ""
        ).strip().casefold() == wanted:
            return task
    raise _error("not_found", detail=title)


@callback
def async_setup_services(hass: HomeAssistant) -> None:
    """Register PeckList's actions once, for every account."""

    async def add_task(call: ServiceCall) -> ServiceResponse:
        coordinator = coordinator_for(hass, call.data.get(ATTR_ENTRY))
        answer = await coordinator.async_quick_add(
            call.data[ATTR_TEXT], _list_id(coordinator, call.data.get(ATTR_LIST))
        )
        return {"task": answer.get("task")} if call.return_response else None

    async def complete_task(call: ServiceCall) -> ServiceResponse:
        coordinator = coordinator_for(hass, call.data.get(ATTR_ENTRY))
        task = _task(coordinator, call, want_open=True)
        answer = await coordinator.async_complete_task(task["id"], call.data[ATTR_STATUS])
        if not call.return_response:
            return None
        return {"completed": answer.get("completed"), "next": answer.get("next")}

    async def reopen_task(call: ServiceCall) -> ServiceResponse:
        coordinator = coordinator_for(hass, call.data.get(ATTR_ENTRY))
        task = _task(coordinator, call, want_open=False)
        reopened = await coordinator.async_reopen_task(task["id"])
        return {"task": reopened} if call.return_response else None

    async def update_task(call: ServiceCall) -> ServiceResponse:
        coordinator = coordinator_for(hass, call.data.get(ATTR_ENTRY))
        task = _task(coordinator, call, want_open=None)
        data = call.data
        changes: dict[str, Any] = {}
        if ATTR_TITLE in data:
            changes["title"] = data[ATTR_TITLE]
        if ATTR_NOTES in data:
            changes["notes"] = data[ATTR_NOTES]
        if ATTR_PRIORITY in data:
            changes["priority"] = PRIORITIES[data[ATTR_PRIORITY]]
        if ATTR_LIST in data:
            changes["listId"] = _list_id(coordinator, data[ATTR_LIST])
        for attr, field in (
            (ATTR_TAGS, "tags"),
            (ATTR_ADD_TAGS, "addTags"),
            (ATTR_REMOVE_TAGS, "removeTags"),
        ):
            if attr in data:
                changes[field] = data[attr]
        if ATTR_ASSIGN in data:
            changes["assignees"] = _principals(coordinator, data[ATTR_ASSIGN])
        zones = coordinator.zones()
        if data.get(ATTR_CLEAR_DATE):
            changes.update(date_change(task, None, zones, coordinator.date_field))
        elif ATTR_DATE in data:
            value: date | datetime = data[ATTR_DATE]
            if isinstance(value, datetime) and value.tzinfo is None:
                value = value.replace(tzinfo=zones.local)
            changes.update(date_change(task, value, zones, coordinator.date_field))
        if not changes:
            raise _error("nothing_to_change")
        updated = await coordinator.async_update_task(task["id"], changes)
        return {"task": updated} if call.return_response else None

    async def delete_task(call: ServiceCall) -> None:
        coordinator = coordinator_for(hass, call.data.get(ATTR_ENTRY))
        task = _task(coordinator, call, want_open=None)
        await coordinator.async_delete_task(task["id"])

    async def get_tasks(call: ServiceCall) -> ServiceResponse:
        coordinator = coordinator_for(hass, call.data.get(ATTR_ENTRY))
        counts = coordinator.counts(_list_id(coordinator, call.data.get(ATTR_LIST)))
        tasks = getattr(counts, call.data[ATTR_FILTER])
        return {"tasks": tasks}

    optional = SupportsResponse.OPTIONAL
    register = hass.services.async_register
    register(DOMAIN, SERVICE_ADD_TASK, add_task, ADD_SCHEMA, supports_response=optional)
    register(DOMAIN, SERVICE_COMPLETE_TASK, complete_task, COMPLETE_SCHEMA, supports_response=optional)
    register(DOMAIN, SERVICE_REOPEN_TASK, reopen_task, WHICH_SCHEMA, supports_response=optional)
    register(DOMAIN, SERVICE_UPDATE_TASK, update_task, UPDATE_SCHEMA, supports_response=optional)
    register(DOMAIN, SERVICE_DELETE_TASK, delete_task, WHICH_SCHEMA)
    register(DOMAIN, SERVICE_GET_TASKS, get_tasks, GET_SCHEMA, supports_response=SupportsResponse.ONLY)
