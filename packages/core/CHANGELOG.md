# @learn6502/core

## 0.8.0

### Minor Changes

- Windows and macOS builds, an AppImage, and the first two community examples.

  The app now ships for Windows and macOS alongside Linux, and Linux additionally
  gets an AppImage (issue #93). Four defects that only existed on the two new
  platforms are fixed in the gjsify core rather than worked around here: template
  properties never reached their JS setters, so every tutorial code block rendered
  empty and the copy button was missing; the process locale was never set, so every
  string stayed untranslated; the GNOME typeface was not in the runtime bundle; and
  `Adw.AboutDialog.new_from_appdata` does not exist on Windows, so the About dialog
  never opened.

  Also: Tamil translations, two community examples (Dino Run by Jacob, Line Buster
  6502 by edit12 — the first sent in through the share button), and Chinese
  language codes resolve again (issue #182).
