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

## Project Structure

- **UI Elements & Messages**: Managed through `.po` files
- **Tutorial Content**: Located in [packages/learn/tutorial.mdx](https://github.com/JumpLink/Learn6502/blob/main/packages/learn/tutorial.mdx)

## Translation Guidelines

1. **Do not translate**:
   - Technical terms (6502, Assembly, CPU, registers)
   - Command names and mnemonics (LDA, STA, BRK)
   - Variable names and placeholders

2. **Maintain**:
   - Markdown syntax
   - HTML tags
   - Formatting placeholders

3. **External links**:
   - You may replace links to English pages with equivalent high-quality pages in the target language.
   - Prefer reputable sources (e.g., Wikipedia) when a high-quality article exists in the target language.

## Resources

- [Project Repository](https://github.com/JumpLink/Learn6502)
- [Issue Tracker](https://github.com/JumpLink/Learn6502/issues)

## Testing translations in the GNOME app

To test your translations locally in the GNOME app:

```bash
# From the repository root

# 1) Build translations (creates MO files under packages/translations/dist/locale)
yarn workspace @learn6502/translations run build

# 2) Build the GNOME app (copies MO files for local runs)
yarn workspace @learn6502/app-gnome run build

# 3) Start the app in a specific language (examples)
LANGUAGE=nl yarn start:gnome     # Dutch
LANGUAGE=es yarn start:gnome     # Spanish
```

If translations do not appear, verify the compiled file exists at:
`packages/app-gnome/data/locale/<lang>/LC_MESSAGES/eu.jumplink.Learn6502.mo`.

## License

All translations are licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/)
