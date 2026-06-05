/**
 * Material Design 3 Android Type Declarations
 *
 * These types are extracted from @nativescript-community/ui-material-components
 * and provide TypeScript support for Material Design 3 components not included
 * in the standard @nativescript/types-android package.
 *
 * @see https://github.com/nativescript-community/ui-material-components
 * @see https://m3.material.io/components
 */

declare namespace com {
  export namespace google {
    export namespace android {
      export namespace material {
        export namespace materialswitch {
          /**
           * Material Design 3 Switch component
           *
           * A two-state toggle switch that can be configured to show an icon on the thumb.
           * Extends SwitchCompat with Material Design 3 styling and additional features.
           *
           * @see https://m3.material.io/components/switch/overview
           */
          export class MaterialSwitch extends androidx.appcompat.widget.SwitchCompat {
            public static class: java.lang.Class<com.google.android.material.materialswitch.MaterialSwitch>;

            // Constructors
            public constructor(param0: globalAndroid.content.Context);
            public constructor(param0: globalAndroid.content.Context, param1: globalAndroid.util.AttributeSet);
            public constructor(
              param0: globalAndroid.content.Context,
              param1: globalAndroid.util.AttributeSet,
              param2: number
            );
            public constructor(
              param0: globalAndroid.content.Context,
              param1: globalAndroid.util.AttributeSet,
              param2: number,
              param3: number
            );

            // Track decoration (border/outline)
            public setTrackDecorationTintList(param0: globalAndroid.content.res.ColorStateList): void;
            public getTrackDecorationTintList(): globalAndroid.content.res.ColorStateList;
            public setTrackDecorationTintMode(param0: globalAndroid.graphics.PorterDuff.Mode): void;
            public getTrackDecorationTintMode(): globalAndroid.graphics.PorterDuff.Mode;
            public setTrackDecorationDrawable(param0: globalAndroid.graphics.drawable.Drawable): void;
            public getTrackDecorationDrawable(): globalAndroid.graphics.drawable.Drawable;
            public setTrackDecorationResource(param0: number): void;

            // Track
            public setTrackTintList(param0: globalAndroid.content.res.ColorStateList): void;
            public getTrackTintList(): globalAndroid.content.res.ColorStateList;
            public setTrackTintMode(param0: globalAndroid.graphics.PorterDuff.Mode): void;
            public setTrackDrawable(param0: globalAndroid.graphics.drawable.Drawable): void;
            public getTrackDrawable(): globalAndroid.graphics.drawable.Drawable;

            // Thumb
            public setThumbTintList(param0: globalAndroid.content.res.ColorStateList): void;
            public getThumbTintList(): globalAndroid.content.res.ColorStateList;
            public setThumbTintMode(param0: globalAndroid.graphics.PorterDuff.Mode): void;
            public setThumbDrawable(param0: globalAndroid.graphics.drawable.Drawable): void;
            public getThumbDrawable(): globalAndroid.graphics.drawable.Drawable;

            // Thumb icon (MD3 feature)
            public setThumbIconTintList(param0: globalAndroid.content.res.ColorStateList): void;
            public getThumbIconTintList(): globalAndroid.content.res.ColorStateList;
            public setThumbIconTintMode(param0: globalAndroid.graphics.PorterDuff.Mode): void;
            public getThumbIconTintMode(): globalAndroid.graphics.PorterDuff.Mode;
            public setThumbIconDrawable(param0: globalAndroid.graphics.drawable.Drawable): void;
            public getThumbIconDrawable(): globalAndroid.graphics.drawable.Drawable;
            public setThumbIconResource(param0: number): void;

            // State
            public setChecked(param0: boolean): void;
            public isChecked(): boolean;
            public toggle(): void;
            public setEmojiCompatEnabled(param0: boolean): void;
            public isEmojiCompatEnabled(): boolean;

            // Accessibility
            public sendAccessibilityEvent(param0: number): void;
            public sendAccessibilityEventUnchecked(param0: globalAndroid.view.accessibility.AccessibilityEvent): void;

            // Drawable callbacks
            public invalidateDrawable(param0: globalAndroid.graphics.drawable.Drawable): void;
            public scheduleDrawable(
              param0: globalAndroid.graphics.drawable.Drawable,
              param1: java.lang.Runnable,
              param2: number
            ): void;
            public unscheduleDrawable(
              param0: globalAndroid.graphics.drawable.Drawable,
              param1: java.lang.Runnable
            ): void;
            public unscheduleDrawable(param0: globalAndroid.graphics.drawable.Drawable): void;

            // View methods
            public invalidate(): void;
            /** @deprecated */
            public invalidate(param0: number, param1: number, param2: number, param3: number): void;
            /** @deprecated */
            public invalidate(param0: globalAndroid.graphics.Rect): void;
            public onCreateDrawableState(param0: number): androidNative.Array<number>;
            public onPreDraw(): boolean;

            // Key events
            public onKeyDown(param0: number, param1: globalAndroid.view.KeyEvent): boolean;
            public onKeyUp(param0: number, param1: globalAndroid.view.KeyEvent): boolean;
            public onKeyLongPress(param0: number, param1: globalAndroid.view.KeyEvent): boolean;
            public onKeyMultiple(param0: number, param1: number, param2: globalAndroid.view.KeyEvent): boolean;
          }
        }
      }
    }
  }
}
