# Android App Startup Fixes

## Problem

The app was failing to start with error:

```
TypeError: Cannot read properties of undefined (reading 'extend')
at ../../node_modules/@nativescript/core/ui/core/view/index.android.js
```

## Root Cause

NativeScript UI components were being imported/accessed before the Android runtime was initialized. This happened at module load time, causing the `.extend()` method (used internally by NativeScript to create native Android views) to be unavailable.

## Fixes Applied

### 1. Fixed `app/variables.ts` ✅

**Problem:** Screen API was accessed at module declaration time

```typescript
// BEFORE (WRONG):
public readonly screenHeightDips = Screen.mainScreen.heightDIPs;
public readonly screenWidthDips = Screen.mainScreen.widthDIPs;
public readonly screenRatio = Screen.mainScreen.widthDIPs / Screen.mainScreen.heightDIPs;
```

**Solution:** Defer initialization until `initialize()` method is called

```typescript
// AFTER (CORRECT):
public screenHeightDips!: number;
public screenWidthDips!: number;
public screenRatio!: number;

public initialize(): void {
  // Initialize screen dimensions (must be done after Android runtime is ready)
  this.screenHeightDips = Screen.mainScreen.heightDIPs;
  this.screenWidthDips = Screen.mainScreen.widthDIPs;
  this.screenRatio = this.screenWidthDips / this.screenHeightDips;
  // ... rest of initialization
}
```

### 2. Fixed `app/services/notification.service.ts` ✅

**Problem:** UI dialogs were imported at module load time

```typescript
// BEFORE (WRONG):
import { alert, confirm } from "@nativescript/core/ui/dialogs";
```

**Solution:** Use dynamic imports (lazy loading)

```typescript
// AFTER (CORRECT):
// IMPORTANT: Do NOT import dialogs at module level
// import { alert, confirm } from "@nativescript/core/ui/dialogs";

protected async displayConfirmDialog(options: DialogOptions): Promise<boolean> {
  // Lazy import to avoid loading UI components at module load time
  const { confirm } = await import("@nativescript/core/ui/dialogs");
  const result = await confirm({...});
  return result;
}

protected async displayInfoDialog(options: DialogOptions): Promise<void> {
  // Lazy import to avoid loading UI components at module load time
  const { alert } = await import("@nativescript/core/ui/dialogs");
  await alert({...});
}
```

### 3. Webpack Configuration

- Added `string-replace-loader` to replace `__PACKAGE__` placeholder with actual app ID
- Configured webpack to handle TypeScript compilation correctly
- Added debug logging for webpack configuration

## Current Status

### ✅ Working

- App starts and runs successfully without custom activity
- All core functionality is operational
- Theme service works correctly
- UI components load properly after runtime initialization

### 🚧 Pending: Custom Activity

The custom `activity.android.ts` file is currently disabled due to a webpack bundling issue:

**Problem:** When added as an `appComponent`, the activity file is bundled into the main bundle and evaluated at application startup, triggering the same early UI component loading error.

**Files Involved:**

- `app/android/activity.android.ts` - Custom activity implementation (complete and correct)
- `webpack.config.js` - Activity registration commented out
- `AndroidManifest.xml` - Uses default `com.tns.NativeScriptActivity`

**Next Steps for Custom Activity:**

1. Investigate webpack's `appComponents` bundling strategy
2. Consider alternative approaches:
   - Use `application.android.ts` instead of activity
   - Implement edge-to-edge in activity lifecycle events
   - Create separate webpack entry point for activity
3. Compare with reference projects' build output to identify differences

## Reference Projects

The solution was guided by these NativeScript reference projects:

- `references/nativescript/alpimaps/`
- `references/nativescript/conty/`
- `references/nativescript/oss-weather/`

## Testing

To verify the fixes work:

```bash
cd packages/app-android
yarn start:clean:emulated
```

Expected result: App should start successfully and display the main interface.

## Additional Notes

### Edge-to-Edge Implementation

The edge-to-edge Android UI feature can be implemented without a custom activity by:

1. Using `Application.android.activityStartedEvent` lifecycle hook
2. Calling `WindowCompat.setDecorFitsSystemWindows(window, false)` when activity is ready
3. This approach is safer as it doesn't require custom activity bundling

### Learning Points

1. **Module Load Time vs Runtime:** Be careful about what code runs at module load time vs runtime
2. **Lazy Imports:** Use dynamic `import()` for UI components that might be loaded early
3. **Initialization Order:** Always defer API calls that depend on platform runtime to initialization methods
4. **Webpack AppComponents:** The `appComponents` feature needs careful configuration to avoid early evaluation

## Resources

- [NativeScript Documentation: Extending Android Activity](https://docs.nativescript.org/guide/extending-classes-and-implementing-interfaces-android#extending-android-activity)
- [NativeScript Webpack Configuration](https://docs.nativescript.org/webpack)
