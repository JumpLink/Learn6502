import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'eu.jumplink.Learn6502',
  appPath: 'app',
  appResourcesPath: 'data',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
    minSdkVersion: 21, // Minimum Android 5.0 (Lollipop) for Material Design 3
    targetSdkVersion: 35 // Target is the current standard version (or higher)
  }
} as NativeScriptConfig;