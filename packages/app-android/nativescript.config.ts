import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'eu.jumplink.Learn6502',
  appPath: 'app',
  appResourcesPath: 'data',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none'
  }
} as NativeScriptConfig;