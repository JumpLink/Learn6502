import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'eu.jumplink.Learn6502',
  appPath: 'app',
  appResourcesPath: 'data',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
    minSdkVersion: 21, // Minimum Android 5.0 (Lollipop) für Material Design 3
    targetSdkVersion: 32 // Target ist aktuelle Standard-Version (oder höher)
  }
} as NativeScriptConfig;