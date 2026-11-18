# Working on PeckList for Home Assistant

A Home Assistant custom integration (`custom_components/pecklist/`), installed through HACS, that
connects to a PeckList server through its Task API v1.

## Rules

- Talk to PeckList only through `/api/v1/` and `/api/events`. Never `/api/sync`: it is the apps'
  internal protocol and changes at every schema bump. If the integration needs something v1 lacks,
  ask for it in the PeckList project.
- All HTTP goes through `api.py`. It never follows redirects (the key would go with them) and never
  logs the key.
- `model.py` has no Home Assistant imports, so date handling tests plainly.
- The coordinator keeps the account's copy (the changes feed with a cursor). Entities, actions and
  websocket commands read from it and write through its `async_*_task` methods, which apply the
  server's answer at once.
- No polling faster than once a minute. The event stream is the main signal.
- A PATCH sends only the fields that changed, so an edit made meanwhile on another device survives.
- The websocket commands in `websocket_api.py` are the dashboard card's API. Within `API_VERSION`
  they only gain fields. The key never leaves Home Assistant.
- The card ships in `custom_components/pecklist/www/pecklist-card.js`, and `card.py` serves it and
  adds it to the dashboard resources. The file is built in `killswitch10/pecklist-card`, where the
  card's source and tests live: never edit it here, copy that project's `dist/pecklist-card.js`.
- User-facing text lives in `translations/en.json`: sentence case, plain words, no URLs.
- Behavior changes come with tests in `tests/`, against the fake server in `tests/conftest.py`. Run
  the contract suite (`contract/`) against a throwaway PeckList container when the API use changes.
- Never install or test on someone's live Home Assistant: use a throwaway container.
- Conventional Commits, signed commits, explicit `git add` paths.

## Commands

```bash
pip install -r requirements_test.txt
ruff check . && ruff format --check . && python -m pytest
PECKLIST_URL=http://localhost:18190 PECKLIST_TOKEN=pl_... python -m pytest contract -p no:homeassistant -p no:socket
docker run --rm -v "$PWD:/github/workspace" ghcr.io/home-assistant/hassfest
```

## Releases

Set `version` in `custom_components/pecklist/manifest.json`, move the changelog's Unreleased notes
under the version, and tag the commit `x.y.z` (no `v`). Pushing the tag to GitLab mirrors it to
GitHub, where `.github/workflows/release.yml` publishes the release HACS installs.
