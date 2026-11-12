# Changelog

Versions follow [Semantic Versioning](https://semver.org/). A release is a plain `x.y.z` tag that
matches `custom_components/pecklist/manifest.json`; the GitHub mirror publishes it for HACS.

## Unreleased

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
- Websocket commands for the PeckList dashboard card.
- Diagnostics without the key or any task.
