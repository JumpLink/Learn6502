# 1. One app package, and platform workspaces that only package

- Status: **Proposed**
- Date: 2026-10-09
- Deciders: Pascal Garber
- Related: gjsify [ADR 0032 § 9](https://github.com/gjsify/gjsify/blob/main/docs/adr/0032-react-native-on-the-gtk-host.md)
  (platform file resolution), gjsify [ADR 0065](https://github.com/gjsify/gjsify/blob/main/docs/adr/0065-a-development-link-is-an-override-not-a-manifest.md)
  (`link:`/`file:` and development links), gjsify [ADR 0102](https://github.com/gjsify/gjsify/blob/main/docs/adr/0102-install-and-flatpak-sources-take-a-focus.md)
  (`--focus` for install and Flatpak sources)

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
3. **One root lockfile.** `app-android` stays a normal workspace of the root (`packages/*`).
   Each platform build installs only what it needs with
   `gjsify install --immutable --focus <workspace>`, and the Flatpak cache comes from
   `gjsify flatpak sources --focus @learn6502/app-gnome`
   (gjsify [ADR 0102](https://github.com/gjsify/gjsify/blob/main/docs/adr/0102-install-and-flatpak-sources-take-a-focus.md)).
4. **Workspaces declare their own build deps.** A package a workspace's build needs is in that
   workspace's `devDependencies`, not the root's, so a focused install has everything. Example:
   `@gjsify/rolldown-native` and `@gjsify/lightningcss-native` live in `app-gnome`.
5. **Enforcement in CI**, as a `build-aux/` check next to `check-workspace-scripts.js`:
   platform workspaces contain no app code beyond the declared entry. No lockfile pin-sync check:
   one lockfile has nothing to sync.

### Why a focus, not a second workspace root

The NativeScript toolchain is a problem of what an install and the Flatpak cache *select*, not of
how many lockfiles exist. Measured with a focus probe: Flatpak sources nativescript tarballs
15 → 0 (483 sources), a focused immutable install exit 0 with the lockfile unchanged, and the
app-gnome build exit 0. A single lockfile keeps `@gjsify/*` pins identical across platforms by
construction (a blueprint `?shared-tree` import failed on gjsify 0.55 and passed on 0.56.0).

In the proof of concept, `link:../x` and `file:../x` in `app-android/package.json` made
`gjsify install` exit 0 but link nothing (gjsify ADR 0065 makes development links an override the
installer reads, not a manifest edit), which is why app-android stays a workspace.

## Rejected alternatives

- **A: one package with `platforms/{gnome,web,android}/` inside.** One dependency set means one
  lockfile entry set, so the NativeScript toolchain returns to every install and to the Flatpak
  cache. `nativescript.config.ts`, `platforms/` and `hooks/` also collide with the GNOME package
  metadata, and one `gjsify` config block cannot be both `app: gjs` and `app: browser`.
- **E: `app-android` as its own workspace root with its own lockfile** (excluded from the root
  `workspaces`, listing the shared packages in its own `workspaces`; the pattern gjsify uses for its
  NativeScript showcases). It also removes the toolchain from the root install, at the cost of a
  second lockfile and a CI check to keep `@gjsify/*` pins in sync. Kept only as a **fallback**,
  needed only until the gjsify release that ships `--focus`.
- **C: per-platform packages with their own code (today).** Keeps the duplication and the
  toolchain in the root install, and leaves the suffix chain unused.
- **D: a shared template or runtime package for all apps** is not an alternative but a later
  generalisation: a `gjsify create-app --template adw-universal` that generates this layout, with
  `app-android` opt-in. It follows from this decision (AP 10) and is decided in gjsify.

## Consequences

- The Flatpak cache loses the NativeScript toolchain (nativescript tarballs 15 → 0, 483 sources)
  without a second lockfile; the root lockfile still contains it.
- GNOME, web and Android builds each use a focused install; one `node_modules` layout, one lockfile.
- Needs a gjsify release with `--focus` (ADR 0102). Until then `meson.build` keeps the plain
  install, and alternative E is the fallback.
- `appPath` and the `~/` alias stay in `app-android`; its code arrives through `@learn6502/app`.

## Migration

1. Prerequisite: `app-android` imports files from `app-gnome` by relative path
   (`*.blp?shared-tree`, language specs). Move them into `@learn6502/app` first.
2. Do the restructure **after AP 8** (components ported to the shared code), not before.
3. Then move app code into `packages/app`, add the CI check, switch the platform builds to
   `--focus` once the gjsify release has it, and regenerate the lockfile and `gjsify-sources.json`.

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
