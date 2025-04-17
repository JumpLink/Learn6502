// Types for both iOS and Android
// We do not need this because we only build the app for Android here
//// <reference path="../../node_modules/@nativescript/types/index.d.ts" />

// Android types
/// <reference path="../../node_modules/@nativescript/types-android/index.d.ts" />

// From https://github.com/Akylas/nativescript-app-utils/blob/6f1e887e75287473814ddfd73dbfb8489718755a/src/app-utils/typings/android.d.ts
declare namespace com {
  export namespace nativescript {
      export namespace apputils {
          export class FunctionCallback extends java.lang.Object {
              public constructor(implementation: { onResult(param0: java.lang.Exception, param1: any): void });
              public onResult(param0: java.lang.Exception, param1: any): void;
          }
          export namespace WorkersContext {
              export class Companion {
                  public static getValue(key): any;
                  public static setValue(key: string, value);
              }
          }
          export namespace Utils {
              export class WindowInsetsCallback extends java.lang.Object {
                  public constructor(implementation: { onWindowInsetsChange(result: number[]): void });
                  public constructor();
                  public onWindowInsetsChange(result: number[]): void;
              }
              export class Companion {
                  static prepareActivity(arg0: androidx.appcompat.app.AppCompatActivity, applyDynamicColors?: boolean);
                  static prepareWindow(arg0: android.view.Window);
                  static applyDayNight(context: android.content.Context, applyDynamicColors: boolean);
                  static applyDynamicColors(context: android.content.Context);
                  static getDimensionFromInt(context: android.content.Context, intToGet): number;
                  static getColorFromInt(context: android.content.Context, intToGet): number;
                  static getColorFromName(context: android.content.Context, intToGet): number;
                  static restartApp(context: android.content.Context, activity: android.app.Activity);
                  static getSystemLocale(): java.util.Locale;
                  static getRootWindowInsets(view: android.view.View): number[];
                  static listenForWindowInsetsChange(view: android.view.View, callback: WindowInsetsCallback);
                  static guessMimeType(context: android.content.Context, uri: android.net.Uri);
              }
          }
          export class ImageUtils extends java.lang.Object {
              public static class: java.lang.Class<ImageUtils>;
              public constructor();
          }
          export namespace ImageUtils {
              export class Companion extends java.lang.Object {
                  public static class: java.lang.Class<Companion>;
                  public static getImageSize(param0: globalAndroid.content.Context, param1: string): number[];
                  public static readBitmapFromFileSync(param0: globalAndroid.content.Context, param1: string, param2?: LoadImageOptions): globalAndroid.graphics.Bitmap;
                  public static readBitmapFromFileSync(param0: globalAndroid.content.Context, param1: string, param2: string): globalAndroid.graphics.Bitmap;
                  public static readBitmapFromFile(param0: globalAndroid.content.Context, param1: string, callback: FunctionCallback, param2: string);
                  public static calculateInSampleSize(param0: number, param1: number, param2: number, param3: number): number;
                  public static getTargetFormat(param0: string): globalAndroid.graphics.Bitmap.CompressFormat;
              }
              export class ImageAssetOptions extends java.lang.Object {
                  public static class: java.lang.Class<ImageAssetOptions>;
                  public setAutoScaleFactor(param0: boolean): void;
                  public setWidth(param0: number): void;
                  public getAutoScaleFactor(): boolean;
                  public constructor(param0: globalAndroid.graphics.BitmapFactory.Options, param1: LoadImageOptions);
                  public constructor(param0: globalAndroid.graphics.BitmapFactory.Options);
                  public getWidth(): number;
                  public setHeight(param0: number): void;
                  public setKeepAspectRatio(param0: boolean): void;
                  public getKeepAspectRatio(): boolean;
                  public getHeight(): number;
              }
              export class LoadImageOptions extends java.lang.Object {
                  public static class: java.lang.Class<LoadImageOptions>;
                  public setAutoScaleFactor(param0: boolean): void;
                  public setWidth(param0: number): void;
                  public setMaxHeight(param0: number): void;
                  public setMaxWidth(param0: number): void;
                  public getResizeThreshold(): number;
                  public constructor(param0: string);
                  public constructor(param0: org.json.JSONObject);
                  public getHeight(): number;
                  public initWithJSON(param0: org.json.JSONObject): void;
                  public getAutoScaleFactor(): boolean;
                  public getWidth(): number;
                  public getMaxWidth(): number;
                  public getMaxHeight(): number;
                  public setHeight(param0: number): void;
                  public setKeepAspectRatio(param0: boolean): void;
                  public getKeepAspectRatio(): boolean;
                  public setResizeThreshold(param0: number): void;
              }
          }
      }
  }
}

