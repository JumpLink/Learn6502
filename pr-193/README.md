# PR #193 — Android: build the hex monitor grid in code

Screenshots from a `Medium_Phone_API_36` emulator (1080x2400, 420 dpi), Learn6502
debug build, German locale, headless (`-no-window`, `swangle_indirect`).

Both shots end the same way: assemble from the action button, which lands on the
Debugger tab, then scroll to the Hex Monitor section. They differ in how the code
got into the editor — the before shot was typed in through `adb shell input text`,
the after shot loaded the commented Snake example from Learn > Beispiele. That has
no bearing on what the monitor shows: it renders `$0000-$00ff`, and neither
program had run at the last monitor refresh.

Crops are `1020x1155+30+185` out of the 1080x2400 frame, aligned on the
`Hex-Monitor` heading as `uiautomator dump` reports it (`[42,198][1037,243]`
before, `[42,187][1037,228]` after).

## `before-after.png`

Left, before the change: the Hex Monitor card is empty, and logcat carries
`E JS : CONSOLE ERROR: [HexMonitor] Grid not initialized` — `getViewById("grid")`
found nothing, because `hex-monitor.xml` was never loaded.

Right, after: the grid renders, one address label plus eight byte columns per row,
`$0000` to `$00ff` scrollable inside the card. Taken from the APK built from the
final commit of the branch. The bytes read `00` because nothing had written the
zero page at the last monitor refresh; that is the correct dump of a freshly
assembled machine, and the GNOME and web debuggers show the same 00s in that
state.

## `clipped-16.png`

An intermediate build that kept the original sixteen bytes per row. The addresses
step by `$10` but only eleven byte columns are drawn — `$0b` to `$0f` of every row
fall off the right edge of the card, with no horizontal scroll to reach them. This
is the measurement behind `BYTES_PER_ROW = 8`.
