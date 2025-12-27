import {
  AndroidActivityCallbacks,
  Application,
  setActivityCallbacks,
} from "@nativescript/core";

const TAG = "[MainActivity]";

@NativeClass()
@JavaProxy("__PACKAGE__.MainActivity")
export class MainActivity extends androidx.appcompat.app.AppCompatActivity {
  public isNativeScriptActivity: boolean;

  private _callbacks: AndroidActivityCallbacks;

  public override onCreate(savedInstanceState: android.os.Bundle): void {
    DEV_LOG && console.log(TAG, "onCreate");

    // Initialize Android runtime (required by NativeScript)
    Application.android.init(this.getApplication());

    // Set the isNativeScriptActivity in onCreate (as done in the original NativeScript activity code)
    // The JS constructor might not be called because the activity is created from Android.
    this.isNativeScriptActivity = true;
    if (!this._callbacks) {
      setActivityCallbacks(this);
    }

    this._callbacks.onCreate(
      this,
      savedInstanceState,
      this.getIntent(),
      super.onCreate
    );

    // Note: NativeScript automatically calls enableEdgeToEdge() in onActivityCreated
    // We configure colors via setStatusBarColor/setNavigationBarColor in app.ts
    // See: references/nativescript/nativescript/packages/core/application/application.android.ts:71
  }

  public override onNewIntent(intent: android.content.Intent): void {
    this._callbacks.onNewIntent(
      this,
      intent,
      super.setIntent,
      super.onNewIntent
    );
  }

  public override onSaveInstanceState(outState: android.os.Bundle): void {
    this._callbacks.onSaveInstanceState(
      this,
      outState,
      super.onSaveInstanceState
    );
  }

  public override onStart(): void {
    DEV_LOG && console.log(TAG, "onStart");
    this._callbacks.onStart(this, super.onStart);
  }

  public override onStop(): void {
    DEV_LOG && console.log(TAG, "onStop");
    this._callbacks.onStop(this, super.onStop);
  }

  public override onDestroy(): void {
    DEV_LOG && console.log(TAG, "onDestroy");
    this._callbacks.onDestroy(this, super.onDestroy);
  }

  public override onPostResume(): void {
    this._callbacks.onPostResume(this, super.onPostResume);
    // Note: Edge-to-edge is handled via Utils.android.enableEdgeToEdge() in app.ts
  }

  public override onBackPressed(): void {
    this._callbacks.onBackPressed(this, super.onBackPressed);
  }

  public override onRequestPermissionsResult(
    requestCode: number,
    permissions: string[],
    grantResults: number[]
  ): void {
    this._callbacks.onRequestPermissionsResult(
      this,
      requestCode,
      permissions,
      grantResults,
      undefined /*TODO: Enable if needed*/
    );
  }

  public override onActivityResult(
    requestCode: number,
    resultCode: number,
    data: android.content.Intent
  ): void {
    this._callbacks.onActivityResult(
      this,
      requestCode,
      resultCode,
      data,
      super.onActivityResult
    );
  }
}
