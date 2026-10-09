# 1. One app package, and platform workspaces that only package

- Status: **Proposed**
- Date: 2026-10-09
- Deciders: Pascal Garber
- Related: gjsify [ADR 0032 § 9](https://github.com/gjsify/gjsify/blob/main/docs/adr/0032-react-native-on-the-gtk-host.md)
  (platform file resolution), gjsify [ADR 0065](https://github.com/gjsify/gjsify/blob/main/docs/adr/0065-a-development-link-is-an-override-not-a-manifest.md)
  (`link:`/`file:` and development links)

## Context

Learn6502 ships three apps: GNOME (GJS), web and Android (NativeScript). Today each has its own
package with its own code (`packages/app-gnome`, `app-web`, `app-android`), behind the shared
`common-ui` interfaces. Two problems:

1. **The NativeScript toolchain is in every install.** `pnpm-workspace.yaml` and the root
   `workspaces` are `packages/*`, so `app-android` (`nativescript`, `@nativescript/android`,
   `@nativescript/vite`, …) is part of the root install. Measured: 72 `nativescript` mentions in
   `gjsify-lock.json`, 14 in `gjsify-sources.json` (the Flatpak cache, including the
   `@nativescript/android` tarball). `meson.build` runs `gjsify install --immutable` over that whole
   lockfile, so the Flatpak build downloads the Android toolchain.
2. **Per-platform code drifts.** `app-android/app/{views,widgets,services,utils}` duplicates
   `app-gnome/src`. Nothing stops it growing.

gjsify already resolves platform files by suffix in one source tree (one plugin, three chains,
`packages/infra/rolldown-plugin-gjsify/src/plugins/platform-resolve.ts`, ADR 0032 § 9):

| Target | Chain |
|---|---|
| NativeScript | `.android` / `.ios` / `.visionos` → `.native` → base |
| GTK (`--app gjs\|node`) | `.gtk` → `.linux` / `.macos` / `.windows` → `.desktop` → base |
| Browser (`--app browser`) | `.web` → base |

The plugin resolves relative imports, so the fork has to live inside one package's source tree.

## Decision

**Option B.**

1. `packages/app` is `@learn6502/app` and holds **all app code**. Platform code is a suffix file
   next to its base file (`foo.ts`, `foo.gtk.ts`, `foo.web.ts`, `foo.android.ts`). It is consumed as
   source, so the chain resolves per target.
2. `packages/app-gnome`, `packages/app-web` and `packages/app-android` hold **only the entry point
   and packaging**, no app code:
   - `app-gnome`: entry, Meson, Flatpak, GSchema, `.desktop`, metainfo.
   - `app-web`: entry, `index.html`.
   - `app-android`: entry, NativeScript config, `App_Resources`.
3. `app-android` is **excluded from the root `workspaces`** (`"!packages/app-android"`) and is its
   own workspace root. Its `package.json` lists the shared packages in `workspaces`
   (`../app`, `../core`, `../common-ui`, `../learn`, `../examples`) and it has its own
   `gjsify-lock.json`. It keeps plain `^x.y.z` ranges. This is the pattern gjsify uses for its
   NativeScript showcases.
4. **Enforcement in CI**, as `build-aux/` checks next to `check-workspace-scripts.js`:
   - platform workspaces contain no app code beyond the declared entry;
   - the root and `app-android` lockfiles pin the same `@gjsify/*` versions.

### Why `workspaces`, not `link:`

In the proof of concept, `link:../x` and `file:../x` in `app-android/package.json` made
`gjsify install` exit 0 but link nothing: no `node_modules/@learn6502/*`, no lockfile entry
(gjsify ADR 0065 makes development links an override the installer reads, not a manifest edit).
A nested workspace root links the packages into `app-android/node_modules/@learn6502/*`.

## Rejected alternatives

- **A: one package with `platforms/{gnome,web,android}/` inside.** One dependency set means one
  lockfile entry set, so the NativeScript toolchain returns to every install and to the Flatpak
  cache. `nativescript.config.ts`, `platforms/` and `hooks/` also collide with the GNOME package
  metadata, and one `gjsify` config block cannot be both `app: gjs` and `app: browser`.
- **C: per-platform packages with their own code (today).** Keeps the duplication and the
  toolchain in the root install, and leaves the suffix chain unused.
- **D: a shared template or runtime package for all apps** is not an alternative but a later
  generalisation: a `gjsify create-app --template adw-universal` that generates this layout, with
  `app-android` opt-in. It follows from this decision (AP 10) and is decided in gjsify.

## Consequences

- The root lockfile and the Flatpak cache lose the NativeScript toolchain. Measured in the proof of
  concept: `nativescript` mentions 72 → 0 in `gjsify-lock.json`, 14 → 0 in `gjsify-sources.json`;
  `build-aux/check-flatpak-sources.js` passes.
- Android installs and builds from `packages/app-android` with its own lockfile and a second
  `node_modules` (about 790 MB measured).
- Two lockfiles can drift on shared `@gjsify/*` versions; the CI check above guards that. The pins
  must match: a blueprint `?shared-tree` import failed on gjsify 0.55 and passed on 0.56.0.
- `appPath` and the `~/` alias stay in `app-android`; its code arrives through `@learn6502/app`.

## Migration

1. Prerequisite: `app-android` imports files from `app-gnome` by relative path
   (`*.blp?shared-tree`, language specs). Move them into `@learn6502/app` first.
2. Do the restructure **after AP 8** (components ported to the shared code), not before.
3. Then move app code into `packages/app`, add the CI checks, exclude `app-android`, and
   regenerate both lockfiles and `gjsify-sources.json`.

## Open and unmeasured

- The proof of concept built the APK (`ns build android`, exit 0) but did **not** run it on an
  emulator: bundle-level evidence only (`.android.ts` is in `vendor.mjs`), no logcat.
- The real app was **not** built in the new layout; the PoC used a minimal `app.ts`. The real
  `app/` already fails on `main` for an unrelated reason (published
  `@gjsify/adwaita-nativescript` 0.55/0.56 lacks `padSheetForSystemInsets`).
- `appPath` outside the project root is **not proven**. A relocated `appPath` inside the project
  broke the `~/` alias, so the decision keeps `appPath` in `app-android`.
- Hot reload across the workspace symlink and per-platform `tsconfig` setups are untested.
- Whether `common-ui` merges into `packages/app` is a separate decision.

Proof of concept: branch `poc/ap9-layout` (`dcb738b822`), no PR.

## Implementation

Not started. Blocked on AP 8 and on this ADR becoming Accepted.
