# 2. gettext on every platform

- Status: **Accepted** (2026-10-30)
- Date: 2026-10-29
- Deciders: Pascal Garber
- Related: [ADR 0001](0001-one-app-package-and-packaging-only-platform-workspaces.md) (one app
  package), gjsify [#2438](https://github.com/gjsify/gjsify/pull/2438) (libintl that reads `.mo`
  on Android), gjsify [#2447](https://github.com/gjsify/gjsify/pull/2447) (`.mo` staging, bare
  `gettext`, `@gjsify/adwaita-app/locale`, `_()` in `.blp`), gjsify
  [#2449](https://github.com/gjsify/gjsify/issues/2449) (live locale switch)

## Context

The shared UI marks its strings with `_("…")` (`packages/ui/src/translate.ts`) and `_()` in
`.blp`. One `po/` directory (`packages/translations`) holds every translation. Each platform
read it differently:

| Platform | Before |
|---|---|
| GNOME | GLib gettext over the `.mo` Meson installs (`bootstrap.ts`) |
| Android | `@nativescript/localize`: `po2json` → `app/i18n/*.json` → its hooks write `res/values-*/strings.xml`, one Android string resource per msgid, looked up by an encoded key |
| Web | nothing; the msgid is shown |

The Android path had three costs:

1. **A second lookup scheme.** Strings resolve by an encoded resource key, not by msgid, so
   `utils/translate.ts` re-implements `_()` on top of it, and `localize()` runs every string
   through sprintf, which throws on a shared msgid's `%d`.
2. **Generated churn in tracked files.** The hooks rewrite `values/`, `values-de/` and
   `values-fr/strings.xml` (hundreds of lines, the whole tutorial) on every build, and create
   14 untracked `values-*` directories.
3. **A pinned locale.** The app overrode the locale to `de-DE` for testing.

The Phase 4 spike (2026-10-28) showed real GLib gettext works on Android once two gjsify gaps
close: the `libintl.so` in the sysroot was proxy-libintl, which never reads a `.mo`, and the
process had no `LANGUAGE`. Both are now fixed in gjsify core (#2438, #2447).

## Decision

**GLib gettext is the one translation API on every platform.** Shared code calls `_()`; the
platform only decides where the catalogue comes from.

1. **GNOME:** unchanged. GJS `imports.gettext` over Meson's `.mo`.
2. **Android: real GLib** through GI and the libintl `.mo` reader (#2438).
   - The build stages `po/` as `locale/<lang>/LC_MESSAGES/eu.jumplink.Learn6502.mo`
     (`gjsifyNativescript({ locale })` in `vite.config.ts`).
   - `app.ts` calls `setTranslator(initLocale(APPLICATION_ID))` from
     `@gjsify/adwaita-app/locale`, before the first string is read.
   - `LANGUAGE` follows the app's locale list, cut after the first English tag, since English
     is the msgid language and has no catalogue.
   - `_()` in `.blp` goes through GLib `dgettext` / `dpgettext2`, the calls GtkBuilder makes.
3. **Web: a re-creation of the same GLib API** (`bindtextdomain` / `textdomain` / `dgettext` /
   `dpgettext2`) over the same `.mo` files, built in gjsify. It is not part of this ADR's
   implementation. Until it lands, the web shows the msgid, as it does today. Nothing web-only
   enters the app: if GLib itself runs in the browser later (the WebAssembly spike), it replaces
   the re-creation without an app change.
4. **`@nativescript/localize` is removed.** That removes its dependency, both hooks,
   `app/i18n/*.json`, the `po2json` step in `translations/build.js`, `utils/translate.ts`,
   `nativescript.config.ts` `i18n`, and the generated `values-*/strings.xml` content.
5. **The launcher label stays an Android string resource.** Android reads `@string/app_name`
   before any JS runs, so gettext cannot supply it. `res/values[-<lang>]/strings.xml` keep only
   `app_name` and `title_activity_kimera`, generated deterministically from the `po/` translation
   of the msgid `Learn 6502` (the `.desktop` name) and committed. The English default stays
   "Learn 6502 Assembly". Generating them is a gjsify capability (an option of
   `gjsifyNativescript({ locale })`), not an app script.

## Consequences

- One msgid scheme everywhere; `_()` behaves the same on GNOME and Android, including `%d`
  placeholders left for `formatMessage()`.
- A build no longer rewrites tracked files. The remaining `strings.xml` files change only when the
  app name's translation changes.
- **A language switch applies on the next start**, as on GNOME. Android's per-app language
  relaunches the activity but keeps the process and its built window, so nothing re-translates
  until the app is restarted. Verified on a Galaxy S9: cold start under de-DE, en-US, de-DE.
  Live re-translation is gjsify #2449.
- The APK carries `.mo` files instead of string resources. Size not yet compared.
- Needs a gjsify release with #2438 and #2447. Until then Learn6502 builds against the linked
  gjsify checkout.

## Rejected alternatives

- **Keep `@nativescript/localize` on Android, GLib on GNOME.** Two lookup schemes and the
  generated churn stay; the shared `_()` needs a per-platform adapter forever.
- **A JS gettext on Android too** (the web re-creation everywhere). The real GLib is already in
  the APK for GI. A re-creation there would be a second implementation to keep in step, where
  the real one is available.
- **Translate the launcher label at runtime.** Android shows it from the manifest before the app
  starts; there is no runtime hook.

## Open

- The launcher label generator (decision 5) is not built yet. Until it is, the 16
  `values[-<lang>]/strings.xml` were written once from `po/` and are kept by hand.
- The tutorial's title line is translated on Android since the MDX views are shared (`bbd7e340`),
  but draws at full size: the NativeScript label markup applies no font scale to `<sub>`/`<sup>`
  (a gjsify gap).
- Web re-creation: own gjsify ADR when it starts.
- APK size with `.mo` versus string resources: unmeasured.

## Implementation

- Done: gjsify #2438, #2447; Learn6502 `a85cda88` (`initLocale`, `locale` option).
- Removal of `@nativescript/localize` (decision 4) and the trimmed `strings.xml` (decision 5):
  checked on a Galaxy S9 under de-DE (UI, tutorial, launcher label).
