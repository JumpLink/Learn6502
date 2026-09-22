# PR #193 — Android: build the hex monitor grid in code

Screenshots from an `Medium_Phone_API_36` emulator (1080x2400, 420 dpi), Learn6502
debug build, German locale. Both shots were driven the same way: load an example
into the editor, tap the action button to assemble (which lands on the Debugger
tab), scroll to the Hex Monitor section. Crops are `1020x1155+30+185` out of the
1080x2400 frame, taken from `uiautomator dump` bounds for the `Hex-Monitor`
heading (`[42,198][1037,243]` before, `[42,204][1037,249]` after).

## `hexmon-before-after.png`

Left, before the change: the Hex Monitor card is empty, and logcat carries
`E JS : CONSOLE ERROR: [HexMonitor] Grid not initialized` — `getViewById("grid")`
found nothing, because `hex-monitor.xml` was never loaded.

Right, after: the grid renders, one address label plus eight byte columns per row,
`$0000` to `$00ff` scrollable inside the card. The bytes read `00` because nothing
had written the zero page at the last monitor refresh; that is the correct dump of
a freshly initialised machine, and the same 33 `$00` rows appear in the GNOME and
web debuggers in that state.

## `hexmon-16-bytes-clipped.png`

An intermediate build that kept the original sixteen bytes per row. The addresses
step by `$10` but only eleven byte columns are drawn — `$0b` to `$0f` of every row
fall off the right edge of the card, with no horizontal scroll to reach them. This
is the measurement behind `BYTES_PER_ROW = 8`.
