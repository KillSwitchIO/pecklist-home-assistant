# Changelog

Versions follow [Semantic Versioning](https://semver.org/). A release is a plain `x.y.z` tag that
matches `custom_components/pecklist/manifest.json`; the GitHub mirror publishes it for HACS.

## Unreleased

- The card has a **Calendar** view: a month, or a week, with each day's tasks. Drag a task to
  another day to move it there, keeping its time; on a touch screen, hold it a moment first. Tap a
  task to edit it, or a day to list it.
- The card's edit dialog can move a task to another list (its subtasks go with it), and lists the
  task's subtasks: check them off, rename them, delete them, and add new ones.

## 0.2.1 - 2026-11-19

- Time zones named on tasks are loaded off the event loop. Loading a zone for the first time reads
  its file from disk, which happened on the event loop while reading task dates for the to-do
  lists, the calendar, the sensors and `pecklist.update_task`. The integration now loads each new
  zone in the background when tasks arrive, and keeps it; an unknown zone reads as Home
  Assistant's own.

## 0.2.0 - 2026-11-17

- The dashboard card now ships with the integration. Home Assistant serves it at
  `/pecklist/pecklist-card.js` and the integration adds it to the dashboard resources on setup, so
  the card no longer needs installing on its own. With resources kept in YAML, the frontend loads
  it instead. If you installed the card separately, remove that copy and its resource.
- The link for reporting problems now goes to the issues on GitHub.

## 0.1.0 - 2026-11-13

First version.

- Connect a PeckList account with a server address and an API key; reauthentication when the key
  expires or is revoked; reconfigure to move the server. Several accounts as several entries.
- A to-do list per PeckList list: add, edit, check off, delete, dates and descriptions. Lists you
  may only view, and every list under a read-only key, are read-only.
- A calendar of open tasks with a date.
- Sensors: due today, overdue, upcoming, assigned to me, open tasks, and open tasks per list (off
  by default).
- Actions: `pecklist.add_task` (quick add), `complete_task`, `reopen_task`, `update_task`,
  `delete_task`, `get_tasks`.
- A `pecklist_task` event when a task is made, changed, completed, reopened or deleted.
- Live updates from the server's event stream, with polling once a minute as the fallback.
- A `pecklist_notification` event for reminders, assignments, shares and comments, on servers that
  announce them.
- Assignee names from the server's people, and `assign` by name in `update_task`.
- Lists in the app's own order.
- Blueprints: add a task when something happens, say reminders on a speaker, reminders on a phone
  with Done and Tomorrow (held until someone is home, if you like), and a light for overdue tasks.
- Websocket commands for the PeckList dashboard card.
- Diagnostics without the key or any task.
