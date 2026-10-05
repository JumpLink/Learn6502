import type { EventData, Frame } from "@nativescript/core";
import { Utils } from "@nativescript/core";
import { logger } from "~/utils";
import { themeService } from "~/services";

const log = logger.scoped("AppRoot");

export function onLoaded(args: EventData) {
  const rootFrame = args.object as Frame;
  log.debug("app-root loaded");

  // Listen for androidOverflowInset events
  rootFrame.on("androidOverflowInset", (event: any) => {
    const { inset } = event;

    log.debug("androidOverflowInset received (raw pixels):", {
      top: inset.top,
      bottom: inset.bottom,
      left: inset.left,
      right: inset.right,
    });

    // Convert inset values from pixels to device-independent pixels (dip)
    // Pattern from reference projects (alpimaps, conty, oss-weather)
    // The androidOverflowInset event provides values in pixels, but NativeScript
    // CSS uses density-independent pixels (dip), so we need to convert them.
    const insetValues = {
      top: Utils.layout.toDeviceIndependentPixels(inset.top),
      bottom: Utils.layout.toDeviceIndependentPixels(inset.bottom),
      left: Utils.layout.toDeviceIndependentPixels(inset.left),
      right: Utils.layout.toDeviceIndependentPixels(inset.right),
    };

    log.debug("androidOverflowInset converted (dip):", insetValues);

    // Update CSS variables via themeService
    themeService.updateSafeAreaInsets(insetValues);

    // CRITICAL: Set insets to 0 AND mark as consumed to prevent NativeScript from
    // automatically applying padding. The Java code in LayoutBase.java line 280
    // uses the inset values directly if they're not 0, so we must set them to 0.
    // Pattern: Set to 0 + mark as consumed (like NativeScript Toolbox example).
    inset.top = 0;
    inset.bottom = 0;
    inset.left = 0;
    inset.right = 0;
    inset.topConsumed = true;
    inset.bottomConsumed = true;
    inset.leftConsumed = true;
    inset.rightConsumed = true;
  });
}
