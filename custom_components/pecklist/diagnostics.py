"""Diagnostics: what the integration holds, without the key or anyone's tasks."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.const import CONF_API_KEY
from homeassistant.core import HomeAssistant

from .coordinator import PeckListConfigEntry

TO_REDACT = {CONF_API_KEY}


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: PeckListConfigEntry
) -> dict[str, Any]:
    coordinator = entry.runtime_data
    key = coordinator.me.get("key") or {}
    return {
        "entry": {
            "data": async_redact_data(dict(entry.data), TO_REDACT),
            "options": dict(entry.options),
        },
        "account": {
            "role": coordinator.me.get("role"),
            "key_scopes": key.get("scopes"),
        },
        "live_updates": coordinator.stream_connected,
        "last_update_success": coordinator.last_update_success,
        "poll_interval_seconds": (
            coordinator.update_interval.total_seconds() if coordinator.update_interval else None
        ),
        "cursor": coordinator.cursor,
        "counts": {
            "tasks": len(coordinator.tasks),
            "open_tasks": sum(1 for t in coordinator.tasks.values() if t.get("status") == "open"),
            "lists": len(coordinator.lists),
            "sections": len(coordinator.sections),
            "tags": len(coordinator.tags),
        },
        "lists": [
            {
                "role": lst.get("role"),
                "shared": lst.get("shared"),
                "archived": lst.get("archived"),
                "is_inbox": lst.get("isInbox"),
            }
            for lst in coordinator.lists.values()
        ],
    }
