# @learn6502/website

The static landing page for Learn 6502 Assembly, published at `https://jumplink.eu/Learn6502/` (the web app lives below it, at `/Learn6502/app/`).

Everything on the page comes from files that already exist: the AppStream metainfo, the root `package.json`, the app's gettext catalogues, the screenshots in `misc/screenshots/`, and, at build time, the GitHub release and Flathub APIs. The content works without JavaScript; two small web components (`<app-download>`, `<screenshot-carousel>`) only enhance it.

`src/site-data/` knows nothing about Learn 6502. It is written to move into gjsify as `@gjsify/site` unchanged: all app-specific values come from `gjsify.site`.

## Run

```sh
gjsify install
gjsify workspace @learn6502/website build    # vite build + render the pages into dist/
gjsify workspace @learn6502/website start    # build, then vite preview on http://localhost:4173/Learn6502/en/
gjsify workspace @learn6502/website check    # typecheck + translation catalogues in sync
gjsify workspace @learn6502/website test
```

`node src/cli.ts build --root <repo> --out <dir>` builds the page of another app: `<repo>` is a checkout whose root `package.json` has `gjsify.site` (default: this repo), `<dir>` the output (default: `dist/`). `i18n` takes `--root` too. `--offline` skips the network, `--no-cache` ignores the response cache in `.cache/http` (one hour; a stale copy also serves when the network is down). `GITHUB_TOKEN` is optional and only raises the API rate limit. When a lookup fails the build warns, links to the releases page and omits the counts.

## `gjsify.site`

Lives in the root `package.json`, next to `ship` and `flatpak`.

| Key | Meaning |
| --- | --- |
| `metainfo` | AppStream file, relative to the repo root. Source of name, summary, description, releases, URLs, branding, keywords, age rating. |
| `base` / `url` | URL path the site is served under, and its absolute origin + path (canonical, `hreflang`, `og:image`). |
| `languages` / `defaultLanguage` / `sourceLanguage` | Languages to render (`/en/`, `/de/`). `defaultLanguage` is where `/` lands when the visitor's languages match none (default: the first). `sourceLanguage` is the language of the metainfo's untranslated text (default `en`); the others are looked up in `translations`. |
| `repository` | `owner/name`; release assets and counts come from its latest GitHub release. |
| `flathub` | Flathub app id: adds the Flathub download and install count. Optional. |
| `webApp` | Path of the web app below `base`; adds "Try in browser". Optional. |
| `translations` | Directory of the app's `<lang>.po` catalogues, used when the metainfo lacks a translation. Optional. |
| `icon` | Icon (SVG or PNG) for the header, hero and favicon; overrides the Flatpak/ship icon. Optional. |
| `downloads` | `[{platform, format, url?, label?, available?}]`: targets the release assets do not cover, e.g. browser stores or a source install. `platform` is an OS or `firefox` / `chromium`; `format` adds `store`, `xpi`, `source`. `url` is required unless `available` is `false`, which lists the target as "Not yet available" and never recommends it. |
| `releaseAssets` | `false` ignores the GitHub release assets, so `downloads` is the whole list. Default `true`. |
| `support`, `legal` | `support`: `{kind, url}` links, or `{kind: "sepa", name, iban, bic?, reference?}`, a bank transfer shown as IBAN plus an EPC QR code (no amount; the IBAN is checked at load). `legal`: `{label, url}` links. Empty by default: nothing is invented. |
| `screenshots` | `{source, items}`, see below. |

`screenshots.source` is `metainfo` (only the metainfo list), `site` (only `items`) or `merge` (`items`, where `from` borrows the caption of that metainfo screenshot and `caption` is a msgid of the website catalogue). Each item has `variants`: files for `desktop-light`, `desktop-dark`, `mobile-light`, `mobile-dark`, at least one. A missing file fails the build.

A missing variant falls back to the nearest one:

| Wanted | Order tried |
| --- | --- |
| `mobile-dark` | mobile-dark, mobile-light, desktop-dark, desktop-light |
| `mobile-light` | mobile-light, mobile-dark, desktop-light, desktop-dark |
| `desktop-dark` | desktop-dark, desktop-light, mobile-dark, mobile-light |
| `desktop-light` | desktop-light, desktop-dark, mobile-light, mobile-dark |

The `<picture>` carries one `<source>` per differing variant (`max-width: 600px` and `prefers-color-scheme`), each as AVIF, WebP and PNG at up to three widths.

## Translations

- Page strings are gettext msgids in English: `t("…")` in `src/build/*.ts`, plus the download labels and the configured captions. `gjsify workspace @learn6502/website i18n` regenerates `po/website.pot` and merges it into `po/<lang>.po`; `check` fails when they are stale or a string is untranslated. No `xgettext` needed.
- App text (name, summary, description, release notes) is looked up per language: the metainfo's own `xml:lang` element, then `packages/translations/<lang>.po` (msgid = the source text), then the source text.
- `/` picks a language from `navigator.languages`, falls back to `defaultLanguage` and, without JavaScript, to a plain list of links.
