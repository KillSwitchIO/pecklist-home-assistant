"""Constants for the PeckList integration."""

from __future__ import annotations

from datetime import timedelta
import logging

DOMAIN = "pecklist"
LOGGER = logging.getLogger(__package__)

CONF_DATE_FIELD = "date_field"
CONF_COMPLETED_DAYS = "completed_days"
CONF_HA_USER = "ha_user"

# Where a date set from Home Assistant goes on a task that has neither date yet. PeckList's own
# quick add puts a plain date on the schedule ("tomorrow") and only "due friday" on the due date.
DATE_FIELD_SCHEDULE = "schedule"
DATE_FIELD_DUE = "due"
DEFAULT_DATE_FIELD = DATE_FIELD_SCHEDULE

# Closed tasks stay on the to-do lists and in the card for this many days.
DEFAULT_COMPLETED_DAYS = 7

SCOPE_READ = "tasks:read"
SCOPE_WRITE = "tasks:write"

# Polling is only the fallback for the live stream, and never faster than once a minute.
POLL_WITHOUT_STREAM = timedelta(minutes=1)
POLL_WITH_STREAM = timedelta(minutes=15)

STREAM_RETRY_MIN = 5.0
STREAM_RETRY_MAX = 300.0
# The server sends a comment line every 25 s; a stream silent for this long is dead.
STREAM_SILENCE = 90.0

UPCOMING_DAYS = 7

EVENT_TASK = "pecklist_task"

SERVICE_ADD_TASK = "add_task"
SERVICE_COMPLETE_TASK = "complete_task"
SERVICE_REOPEN_TASK = "reopen_task"
SERVICE_UPDATE_TASK = "update_task"
SERVICE_DELETE_TASK = "delete_task"
SERVICE_GET_TASKS = "get_tasks"
