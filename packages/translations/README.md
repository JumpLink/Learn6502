# Learn 6502 Assembly Translations

This package contains the translations for Learn 6502 Assembly. The project is hosted on [GitHub](https://github.com/JumpLink/Learn6502).

<a href="https://hosted.weblate.org/engage/eu-jumplink-learn6502/">
<img src="https://hosted.weblate.org/widget/eu-jumplink-learn6502/app/multi-auto.svg" alt="translation status" />
</a>

## Translation Methods

You can contribute translations in two ways:

1. **Using Weblate**: Visit the [Weblate eu.jumplink.Learn6502 project page](https://hosted.weblate.org/projects/eu-jumplink-learn6502/app/)
2. **Direct Editing**: Clone the repository and edit the .po files directly. This allows you to test your translations immediately in the app.

New language translations are always welcome! You can start a new language translation either through Weblate or by creating new .po files in the repository.

### Requesting a new language

If you would like to see your native language supported, you have two options:

1. **Ask us to add it**: Open an issue and request the language. We can bootstrap an AI‑assisted initial translation, and you (or another native speaker) can validate and improve it afterward.
2. **Contribute directly**: Translate via [Weblate](https://hosted.weblate.org/projects/eu-jumplink-learn6502/app/) or submit a Pull Request adding/updating the corresponding `.po` file.

Support for every new language is welcome.

## Project Structure

- **UI Elements & Messages**: Managed through `.po` files
- **Tutorial Content**: Located in [packages/learn/tutorial.mdx](https://github.com/JumpLink/Learn6502/blob/main/packages/learn/tutorial.mdx)

The tutorial's strings — 219 of the 457 in the catalogs — do not reach `xgettext` from the MDX
directly. They are extracted from `packages/learn/dist/*.ui`, which `@learn6502/learn` generates,
so `build` below builds that package first. Do not extract without it: with `packages/learn/dist`
missing or stale, extraction quietly produces a POT without the tutorial and rewrites all sixteen
catalogs to match. The build refuses to run in that state rather than emptying them.

## Translation Guidelines

1. **Do not translate**:
   - Technical terms (6502, CPU)
   - Command names and mnemonics (LDA, STA, BRK)
   - Variable names and placeholders

2. **Maintain**:
   - Markdown syntax
   - HTML tags
   - Formatting placeholders

3. **External links**:
   - You may replace links to English pages with equivalent high-quality pages in the target language.
   - Prefer reputable sources (e.g., Wikipedia) when a high-quality article exists in the target language.
   - In-document anchors like `href="#jumping"` navigate inside the tutorial — keep the fragment as it is.
   - Write `&` as `&amp;`, in a URL as well as in prose. A bare `&` — or an HTML-only entity like
     `&nbsp;` — is a markup error, and the GNOME app renders the whole paragraph as nothing.

4. **Inline `<tt>` is code**, not prose: subroutine names, labels, opcodes, registers and addresses
   the reader looks up in the editor. Copy it through unchanged. A translated `<tt>illegalMove</tt>`
   describes code the reader cannot find, and a translated `<tt>JSR end</tt>` no longer assembles.
   `<b>` may hold either — translate a UI button label like `<b>Step</b>`, matching how that button
   is translated elsewhere in the catalog, and leave code like `<b>BVS/BVC</b>` alone.

### Checking your work

```bash
gjsify workspace @learn6502/translations check
```

`msgfmt` only asks whether a `msgstr` is non-empty, so a catalog can report 100% translated while
shipping strings the GNOME app cannot render. The `check` script reads what `msgfmt` does not, and
CI runs it on every pull request:

- the markup parses — every tag, attribute and `&` entity is one `GtkLabel` accepts, because a label
  whose markup fails to parse renders as nothing at all;
- every tag the English opens is still there, so no emphasis and no link is dropped in translation;
- `<tt>` content is unchanged, per the rule above;
- format placeholders match — none dropped, none added.

It says nothing about language quality; that still needs a native speaker.

## Resources

- [Project Repository](https://github.com/JumpLink/Learn6502)
- [Issue Tracker](https://github.com/JumpLink/Learn6502/issues)

## Language credits and validation status

Below is an overview of all languages, their sources, and human validation status. If you can help validate any language listed as “Needs validation”, please contribute via [Weblate](https://hosted.weblate.org/projects/eu-jumplink-learn6502/app/) or open an issue/PR.

| Language             | Code    | Source                                                                                        | Validator     | Status           |
| -------------------- | ------- | --------------------------------------------------------------------------------------------- | ------------- | ---------------- |
| German               | de      | Original (maintainers)                                                                        | @JumpLink     | Validated        |
| Spanish              | es      | AI‑assisted                                                                                   | @mmartinortiz | Validated        |
| Chinese (Simplified) | zh_Hans | Based on external translation: [codediy easy6502](https://codediy.github.io/nes-zh/easy6502/) | —             | Needs validation |
| Portuguese           | pt      | Based on external translation: [gustavogx/easy6502](https://github.com/gustavogx/easy6502)    | —             | Needs validation |
| Portuguese (Brazil)  | pt_BR   | AI‑assisted                                                                                   | —             | Needs validation |
| Dutch                | nl      | AI‑assisted                                                                                   | —             | Needs validation |
| French               | fr      | AI‑assisted                                                                                   | —             | Needs validation |
| Interlingua          | ia      | AI‑assisted                                                                                   | —             | Needs validation |
| Ukrainian            | uk      | AI‑assisted                                                                                   | —             | Needs validation |
| Japanese             | ja      | AI‑assisted                                                                                   | —             | Needs validation |
| Vietnamese           | vi      | Contributed by @hthienloc                                                                     | @hthienloc    | Validated        |
| Polish               | pl      | Initially contributed by Micro Wave                                                           | —             | Needs validation |
| Finnish              | fi      | Contributed by Jiri Grönroos                                                                  | Jiri Grönroos | Validated        |
| Hebrew               | he      | Contributed by Menachem (@naattxx)                                                            | @naattxx      | Validated        |
| Indonesian           | id      | Contributed by Arif Budiman (@arifpedia)                                                      | @arifpedia    | Validated        |
| Tamil                | ta      | Contributed by தமிழ் நேரம் (@TamilNeram) via Weblate                                          | —             | Needs validation |

To volunteer as a validator, please use [Weblate](https://hosted.weblate.org/projects/eu-jumplink-learn6502/app/) or report your feedback in the [issue tracker](https://github.com/JumpLink/Learn6502/issues).

## Testing translations in the GNOME app

To test your translations locally in the GNOME app:

```bash
# From the repository root

# 1) Build translations (creates MO files under packages/translations/dist/locale)
gjsify workspace @learn6502/translations build

# 2) Build the GNOME app (copies MO files for local runs)
gjsify workspace @learn6502/app-gnome build

# 3) Start the app in a specific language (examples)
LANGUAGE=nl gjsify run start:gnome     # Dutch
LANGUAGE=es gjsify run start:gnome     # Spanish
```

If translations do not appear, verify the compiled file exists at:
`packages/app-gnome/data/locale/<lang>/LC_MESSAGES/eu.jumplink.Learn6502.mo`.

## License

All translations are licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/)
