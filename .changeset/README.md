# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets) — it drives the version bumps, changelogs and npm publishing for this monorepo.

- **Add a changeset** for your change: `npm run changeset` (or `yarn`/`pnpm`/`gjsify run changeset`). Pick the affected packages and the bump type, write a one-line summary. Commit the generated `.changeset/*.md` with your PR.
- All `@learn6502/*` packages are **version-locked** (`fixed` group) — they bump together, keeping the internal `^x.y.z` ranges consistent. Changesets rewrites those internal ranges automatically on `version`, so you never hand-sync them.
- Only **`@learn6502/core`** is published to npm; the other packages are `private` (they still get versioned + changelogged, just not published).

Release flow (maintainer): `npm run changeset:version` (applies pending changesets → bumps versions + internal ranges + writes CHANGELOGs), commit, then `npm run changeset:publish` (builds + `changeset publish`).
