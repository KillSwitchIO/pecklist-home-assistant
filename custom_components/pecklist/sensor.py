"""Counts for automations and badges: due today, overdue, upcoming, assigned to me, open."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import SensorEntity, SensorEntityDescription, SensorStateClass
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .const import DOMAIN
from .coordinator import Counts, PeckListConfigEntry, PeckListCoordinator
from .entity import PeckListEntity
from .model import Task, due_value

PARALLEL_UPDATES = 0

# How many tasks a sensor names in its attributes.
LISTED = 20


@dataclass(frozen=True, kw_only=True)
class PeckListSensorDescription(SensorEntityDescription):
    pick: Callable[[Counts], list[Task]]


SENSORS = (
    PeckListSensorDescription(key="due_today", translation_key="due_today", pick=lambda c: c.today),
    PeckListSensorDescription(key="overdue", translation_key="overdue", pick=lambda c: c.overdue),
    PeckListSensorDescription(key="upcoming", translation_key="upcoming", pick=lambda c: c.upcoming),
    PeckListSensorDescription(key="assigned", translation_key="assigned", pick=lambda c: c.assigned),
    PeckListSensorDescription(key="open", translation_key="open", pick=lambda c: c.open),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: PeckListConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    coordinator = entry.runtime_data
    async_add_entities(PeckListSensor(coordinator, description) for description in SENSORS)

    # One "open tasks" sensor per list, off until someone turns it on.
    known: set[str] = set()

    @callback
    def sync_lists() -> None:
        current = {lst["id"] for lst in coordinator.visible_lists()}
        new = current - known
        if new:
            known.update(new)
            async_add_entities(PeckListListSensor(coordinator, list_id) for list_id in new)
        registry = er.async_get(hass)
        for list_id in known - current:
            known.discard(list_id)
            entity_id = registry.async_get_entity_id(
                "sensor", DOMAIN, f"{entry.entry_id}_list_open_{list_id}"
            )
            if entity_id:
                registry.async_remove(entity_id)

    sync_lists()
    entry.async_on_unload(coordinator.async_add_listener(sync_lists))


def _listed(coordinator: PeckListCoordinator, tasks: list[Task]) -> list[dict[str, Any]]:
    zones = coordinator.zones()
    out = []
    for task in tasks[:LISTED]:
        when = due_value(task, zones)
        lst = coordinator.lists.get(task.get("listId") or "") or {}
        out.append(
            {
                "id": task["id"],
                "title": task.get("title"),
                "date": when.isoformat() if when else None,
                "list": lst.get("name"),
                "priority": task.get("priority") or 0,
            }
        )
    return out


class PeckListSensor(PeckListEntity, SensorEntity):
    """A count over the whole account."""

    entity_description: PeckListSensorDescription
    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = "tasks"
    _unrecorded_attributes = frozenset({"tasks"})

    def __init__(self, coordinator: PeckListCoordinator, description: PeckListSensorDescription) -> None:
        super().__init__(coordinator, description.key)
        self.entity_description = description

    def _tasks(self) -> list[Task]:
        return self.entity_description.pick(self.coordinator.counts())

    @property
    def native_value(self) -> int:
        return len(self._tasks())

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"tasks": _listed(self.coordinator, self._tasks())}


class PeckListListSensor(PeckListEntity, SensorEntity):
    """Open tasks in one list."""

    _attr_state_class = SensorStateClass.MEASUREMENT
    _attr_native_unit_of_measurement = "tasks"
    _attr_entity_registry_enabled_default = False
    _attr_translation_key = "list_open"
    _unrecorded_attributes = frozenset({"tasks"})

    def __init__(self, coordinator: PeckListCoordinator, list_id: str) -> None:
        super().__init__(coordinator, f"list_open_{list_id}")
        self._list_id = list_id
        self._attr_translation_placeholders = {
            "list": str((coordinator.lists.get(list_id) or {}).get("name") or list_id)
        }

    @property
    def available(self) -> bool:
        return super().available and self._list_id in self.coordinator.lists

    @property
    def native_value(self) -> int:
        return len(self.coordinator.counts(self._list_id).open)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        counts = self.coordinator.counts(self._list_id)
        return {
            "list_id": self._list_id,
            "due_today": len(counts.today),
            "overdue": len(counts.overdue),
            "tasks": _listed(self.coordinator, counts.open),
        }
