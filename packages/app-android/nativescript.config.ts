import { NativeScriptConfig } from "@nativescript/core";

const config: NativeScriptConfig = {
  id: "eu.jumplink.Learn6502",
  appPath: "app",
  appResourcesPath: "data",
  bundler: "vite",
  bundlerConfigPath: "vite.config.ts",
  android: {
    v8Flags: "--expose_gc",
  },
};

export default config;
