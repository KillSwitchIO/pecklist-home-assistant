"""Reading and writing the dates on PeckList tasks. No Home Assistant imports, so it tests plainly.

A task carries its dates as the task API sends them: a schedule ({"start", "end", "allDay",
"timeZone"}) and a due date ({"at", "allDay", "timeZone"}), each a local date ("2026-11-10") or a
local date-time ("2026-11-10T09:00") in an IANA zone.

Loading a zone reads a file, so this module never loads one: the coordinator resolves the zones
its tasks name off the event loop, and passes them in as `Zones`.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, tzinfo
from typing import Any

Task = dict[str, Any]

DEFAULT_EVENT_LENGTH = timedelta(minutes=30)


@dataclass(frozen=True)
class Zones:
    """Home Assistant's zone, and the task zones already loaded, by IANA name."""

    local: tzinfo
    known: Mapping[str, tzinfo] = field(default_factory=dict)

    def get(self, name: str | None) -> tzinfo:
        """A loaded zone; Home Assistant's own for no zone, or one not loaded (unknown)."""
        if not name:
            return self.local
        return self.known.get(name, self.local)


def zone_names(tasks: Iterable[Task]) -> set[str]:
    """The IANA zones a set of tasks name, so they can be loaded ahead of time."""
    names: set[str] = set()
    for task in tasks:
        for part in (task.get("due"), task.get("schedule")):
            if isinstance(part, dict) and isinstance(part.get("timeZone"), str) and part["timeZone"]:
                names.add(part["timeZone"])
    return names


def is_open(task: Task) -> bool:
    return task.get("status") == "open"


def parse_local(value: str | None, zone: str | None, zones: Zones) -> date | datetime | None:
    """A task's date string as a date, or as a date-time in its own zone."""
    if not value:
        return None
    try:
        if "T" not in value:
            return date.fromisoformat(value)
        parsed = datetime.fromisoformat(value)
    except ValueError:
        return None
    if parsed.tzinfo is not None:
        return parsed
    return parsed.replace(tzinfo=zones.get(zone))


def parse_utc(value: str | None) -> datetime | None:
    """A server timestamp such as 2026-11-10T15:04:05.000Z."""
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def due_value(task: Task, zones: Zones) -> date | datetime | None:
    """The one date a to-do item shows: the due date, else the scheduled start."""
    due = task.get("due")
    if due:
        value = parse_local(due.get("at"), due.get("timeZone"), zones)
        if value is not None:
            return value
    schedule = task.get("schedule")
    if schedule:
        return parse_local(schedule.get("start"), schedule.get("timeZone"), zones)
    return None


def day_of(value: date | datetime | None, local: tzinfo) -> date | None:
    """The calendar day a date or date-time falls on, in Home Assistant's zone."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.astimezone(local).date()
    return value


def task_day(task: Task, zones: Zones) -> date | None:
    return day_of(due_value(task, zones), zones.local)


@dataclass(frozen=True)
class Span:
    """When a task sits on a calendar. All-day spans end on the day after the last day."""

    start: date | datetime
    end: date | datetime
    all_day: bool


def span_of(task: Task, zones: Zones) -> Span | None:
    """A task as a calendar event: its schedule when it has one, else its due date."""
    schedule = task.get("schedule")
    start = end = None
    if schedule:
        start = parse_local(schedule.get("start"), schedule.get("timeZone"), zones)
        end = parse_local(schedule.get("end"), schedule.get("timeZone"), zones)
    if start is None:
        due = task.get("due")
        if due:
            start = parse_local(due.get("at"), due.get("timeZone"), zones)
        end = None
    if start is None:
        return None
    if isinstance(start, datetime):
        if isinstance(end, date) and not isinstance(end, datetime):
            # A timed start with a plain end day: run to the end of that day.
            end = datetime.combine(end + timedelta(days=1), datetime.min.time(), start.tzinfo)
        if end is None or end <= start:
            end = start + DEFAULT_EVENT_LENGTH
        return Span(start, end, False)
    last = end.date() if isinstance(end, datetime) else end
    if last is None or last < start:
        last = start
    return Span(start, last + timedelta(days=1), True)


def _format(value: date | datetime, local: tzinfo) -> tuple[str, bool, str | None]:
    """A Home Assistant date or date-time as the API's string, all-day flag and zone."""
    if isinstance(value, datetime):
        moment = value.astimezone(local) if value.tzinfo else value
        return moment.strftime("%Y-%m-%dT%H:%M"), False, getattr(local, "key", None)
    return value.isoformat(), True, None


def date_change(
    task: Task | None, value: date | datetime | None, zones: Zones, new_field: str
) -> dict[str, Any]:
    """The PATCH fields that set (or clear) the date a to-do item shows.

    It changes the field the shown date came from: the due date when the task has one, else the
    schedule. A task with neither gets `new_field` ("schedule" or "due"). A schedule keeps its
    length when both ends are of the same kind.
    """
    has_due = bool(task and task.get("due"))
    schedule = (task or {}).get("schedule")
    if value is None:
        if has_due:
            return {"due": None}
        if schedule:
            return {"schedule": None}
        return {}
    local = zones.local
    text, all_day, zone = _format(value, local)
    field = "due" if has_due else "schedule" if schedule else new_field
    if field == "due":
        change: dict[str, Any] = {"at": text, "allDay": all_day}
        if zone:
            change["timeZone"] = zone
        return {"due": change}
    change = {"start": text, "end": None, "allDay": all_day}
    if zone:
        change["timeZone"] = zone
    if schedule and schedule.get("end"):
        old_start = parse_local(schedule.get("start"), schedule.get("timeZone"), zones)
        old_end = parse_local(schedule.get("end"), schedule.get("timeZone"), zones)
        if (
            old_start is not None
            and old_end is not None
            and type(old_start) is type(old_end) is type(value)
            and old_end > old_start
        ):
            new_end = value + (old_end - old_start)
            change["end"] = _format(new_end, local)[0]
    return {"schedule": change}


def sort_key(task: Task, zones: Zones) -> tuple[Any, ...]:
    """Open before closed, dated before undated, then by date, priority and age."""
    day = task_day(task, zones)
    return (
        0 if is_open(task) else 1,
        0 if day else 1,
        day or date.max,
        -int(task.get("priority") or 0),
        task.get("createdAt") or "",
        task.get("id") or "",
    )
