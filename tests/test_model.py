"""Dates on tasks, to and from Home Assistant."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from custom_components.pecklist.model import date_change, day_of, due_value, sort_key, span_of

CHICAGO = ZoneInfo("America/Chicago")
TOKYO = ZoneInfo("Asia/Tokyo")


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
    assert due_value(task, CHICAGO) == date(2026, 11, 15)
    task["due"] = None
    assert due_value(task, CHICAGO) == datetime(2026, 11, 14, 9, 0, tzinfo=CHICAGO)
    assert due_value({"due": None, "schedule": None}, CHICAGO) is None


def test_a_timed_task_falls_on_the_local_day() -> None:
    # 08:00 on the 15th in Tokyo is still the 14th in Chicago.
    value = due_value({"due": {"at": "2026-11-15T08:00", "timeZone": "Asia/Tokyo"}}, CHICAGO)
    assert day_of(value, CHICAGO) == date(2026, 11, 14)


def test_an_unknown_zone_or_a_bad_date_does_not_break() -> None:
    assert due_value({"due": {"at": "2026-11-15T08:00", "timeZone": "Mars/Base"}}, CHICAGO) == datetime(
        2026, 11, 15, 8, 0, tzinfo=CHICAGO
    )
    assert due_value({"due": {"at": "soon"}}, CHICAGO) is None


def test_spans() -> None:
    all_day = span_of({"schedule": {"start": "2026-11-14", "end": "2026-11-16", "allDay": True}}, CHICAGO)
    assert (all_day.start, all_day.end, all_day.all_day) == (date(2026, 11, 14), date(2026, 11, 17), True)

    one_day = span_of({"due": {"at": "2026-11-14"}}, CHICAGO)
    assert (one_day.start, one_day.end) == (date(2026, 11, 14), date(2026, 11, 15))

    timed = span_of(
        {"schedule": {"start": "2026-11-14T09:00", "end": None, "timeZone": "America/Chicago"}}, CHICAGO
    )
    assert timed.end - timed.start == timedelta(minutes=30)
    assert not timed.all_day

    long = span_of(
        {"schedule": {"start": "2026-11-14T09:00", "end": "2026-11-14T11:30", "timeZone": "America/Chicago"}},
        CHICAGO,
    )
    assert long.end == datetime(2026, 11, 14, 11, 30, tzinfo=CHICAGO)
    assert span_of({"schedule": None, "due": None}, CHICAGO) is None


def test_date_change_writes_the_field_the_date_came_from() -> None:
    scheduled = {"schedule": {"start": "2026-11-14", "end": None, "allDay": True}, "due": None}
    assert date_change(scheduled, date(2026, 11, 20), CHICAGO, "due") == {
        "schedule": {"start": "2026-11-20", "end": None, "allDay": True}
    }
    with_due = {"schedule": scheduled["schedule"], "due": {"at": "2026-11-15"}}
    assert date_change(with_due, date(2026, 11, 20), CHICAGO, "schedule") == {
        "due": {"at": "2026-11-20", "allDay": True}
    }
    assert date_change(with_due, None, CHICAGO, "schedule") == {"due": None}
    assert date_change(scheduled, None, CHICAGO, "schedule") == {"schedule": None}
    assert date_change({}, None, CHICAGO, "schedule") == {}


def test_date_change_on_an_undated_task_uses_the_option() -> None:
    assert date_change(None, date(2026, 11, 20), CHICAGO, "due") == {
        "due": {"at": "2026-11-20", "allDay": True}
    }
    when = datetime(2026, 11, 20, 23, 30, tzinfo=TOKYO)
    assert date_change(None, when, CHICAGO, "schedule") == {
        "schedule": {"start": "2026-11-20T08:30", "end": None, "allDay": False, "timeZone": "America/Chicago"}
    }


def test_moving_a_span_keeps_its_length() -> None:
    task = {"schedule": {"start": "2026-11-14", "end": "2026-11-16", "allDay": True}, "due": None}
    assert date_change(task, date(2026, 11, 20), CHICAGO, "schedule")["schedule"]["end"] == "2026-11-22"
    # A date replaced by a time drops the end rather than guessing one.
    timed = date_change(task, datetime(2026, 11, 20, 9, 0, tzinfo=CHICAGO), CHICAGO, "schedule")
    assert timed["schedule"]["end"] is None


def test_sort_order() -> None:
    tasks = [
        {"id": "c", "status": "done", "due": {"at": "2026-11-01"}},
        {"id": "b", "status": "open", "due": None, "schedule": None},
        {"id": "a", "status": "open", "due": {"at": "2026-11-20"}},
        {"id": "d", "status": "open", "due": {"at": "2026-11-20"}, "priority": 3},
    ]
    assert [t["id"] for t in sorted(tasks, key=lambda t: sort_key(t, CHICAGO))] == ["d", "a", "b", "c"]
