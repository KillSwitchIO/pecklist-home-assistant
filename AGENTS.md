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
  adds it to the dashboard resources. The file is built from `card/` (TypeScript and Lit, its
  tests in `card/tests/`): never edit it by hand. After a change in `card/`, run `npm run build`
  there and commit the built file with the source; the pipeline fails when they differ.
- In the card: `card/src/data.ts` has no DOM and no Home Assistant (days are `YYYY-MM-DD` strings,
  "today" comes from Home Assistant's time zone); colors go through Home Assistant's theme
  variables and the `--pl-*` ones in `card/src/styles.ts`; everything works by touch and keyboard;
  an edit sends only the fields that changed. `npm run demo` builds `card/dist/demo.html` to look
  at the result in light and dark.
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
cd card && npm ci && npm run build && npm run lint && npm test
```

## Releases

Set `version` in `custom_components/pecklist/manifest.json`, move the changelog's Unreleased notes
under the version, and tag the commit `x.y.z` (no `v`). Pushing the tag to GitLab mirrors it to
GitHub, where `.github/workflows/release.yml` publishes the release HACS installs.
