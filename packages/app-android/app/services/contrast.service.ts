import { systemStates, SystemStates } from "../states";
import { getRootViewWhenReady, restartApp, showError } from "../utils/index";
import type { ContrastMode } from "../constants";
import type { ContrastChangeEvent } from "~/types";
import { logger } from "~/utils";

const CONTRAST_CLASSES = ["ns-contrast-normal", "ns-contrast-medium", "ns-contrast-high"];

/**
 * Follows the system contrast level with the `ns-contrast-*` classes `app.css` styles against.
 * Color scheme, primary and accent colors are the shared `themeService`'s from `@learn6502/ui`.
 */
export class ContrastService {
  private restartRequiredOnResume = false;
  private log = logger.scoped("ContrastService");

  public initialize(): void {
    systemStates.events.on(SystemStates.contrastChangedEvent, async (event: ContrastChangeEvent) => {
      this.log.debug("contrastChangedEvent", event);

      // WORKAROUND: Flag the app for restart when the contrast mode changes
      // (instead of restarting immediately)
      if (!event.initial) this.restartRequiredOnResume = true;

      try {
        await this.updateContrastClasses(event.newValue);
      } catch (error) {
        showError(error, { silent: true });
      }
    });

    systemStates.events.on(SystemStates.resumeEvent, () => {
      if (!this.restartRequiredOnResume) return;
      // Reset first, so a failing restart cannot loop
      this.restartRequiredOnResume = false;
      restartApp();
    });
  }

  private async updateContrastClasses(contrast: ContrastMode | null): Promise<void> {
    if (!contrast) return;
    const rootView = await getRootViewWhenReady();
    if (!rootView) return;

    for (const view of [rootView, ...(rootView._getRootModalViews() ?? [])]) {
      for (const name of CONTRAST_CLASSES) view.cssClasses.delete(name);
      view.cssClasses.add("ns-contrast-" + contrast);
      view._onCssStateChange();
    }
  }
}

export const contrastService = new ContrastService();
