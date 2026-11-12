"""Dated open tasks as a read-only calendar."""

from __future__ import annotations

from datetime import date, datetime

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from .coordinator import PeckListConfigEntry, PeckListCoordinator
from .entity import PeckListEntity
from .model import Span, Task, is_open, span_of

PARALLEL_UPDATES = 0


async def async_setup_entry(
    hass: HomeAssistant,
    entry: PeckListConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities([PeckListCalendar(entry.runtime_data)])


def _moment(value: date | datetime) -> datetime:
    """Any start or end as a moment, to compare all-day and timed events."""
    if isinstance(value, datetime):
        return value
    return dt_util.start_of_local_day(value)


class PeckListCalendar(PeckListEntity, CalendarEntity):
    """Every open task with a date: all-day, timed, or a span of days."""

    _attr_translation_key = "tasks"

    def __init__(self, coordinator: PeckListCoordinator) -> None:
        super().__init__(coordinator, "calendar")

    def _events(self) -> list[tuple[Span, Task]]:
        local = dt_util.DEFAULT_TIME_ZONE
        hidden = {lid for lid, lst in self.coordinator.lists.items() if lst.get("archived")}
        events = []
        for task in self.coordinator.tasks.values():
            if not is_open(task) or task.get("listId") in hidden:
                continue
            span = span_of(task, local)
            if span is not None:
                events.append((span, task))
        events.sort(key=lambda pair: (_moment(pair[0].start), pair[1].get("title") or ""))
        return events

    def _event(self, span: Span, task: Task) -> CalendarEvent:
        lst = self.coordinator.lists.get(task.get("listId") or "") or {}
        return CalendarEvent(
            start=span.start,
            end=span.end,
            summary=task.get("title") or "",
            description=task.get("notes") or None,
            location=lst.get("name"),
            uid=task["id"],
        )

    @property
    def event(self) -> CalendarEvent | None:
        """The task that is on now, else the next one."""
        now = dt_util.now()
        for span, task in self._events():
            if _moment(span.end) > now:
                return self._event(span, task)
        return None

    async def async_get_events(
        self, hass: HomeAssistant, start_date: datetime, end_date: datetime
    ) -> list[CalendarEvent]:
        return [
            self._event(span, task)
            for span, task in self._events()
            if _moment(span.start) < end_date and _moment(span.end) > start_date
        ]
