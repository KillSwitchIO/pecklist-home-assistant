"""Dates on tasks, to and from Home Assistant."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from custom_components.pecklist.model import (
    Zones,
    date_change,
    day_of,
    due_value,
    sort_key,
    span_of,
    zone_names,
)

CHICAGO = ZoneInfo("America/Chicago")
TOKYO = ZoneInfo("Asia/Tokyo")
# Home Assistant's zone, and the task zones the coordinator has loaded.
ZONES = Zones(CHICAGO, {"America/Chicago": CHICAGO, "Asia/Tokyo": TOKYO})


def test_due_value_prefers_the_due_date() -> None:
    task = {
        "due": {"at": "2026-11-15", "allDay": True, "timeZone": "America/Chicago"},
        "schedule": {
            "start": "2026-11-14T09:00",
            "end": None,
            "allDay": False,
            "timeZone": "America/Chicago",
        },
    }
    assert due_value(task, ZONES) == date(2026, 11, 15)
    task["due"] = None
    assert due_value(task, ZONES) == datetime(2026, 11, 14, 9, 0, tzinfo=CHICAGO)
    assert due_value({"due": None, "schedule": None}, ZONES) is None


def test_a_timed_task_falls_on_the_local_day() -> None:
    # 08:00 on the 15th in Tokyo is still the 14th in Chicago.
    value = due_value({"due": {"at": "2026-11-15T08:00", "timeZone": "Asia/Tokyo"}}, ZONES)
    assert day_of(value, CHICAGO) == date(2026, 11, 14)


def test_an_unknown_zone_or_a_bad_date_does_not_break() -> None:
    assert due_value({"due": {"at": "2026-11-15T08:00", "timeZone": "Mars/Base"}}, ZONES) == datetime(
        2026, 11, 15, 8, 0, tzinfo=CHICAGO
    )
    assert due_value({"due": {"at": "soon"}}, ZONES) is None


def test_a_zone_not_loaded_reads_as_home_assistants_own() -> None:
    # Loading a zone reads a file, so the model only uses zones loaded ahead of time.
    unloaded = Zones(CHICAGO)
    assert due_value({"due": {"at": "2026-11-15T08:00", "timeZone": "Asia/Tokyo"}}, unloaded) == datetime(
        2026, 11, 15, 8, 0, tzinfo=CHICAGO
    )


def test_zone_names_lists_every_zone_tasks_name() -> None:
    tasks = [
        {"due": {"at": "2026-11-15T08:00", "timeZone": "Asia/Tokyo"}, "schedule": None},
        {"due": None, "schedule": {"start": "2026-11-14", "timeZone": "Europe/Oslo"}},
        {"due": {"at": "2026-11-15"}, "schedule": {"start": "2026-11-14", "timeZone": ""}},
        {},
    ]
    assert zone_names(tasks) == {"Asia/Tokyo", "Europe/Oslo"}


def test_spans() -> None:
    all_day = span_of({"schedule": {"start": "2026-11-14", "end": "2026-11-16", "allDay": True}}, ZONES)
    assert (all_day.start, all_day.end, all_day.all_day) == (date(2026, 11, 14), date(2026, 11, 17), True)

    one_day = span_of({"due": {"at": "2026-11-14"}}, ZONES)
    assert (one_day.start, one_day.end) == (date(2026, 11, 14), date(2026, 11, 15))

    timed = span_of(
        {"schedule": {"start": "2026-11-14T09:00", "end": None, "timeZone": "America/Chicago"}}, ZONES
    )
    assert timed.end - timed.start == timedelta(minutes=30)
    assert not timed.all_day

    long = span_of(
        {"schedule": {"start": "2026-11-14T09:00", "end": "2026-11-14T11:30", "timeZone": "America/Chicago"}},
        ZONES,
    )
    assert long.end == datetime(2026, 11, 14, 11, 30, tzinfo=CHICAGO)
    assert span_of({"schedule": None, "due": None}, ZONES) is None


def test_date_change_writes_the_field_the_date_came_from() -> None:
    scheduled = {"schedule": {"start": "2026-11-14", "end": None, "allDay": True}, "due": None}
    assert date_change(scheduled, date(2026, 11, 20), ZONES, "due") == {
        "schedule": {"start": "2026-11-20", "end": None, "allDay": True}
    }
    with_due = {"schedule": scheduled["schedule"], "due": {"at": "2026-11-15"}}
    assert date_change(with_due, date(2026, 11, 20), ZONES, "schedule") == {
        "due": {"at": "2026-11-20", "allDay": True}
    }
    assert date_change(with_due, None, ZONES, "schedule") == {"due": None}
    assert date_change(scheduled, None, ZONES, "schedule") == {"schedule": None}
    assert date_change({}, None, ZONES, "schedule") == {}


def test_date_change_on_an_undated_task_uses_the_option() -> None:
    assert date_change(None, date(2026, 11, 20), ZONES, "due") == {
        "due": {"at": "2026-11-20", "allDay": True}
    }
    when = datetime(2026, 11, 20, 23, 30, tzinfo=TOKYO)
    assert date_change(None, when, ZONES, "schedule") == {
        "schedule": {"start": "2026-11-20T08:30", "end": None, "allDay": False, "timeZone": "America/Chicago"}
    }


def test_moving_a_span_keeps_its_length() -> None:
    task = {"schedule": {"start": "2026-11-14", "end": "2026-11-16", "allDay": True}, "due": None}
    assert date_change(task, date(2026, 11, 20), ZONES, "schedule")["schedule"]["end"] == "2026-11-22"
    # A date replaced by a time drops the end rather than guessing one.
    timed = date_change(task, datetime(2026, 11, 20, 9, 0, tzinfo=CHICAGO), ZONES, "schedule")
    assert timed["schedule"]["end"] is None


def test_sort_order() -> None:
    tasks = [
        {"id": "c", "status": "done", "due": {"at": "2026-11-01"}},
        {"id": "b", "status": "open", "due": None, "schedule": None},
        {"id": "a", "status": "open", "due": {"at": "2026-11-20"}},
        {"id": "d", "status": "open", "due": {"at": "2026-11-20"}, "priority": 3},
    ]
    assert [t["id"] for t in sorted(tasks, key=lambda t: sort_key(t, ZONES))] == ["d", "a", "b", "c"]
