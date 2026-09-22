# PR #194 — Common: move the step refresh into the bridge

## `web-step-memory.png`

Four crops of the same widget: the web debugger's Hex Monitor card, region
`Display Memory ($0200-$05FF)`, taken from `packages/app-web/dist-app` built with
`gjsify build --app browser` and served over plain HTTP to a headless Chrome
(`--headless=new`, 1500x1100, device scale 1, clip captured at scale 2).

Both rows run the identical script: load the app, select region index 2, press
Assemble, switch Stepping mode on, then press Step 24 times with 420 ms between
presses — longer than the 349 ms throttle on `DebuggerController.update`, so no
redraw is merely pending when the shot is taken. The starter program is the one
`app-web` ships in its editor (`LDA $fe` / `STA $0200,X` / `INX` / `BNE loop`),
so 24 steps contain six `STA` writes and the first row of the dump gains six
bytes. The values differ between the rows because `$fe` is a fresh random byte
on every executed instruction; what is being compared is whether the card
changes at all, not which bytes it shows.

Top row: `main` at `7319f80d`, before this branch. The monitor already follows a
single step — that is the measurement that falsifies the claim this PR started
from ("a single step never redraws memory, on all three ports").

Bottom row: the same with this PR applied, where the refresh is driven by the
shared `GameConsoleEventBridge` instead of the web shell's own callback. Same
result, which is the point: the port lost its copy of the rule and behaves
identically.

The script counted the change, not just the eye: 6 of 24 steps altered the dump
text in both runs.
