# PeckList for Home Assistant

Connects [PeckList](https://pecklist.com), the self-hosted task app, to Home Assistant. Each
PeckList list becomes a to-do list, dated tasks show on a calendar, and sensors and actions let
automations add, complete and count tasks: "when the dishwasher finishes, add *Empty the
dishwasher* to Chores".

- **To-do lists**: one per PeckList list. Add, edit, check off and delete from Home Assistant's
  To-do card, or by voice with Assist ("add milk to shopping").
- **Calendar**: every open task with a date, all-day or timed.
- **Sensors**: due today, overdue, upcoming, assigned to me and open tasks.
- **Actions**: `pecklist.add_task` reads a line the way PeckList's quick add does
  (`Pay rent tomorrow 9am #bills ^Home !high every month`), plus complete, reopen, change, delete
  and get tasks.
- **Live**: changes made on your phone or in the browser show within a couple of seconds.
- **Dashboard card**: the PeckList card comes with the integration. It adds at-a-glance, list,
  agenda and busy-day heatmap views with priorities, tags, sections and subtasks. See
  [Dashboard card](#dashboard-card).

It needs PeckList **0.10.0 or newer** (the task API) and Home Assistant **2026.9 or newer**.

## Install

With [HACS](https://hacs.xyz):

1. HACS > the three dots > **Custom repositories**. Add
   `https://github.com/KillSwitchIO/pecklist-home-assistant` as an **Integration**.
2. Find **PeckList** in HACS, download it, and restart Home Assistant.

By hand: copy `custom_components/pecklist` into the `custom_components` folder of your Home
Assistant configuration, and restart.

## Set up

1. In PeckList, open **Settings > Account > API keys** and make a key with `tasks:read` and
   `tasks:write`. A key with only `tasks:read` works too: the lists are then read-only.
2. In Home Assistant, open **Settings > Devices & services > Add integration > PeckList**. Enter
   the address you open PeckList at, and the key.

The key is stored in Home Assistant and sent only to your PeckList server. It acts as you: it sees
and changes what you could in the app, by the same sharing rules.

When a key expires or is revoked, Home Assistant asks for a new one. **Reconfigure** on the
integration changes the server address.

### Several people

Each person adds their own PeckList account as its own entry, with their own key. Their entities
are named after them (`todo.pecklist_sam_garden`). Under **Configure** on an entry you can say
which Home Assistant user it belongs to; the dashboard card then shows each person their own tasks
by default.

**Everyone signed in to your Home Assistant can see every connected account's tasks.** Home
Assistant has no way to hide one person's entities from another. Connect only accounts whose tasks
the whole household may see.

## Dashboard card

The PeckList card is part of the integration: there is nothing more to install. Once an account is
connected, edit a dashboard, **Add card**, and pick **PeckList**. Reload the browser first if the
card is not offered.

The integration serves the card at `/pecklist/pecklist-card.js` and adds it to **Settings >
Dashboards > Resources** by itself. If you keep your resources in YAML it loads the card with the
frontend instead, and your YAML stays as it is.

If you installed the card on its own before (the `pecklist-card` repository in HACS, or a copy in
`config/www`), remove that copy and its resource, so the browser loads only this one.

The card's views and options are described in the
[card's README](card/README.md#views).

## What you get

For an account named `ben`:

| Entity | |
| --- | --- |
| `todo.pecklist_ben_<list>` | One per list that is not archived. Open tasks, and closed ones for a week. |
| `calendar.pecklist_ben_tasks` | Open tasks with a date. Read-only. |
| `sensor.pecklist_ben_due_today` | Open tasks dated today. |
| `sensor.pecklist_ben_overdue` | Open tasks dated before today. |
| `sensor.pecklist_ben_upcoming` | Open tasks in the next 7 days, after today. |
| `sensor.pecklist_ben_assigned_to_me` | Open tasks assigned to you. |
| `sensor.pecklist_ben_open_tasks` | Every open task. |
| `sensor.pecklist_ben_<list>_open_tasks` | Open tasks per list. Off until you enable it. |

Each sensor lists its first 20 tasks in a `tasks` attribute, for templates.

A list you may only view in PeckList is read-only in Home Assistant. Lists that are deleted,
archived or no longer shared with you lose their entity; new lists get one.

### Dates

A PeckList task can have a scheduled date and a due date. Home Assistant's to-do items have one
date, so a to-do item shows the due date when there is one, and the scheduled date otherwise.
Changing the date in Home Assistant changes that same one. For a task with no date yet, **Configure**
decides where a new date goes: the scheduled date (as PeckList's quick add does) or the due date.

"Today" and "overdue" go by the day: a task at 9:00 today is due today all day, and overdue from
tomorrow.

### Options

Under **Configure** on the entry:

- where a date set in Home Assistant goes on a task that has none;
- how many days closed tasks stay on the lists (7);
- which Home Assistant user the account belongs to.

## Actions

| Action | |
| --- | --- |
| `pecklist.add_task` | `text` read as quick add; optional `list` when the text names none with `^`. |
| `pecklist.complete_task` | By `task_id`, or by `title` (and `list`). `status: wontdo` closes it as won't do. |
| `pecklist.reopen_task` | By `task_id` or `title`. |
| `pecklist.update_task` | `task_id` plus any of `title`, `notes`, `priority`, `date`, `clear_date`, `list`, `tags`, `add_tags`, `remove_tags`, `assign` (names; `me` is the account itself). |
| `pecklist.delete_task` | By `task_id` or `title`. PeckList's trash keeps it. |
| `pecklist.get_tasks` | Answers tasks: `filter` is `open`, `today`, `overdue`, `upcoming` or `assigned`; optional `list`. |

With more than one account connected, add `config_entry_id` to say which. `add_task`,
`complete_task`, `reopen_task` and `update_task` answer the task when called with a response
variable.

```yaml
automation:
  - alias: Dishwasher finished
    triggers:
      - trigger: state
        entity_id: sensor.dishwasher_operation_state
        to: finished
    actions:
      - action: pecklist.add_task
        data:
          text: 'Empty the dishwasher today #home ^Chores !high'
```

Completing a repeating task moves it to its next date, as in the app.

## Events

The integration fires `pecklist_task` on Home Assistant's event bus when a task is made, changed,
completed, reopened or deleted, whichever device did it:

```yaml
triggers:
  - trigger: event
    event_type: pecklist_task
    event_data:
      type: completed
      list_name: Chores
```

Event data: `type` (`created`, `updated`, `completed`, `reopened`, `deleted`), `task_id`, `title`,
`status`, `list_id`, `list_name`, `tags`, `priority`, `assignees` (names), `username` and `entry_id`.

### Reminders and other notifications

When PeckList makes a notification for an account (a reminder came due, a task was assigned to
you, a list was shared, someone commented), the integration fires `pecklist_notification`:

```yaml
automation:
  - alias: Say reminders in the kitchen
    triggers:
      - trigger: event
        event_type: pecklist_notification
        event_data:
          type: reminder
    actions:
      - action: tts.speak
        target:
          entity_id: tts.home_assistant_cloud
        data:
          media_player_entity_id: media_player.kitchen
          message: "Reminder for {{ trigger.event.data.name }}: {{ trigger.event.data.title }}"
```

Event data: `type` (`reminder`, `assigned`, `groupAssigned`, `claimed`, `shared`, `commented`,
`commentEdited`, `mentioned`), `task_id`, `title`, `list_id`, `list_name`, `by` (who did it, for
the kinds that have someone), `at`, `username`, `name` and `entry_id`.

This needs a PeckList server newer than 0.10: older ones only say that something changed.
Notifications come over the live stream, so one made while the stream is down is not replayed.

## Blueprints

Ready-made automations, in [`blueprints/automation/pecklist`](blueprints/automation/pecklist). In
Home Assistant, open **Settings > Automations & scenes > Blueprints > Import blueprint** and paste
the address of the file on GitHub.

| Blueprint | |
| --- | --- |
| `add_task_when.yaml` | Adds a task when an entity changes to a state: the dishwasher finishes, the washer stops. The text is read like quick add. |
| `announce_reminder.yaml` | Says a reminder on a speaker when it comes due, between the hours you choose. |
| `reminder_to_phone.yaml` | Sends a reminder to a phone with **Done** and **Tomorrow** buttons, and can hold it until a person is home. |
| `overdue_light.yaml` | Turns a light on in a color while a count (overdue, due today) is above zero. |

The two reminder blueprints need a PeckList server that announces notifications (newer than 0.10).

## How it keeps up

The integration keeps a copy of your tasks. It listens to the server's event stream for "something
changed" and then reads only what changed. If the stream cannot be opened (some proxies buffer it),
it polls once a minute instead, and never faster. With the stream up it still polls every
15 minutes as a safety net.

Behind a reverse proxy, let `/api/events` stream: no buffering, and a read timeout over 30 seconds.

## Troubleshooting

- **"No PeckList server answered at this address"**: use the address of PeckList itself, with
  `http://` or `https://`, as Home Assistant can reach it. A sign-in page from a proxy in front of
  PeckList (Authelia, Cloudflare Access) counts as no answer: let `/api/v1` and `/api/events`
  through to PeckList, which checks the key itself.
- **Adding a task fails with "you have no inbox yet"**: the account has never opened the PeckList
  app. Open it once, or name a list.
- **Changes take a minute to show**: the event stream is not getting through. Download
  diagnostics from the integration's page: `live_updates` says whether the stream is up.

Diagnostics never contain the key or your tasks.

## Development

```bash
pip install -r requirements_test.txt
ruff check . && ruff format --check .
python -m pytest
```

The contract tests run the client against a real PeckList server. Use a throwaway container, never
one with real data:

```bash
docker run -d --name pecklist-contract -p 18190:8080 -e ADMIN_PASSWORD=contract-tests-only registry.gitlab.com/killswitch10/pecklist:latest
export PECKLIST_URL=http://localhost:18190
export PECKLIST_TOKEN="$(PECKLIST_ADMIN_PASSWORD=contract-tests-only python scripts/contract_token.py)"
python -m pytest contract -p no:homeassistant -p no:socket
```

The project is developed on GitLab:
[gitlab.com/killswitch10/pecklist-home-assistant](https://gitlab.com/killswitch10/pecklist-home-assistant).
The GitHub repository is a mirror for HACS. Please report problems in its
[issues](https://github.com/KillSwitchIO/pecklist-home-assistant/issues).

## License

MIT. PeckList itself is licensed separately (AGPL-3.0-or-later).
