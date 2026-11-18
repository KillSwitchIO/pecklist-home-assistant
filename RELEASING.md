# Releasing

The integration is developed on GitLab and installed from its GitHub mirror, where HACS looks. A
release is a plain `x.y.z` tag that matches `custom_components/pecklist/manifest.json`.

## Once, before the first release

- [ ] The GitLab project is public and mirrors one way to `KillSwitchIO/pecklist-home-assistant`.
- [ ] On GitHub: a description, topics (`home-assistant`, `hacs`, `integration`, `pecklist`,
      `todo`), and issues turned on. HACS checks all three, and the README sends people to the
      GitHub issues.
- [ ] GitHub recognises the license as MIT (the repository page shows it).
- [ ] The **Validate** workflow on GitHub is green: hassfest and the HACS check, with nothing
      ignored.
- [ ] The integration has run on a real Home Assistant for a while, installed as a HACS custom
      repository.

## Every release

1. Decide the version: a new feature is a minor release, a fix a patch.
2. Check the PeckList server versions the README names still hold. The reminder event, assignee
   names and list order need a server with the people, order and notification additions to the
   task API.
3. If the card changed, copy `dist/pecklist-card.js` from the card project
   (`killswitch10/pecklist-card`, at its released tag) to
   `custom_components/pecklist/www/pecklist-card.js`, and name the card version in the changelog.
4. On a branch:
   - set `version` in `custom_components/pecklist/manifest.json`;
   - in `CHANGELOG.md`, move the notes under **Unreleased** to a heading for the version and date.
5. Run everything:

   ```bash
   ruff check . && ruff format --check . && python -m pytest
   docker run --rm -v "$PWD:/github/workspace" ghcr.io/home-assistant/hassfest
   ```

   and the contract tests against a throwaway PeckList container (see the README).

6. Merge to `main`, wait for the GitLab pipeline, then tag the merge commit `x.y.z` (no `v`) and
   push the tag.
7. The tag mirrors to GitHub, where the **Release** workflow checks it against the manifest and
   publishes the GitHub release. HACS offers it within a few hours.
8. Install the release on a Home Assistant through HACS and check that the integration loads and
   the lists show.

## If a release is bad

Publish a fixed patch release. Do not delete or move a tag: HACS users may already have it.
