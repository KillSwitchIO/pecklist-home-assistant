"""Websocket commands for the PeckList dashboard card.

Home Assistant's to-do items carry a title, a date and a description. The card shows more
(priority, tags, sections, subtasks, assignees, list colors), so it asks here. It never talks to
PeckList itself: the API key stays in Home Assistant.

Any signed-in Home Assistant user may call these, just as any of them can see the entities.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from functools import wraps
from typing import Any

from homeassistant.components import websocket_api
from homeassistant.components.websocket_api import ActiveConnection
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_URL
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
import voluptuous as vol

from .const import CONF_HA_USER, DOMAIN
from .coordinator import PeckListCoordinator

# Bumped when a command's answer changes shape, so a card can tell an older integration.
API_VERSION = 1

# The task fields the card may set. Anything else in a write is refused before it leaves.
TITLE = vol.All(cv.string, vol.Length(min=1, max=2000))
TASK_FIELDS = {
    vol.Optional("title"): TITLE,
    vol.Optional("notes"): cv.string,
    vol.Optional("listId"): cv.string,
    vol.Optional("sectionId"): vol.Any(None, cv.string),
    vol.Optional("parentId"): vol.Any(None, cv.string),
    vol.Optional("priority"): vol.All(vol.Coerce(int), vol.Range(min=0, max=3)),
    vol.Optional("schedule"): vol.Any(None, dict),
    vol.Optional("due"): vol.Any(None, dict),
    vol.Optional("tags"): [cv.string],
    vol.Optional("assignees"): [cv.string],
    vol.Optional("pinned"): cv.boolean,
}

Handler = Callable[[HomeAssistant, ActiveConnection, dict[str, Any], PeckListCoordinator], Awaitable[Any]]


def _loaded(hass: HomeAssistant) -> list[Any]:
    return [
        entry for entry in hass.config_entries.async_entries(DOMAIN) if entry.state is ConfigEntryState.LOADED
    ]


def _with_account(func: Handler) -> Any:
    """Find the account a command names, and answer with the handler's result or its error."""

    @wraps(func)
    async def wrapper(hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any]) -> None:
        coordinator = next((e.runtime_data for e in _loaded(hass) if e.entry_id == msg["entry_id"]), None)
        if coordinator is None:
            connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "No such PeckList account")
            return
        try:
            result = await func(hass, connection, msg, coordinator)
        except HomeAssistantError as err:
            connection.send_error(msg["id"], "pecklist_error", str(err))
            return
        connection.send_result(msg["id"], result)

    return wrapper


def _account(entry: Any) -> dict[str, Any]:
    coordinator: PeckListCoordinator = entry.runtime_data
    return {
        "entry_id": entry.entry_id,
        "title": entry.title,
        "username": coordinator.username,
        "name": coordinator.display_name or coordinator.username,
        "user_id": coordinator.user_id,
        "url": entry.data[CONF_URL],
        "can_write": coordinator.can_write,
        "ha_user": entry.options.get(CONF_HA_USER),
    }


@websocket_api.websocket_command({vol.Required("type"): "pecklist/accounts"})
@callback
def ws_accounts(hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any]) -> None:
    """The connected accounts, and which one belongs to the person asking."""
    accounts = [_account(entry) for entry in _loaded(hass)]
    mine = next((a["entry_id"] for a in accounts if a["ha_user"] == connection.user.id), None)
    connection.send_result(msg["id"], {"version": API_VERSION, "accounts": accounts, "mine": mine})


def _snapshot(coordinator: PeckListCoordinator) -> dict[str, Any]:
    return {
        "revision": coordinator.data,
        "account": _account(coordinator.config_entry),
        "connected": coordinator.last_update_success,
        "live": coordinator.stream_connected,
        "completed_days": coordinator.completed_days,
        "time_zone": coordinator.hass.config.time_zone,
        "lists": coordinator.visible_lists(),
        "sections": list(coordinator.sections.values()),
        "tags": sorted(coordinator.tags.values(), key=lambda tag: str(tag.get("name") or "")),
        "tasks": coordinator.shown_tasks(),
    }


