import type { EventData } from "@nativescript/core";
import { logger } from "~/utils";

export function onLoaded(args: EventData) {
  logger.log("app-root loaded");
}
