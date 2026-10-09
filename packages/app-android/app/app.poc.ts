// PoC entry: proves @learn6502/{app,core,common-ui} resolve from the excluded workspace.
import { Application, Label } from "@nativescript/core";
import { platformProbe } from "@learn6502/app";
import * as core from "@learn6502/core";
import * as commonUi from "@learn6502/common-ui";

console.log("PLATFORM_PROBE=" + platformProbe, Object.keys(core).length, Object.keys(commonUi).length);

Application.run({
  create: () => {
    const label = new Label();
    label.text = "PLATFORM_PROBE=" + platformProbe;
    return label;
  },
});