@websocket_api.websocket_command(
    {vol.Required("type"): "pecklist/subscribe", vol.Required("entry_id"): cv.string}
)
@callback
def ws_subscribe(hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any]) -> None:
    """One account's lists and tasks now, and again every time something changes."""
    coordinator = next((e.runtime_data for e in _loaded(hass) if e.entry_id == msg["entry_id"]), None)
    if coordinator is None:
        connection.send_error(msg["id"], websocket_api.ERR_NOT_FOUND, "No such PeckList account")
        return

    @callback
    def forward() -> None:
        connection.send_message(websocket_api.event_message(msg["id"], _snapshot(coordinator)))

    connection.subscriptions[msg["id"]] = coordinator.async_add_listener(forward)
    connection.send_result(msg["id"])
    forward()


@websocket_api.websocket_command(
    {
        vol.Required("type"): "pecklist/task/quick_add",
        vol.Required("entry_id"): cv.string,
        vol.Required("text"): vol.All(cv.string, vol.Length(min=1, max=1000)),
        vol.Optional("list_id"): cv.string,
    }
)
@websocket_api.async_response
@_with_account
async def ws_quick_add(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], coordinator: PeckListCoordinator
) -> Any:
    return await coordinator.async_quick_add(msg["text"], msg.get("list_id"))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "pecklist/task/create",
        vol.Required("entry_id"): cv.string,
        vol.Required("task"): vol.Schema(
            {
                vol.Required("title"): TITLE,
                **{key: value for key, value in TASK_FIELDS.items() if str(key) != "title"},
            }
        ),
    }
)
@websocket_api.async_response
@_with_account
async def ws_create(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], coordinator: PeckListCoordinator
) -> Any:
    return await coordinator.async_create_task(msg["task"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "pecklist/task/update",
        vol.Required("entry_id"): cv.string,
        vol.Required("task_id"): cv.string,
        vol.Required("changes"): vol.All(vol.Schema(TASK_FIELDS), vol.Length(min=1)),
    }
)
@websocket_api.async_response
@_with_account
async def ws_update(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], coordinator: PeckListCoordinator
) -> Any:
    return await coordinator.async_update_task(msg["task_id"], msg["changes"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "pecklist/task/complete",
        vol.Required("entry_id"): cv.string,
        vol.Required("task_id"): cv.string,
        vol.Optional("status", default="done"): vol.In(("done", "wontdo")),
    }
)
@websocket_api.async_response
@_with_account
async def ws_complete(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], coordinator: PeckListCoordinator
) -> Any:
    return await coordinator.async_complete_task(msg["task_id"], msg["status"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "pecklist/task/reopen",
        vol.Required("entry_id"): cv.string,
        vol.Required("task_id"): cv.string,
    }
)
@websocket_api.async_response
@_with_account
async def ws_reopen(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], coordinator: PeckListCoordinator
) -> Any:
    return await coordinator.async_reopen_task(msg["task_id"])


@websocket_api.websocket_command(
    {
        vol.Required("type"): "pecklist/task/delete",
        vol.Required("entry_id"): cv.string,
        vol.Required("task_id"): cv.string,
    }
)
@websocket_api.async_response
@_with_account
async def ws_delete(
    hass: HomeAssistant, connection: ActiveConnection, msg: dict[str, Any], coordinator: PeckListCoordinator
) -> Any:
    await coordinator.async_delete_task(msg["task_id"])
    return None


@callback
def async_setup_websocket(hass: HomeAssistant) -> None:
    for command in (
        ws_accounts,
        ws_subscribe,
        ws_quick_add,
        ws_create,
        ws_update,
        ws_complete,
        ws_reopen,
        ws_delete,
    ):
        websocket_api.async_register_command(hass, command)
