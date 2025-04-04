# Learn 6502 Assembly Translations

This package contains the translations for Learn 6502 Assembly. The project is hosted on [GitHub](https://github.com/JumpLink/Learn6502).

# Translation Guide for Learn 6502 Assembly

Thanks for helping to translate **Learn 6502 Assembly**!

## Getting Started

1. Make an account on [Weblate](https://weblate.org) or sign in with your GitHub or GitLab ID
   - Note: Account creation is not required, but you will only be able to suggest translations without an account

2. Visit the [Weblate eu.jumplink.Learn6502 project page](https://hosted.weblate.org/projects/eu-jumplink-learn6502/) which lists all components and their strings

3. On the project's 'Languages' tab, you can:
   - Choose an existing language to work on
   - Start a new language translation by clicking "Start a new translation"
   - Note: New languages require a reviewer to be shipped with official releases

## Project Structure

The project's translatable content is organized as follows:

- **UI Elements & Messages**: Managed through `.po` files, automatically generated from the source code
- **Tutorial Content**: Located in [packages/learn/tutorial.mdx](https://github.com/JumpLink/Learn6502/blob/main/packages/learn/tutorial.mdx)
  - The tutorial is written in English (source language)
  - Changes to English content should be made directly in the tutorial.mdx file
  - Translations of the tutorial are managed through the .po files

## Translation Guidelines

### General Rules

1. **Technical Terms**: Do not translate:
   - Technical terms like "6502", "Assembly", "CPU", "registers"
   - Command names and mnemonics (e.g., "LDA", "STA", "BRK")
   - Variable names and placeholders

2. **Formatting**:
   - Preserve Markdown syntax
   - Maintain HTML tags and their structure
   - Keep formatting placeholders (e.g., `%s`, `{0}`)

3. **Consistency**:
   - Use consistent terminology throughout translations
   - Follow existing translations for common terms
   - Pay attention to context notes in the PO files

4. **Links and References**:
   - You may replace links to English information pages (e.g., English Wikipedia articles) with equivalent pages in the target language
   - Ensure that the replacement links contain comparable information
   - The replacement link should be from a reliable source

### Quality Assurance

- Review translations for accuracy and completeness
- Test translations in the application if possible
- Report any issues or unclear source strings in our [issue tracker](https://github.com/JumpLink/Learn6502/issues)

## Becoming a Reviewer

If you're interested in becoming a reviewer for your language:
1. Create an issue in our [issue tracker](https://github.com/JumpLink/Learn6502/issues)
2. Mention your language expertise and translation experience
3. We'll review your request and provide necessary permissions

## Helpful Resources

- [Markdown Cheatsheet](https://www.markdownguide.org/cheat-sheet/)
- [Weblate Documentation](https://docs.weblate.org/)
- [Flathub Page](https://flathub.org/apps/eu.jumplink.Learn6502)
- [Project Repository](https://github.com/JumpLink/Learn6502)
- [Issue Tracker](https://github.com/JumpLink/Learn6502/issues)

## License

All translations are licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/)