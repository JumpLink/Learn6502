import { injectedMainWindowPlatform, type MainWindowHost, type MainWindowPlatform } from "./platform.ts";

export function createMainWindowPlatform(host: MainWindowHost): MainWindowPlatform {
  return injectedMainWindowPlatform(host);
}
