# 2. gettext on every platform

- Status: **Accepted** (2026-10-30)
- Date: 2026-10-29
- Deciders: Pascal Garber
- Related: [ADR 0001](0001-one-app-package-and-packaging-only-platform-workspaces.md) (one app
  package), gjsify [ADR 0125](https://github.com/gjsify/gjsify/pull/2467) (the platform decision:
  GLib gettext on every target; link to the file on `main` once merged), gjsify
  [#2438](https://github.com/gjsify/gjsify/pull/2438), [#2447](https://github.com/gjsify/gjsify/pull/2447),
  [#2449](https://github.com/gjsify/gjsify/issues/2449) (live locale switch)

## Context

The shared UI marks its strings with `_("…")` (`packages/ui/src/translate.ts`) and `_()` in
`.blp`. One `po/` directory (`packages/translations`) holds every translation. Android used to
read it through `@nativescript/localize`: `po2json` → `app/i18n/*.json` → hooks writing
`res/values-*/strings.xml`, one string resource per msgid under an encoded key. That meant a
second lookup scheme, hundreds of generated lines in tracked files on every build, and a pinned
`de-DE` locale.

Which translation API each platform uses, and how the catalogue reaches it, is a platform
decision and lives in gjsify ADR 0125. This ADR records what Learn6502 does with it.

## Decision

1. **Learn6502 uses `_()` everywhere**, with one `po/` (`packages/translations`). No platform
   code in the app picks a translation scheme.
2. **`@nativescript/localize` is removed.** That removes its dependency, both hooks,
   `app/i18n/*.json`, the `po2json` step in `translations/build.js`, `utils/translate.ts`,
   `nativescript.config.ts` `i18n`, and the generated `values-*/strings.xml` content.
3. **The launcher label stays a committed Android string resource.** `res/values[-<lang>]/strings.xml`
   keep only `app_name` and `title_activity_kimera`. The English default is "Learn 6502 Assembly".
   The files are kept by hand, written once from the `po/` translation of the msgid `Learn 6502`,
   until the gjsify generator (ADR 0125, not built yet) exists. Then the app drops them from
   hand-keeping.

## Consequences

- A build no longer rewrites tracked files. The remaining `strings.xml` files change only when the
  app name's translation changes.
- `_()` behaves the same on GNOME and Android, including `%d` placeholders left for
  `formatMessage()`.
- Language switch, APK size and the web catalogue follow the gjsify ADR.
- Needs a gjsify release with #2438 and #2447. Until then Learn6502 builds against the linked
  gjsify checkout.

## Open

- The launcher label stays hand-kept until the gjsify generator exists.
- The tutorial's title line is translated on Android since the MDX views are shared (`bbd7e340`),
  but draws at full size: the NativeScript label markup applies no font scale to `<sub>`/`<sup>`
  (gjsify #2465).

## Implementation

- Learn6502 `a85cda88` (`initLocale`, `locale` option).
- Removal of `@nativescript/localize` (decision 2) and the trimmed `strings.xml` (decision 3):
  checked on a Galaxy S9 under de-DE (UI, tutorial, launcher label).
