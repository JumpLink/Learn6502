import { BaseFileService } from "@learn6502/common-ui";
import {
  Application,
  Folder,
  File,
  knownFolders,
  path,
} from "@nativescript/core";
import { Observable } from "@nativescript/core/data/observable";

/**
 * Android-specific implementation of the FileService
 * Uses NativeScript file system APIs for file operations
 */
export class AndroidFileService extends BaseFileService {
  // Event source for file change notifications
  private _eventSource = new Observable();
  private currentFilePath: string | null = null;

  constructor() {
    super();
  }

  /**
   * Open a file using Android's file picker intent
   */
  public async openFile(): Promise<{
    content: string;
    filename: string;
  } | null> {
    try {
      // Get the current activity
      const activity = Application.android.foregroundActivity;
      if (!activity) {
        console.error("No foreground activity available");
        return null;
      }

      // Create an intent for opening a document
      const intent = new android.content.Intent(
        android.content.Intent.ACTION_OPEN_DOCUMENT
      );
      intent.setType("*/*");
      intent.addCategory(android.content.Intent.CATEGORY_OPENABLE);

      // Add MIME types for supported file types
      const mimeTypes = ["text/plain", "text/x-asm"];
      intent.putExtra(android.content.Intent.EXTRA_MIME_TYPES, mimeTypes);

      return new Promise((resolve) => {
        // Start the activity for result
        activity.startActivityForResult(intent, 101);

        // Handle activity result
        Application.android.on(
          Application.android.activityResultEvent,
          (args) => {
            const requestCode = args.requestCode;
            const resultCode = args.resultCode;
            const data = args.intent;

            // Check if it's our file request and it was successful
            if (
              requestCode === 101 &&
              resultCode === android.app.Activity.RESULT_OK &&
              data
            ) {
              const uri = data.getData();
              if (uri) {
                try {
                  // Get content resolver
                  const contentResolver = activity.getContentResolver();

                  // Get file name from URI
                  let fileName = "unknown.asm";

                  // Query for file name
                  const cursor = contentResolver.query(
                    uri,
                    [android.provider.OpenableColumns.DISPLAY_NAME],
                    null,
                    null,
                    null
                  );

                  if (cursor && cursor.moveToFirst()) {
                    const nameIndex = cursor.getColumnIndex(
                      android.provider.OpenableColumns.DISPLAY_NAME
                    );
                    if (nameIndex !== -1) {
                      fileName = cursor.getString(nameIndex);
                    }
                    cursor.close();
                  }

                  // Open input stream and read file content
                  const inputStream = contentResolver.openInputStream(uri);
                  const reader = new java.io.BufferedReader(
                    new java.io.InputStreamReader(inputStream)
                  );

                  let line;
                  const stringBuilder = new java.lang.StringBuilder();
                  while ((line = reader.readLine()) !== null) {
                    stringBuilder.append(line);
                    stringBuilder.append("\n");
                  }

                  inputStream.close();

                  // Get file content as string
                  const fileContent = stringBuilder.toString();

                  // Set current file
                  this.currentFileName = fileName;
                  this.currentFilePath = uri.toString();

                  // Return file content and name
                  resolve({
                    content: fileContent,
                    filename: fileName,
                  });
                } catch (error) {
                  console.error("Error reading file:", error);
                  resolve(null);
                }
              } else {
                resolve(null);
              }
            }
          }
        );
      });
    } catch (error) {
      console.error("Error opening file:", error);
      return null;
    }
  }

  /**
   * Save content to a new file with file selection dialog
   */
  public async saveFileAs(
    content: string,
    suggestedName?: string
  ): Promise<boolean> {
    try {
      // Get the current activity
      const activity = Application.android.foregroundActivity;
      if (!activity) {
        console.error("No foreground activity available");
        return false;
      }

      // Create intent for creating a new document
      const intent = new android.content.Intent(
        android.content.Intent.ACTION_CREATE_DOCUMENT
      );
      intent.setType("text/plain");
      intent.addCategory(android.content.Intent.CATEGORY_OPENABLE);

      // Set suggested file name
      intent.putExtra(
        android.content.Intent.EXTRA_TITLE,
        suggestedName || this.getCurrentFileName() || "untitled.asm"
      );

      return new Promise((resolve) => {
        // Start the activity for result
        activity.startActivityForResult(intent, 102);

        // Handle activity result
        Application.android.on(
          Application.android.activityResultEvent,
          (args) => {
            const requestCode = args.requestCode;
            const resultCode = args.resultCode;
            const data = args.intent;

            // Check if it's our save request and it was successful
            if (
              requestCode === 102 &&
              resultCode === android.app.Activity.RESULT_OK &&
              data
            ) {
              const uri = data.getData();
              if (uri) {
                try {
                  // Get content resolver
                  const contentResolver = activity.getContentResolver();

                  // Query for file name
                  const cursor = contentResolver.query(
                    uri,
                    [android.provider.OpenableColumns.DISPLAY_NAME],
                    null,
                    null,
                    null
                  );

                  if (cursor && cursor.moveToFirst()) {
                    const nameIndex = cursor.getColumnIndex(
                      android.provider.OpenableColumns.DISPLAY_NAME
                    );
                    if (nameIndex !== -1) {
                      this.currentFileName = cursor.getString(nameIndex);
                    }
                    cursor.close();
                  }

                  // Open output stream and write content
                  const outputStream = contentResolver.openOutputStream(
                    uri,
                    "wt"
                  );
                  const writer = new java.io.BufferedWriter(
                    new java.io.OutputStreamWriter(outputStream)
                  );

                  writer.write(content);
                  writer.flush();
                  writer.close();

                  // Update current file
                  this.currentFilePath = uri.toString();
                  this.setUnsavedChanges(false);

                  resolve(true);
                } catch (error) {
                  console.error("Error saving file:", error);
                  resolve(false);
                }
              } else {
                resolve(false);
              }
            }
          }
        );
      });
    } catch (error) {
      console.error("Error in save as:", error);
      return false;
    }
  }

  /**
   * Save to the currently open file
   */
  protected async saveToCurrentFile(content: string): Promise<boolean> {
    if (!this.currentFilePath) {
      return this.saveFileAs(content);
    }

    try {
      // Get the current activity and content resolver
      const activity = Application.android.foregroundActivity;
      if (!activity) {
        console.error("No foreground activity available");
        return false;
      }

      const contentResolver = activity.getContentResolver();
      const uri = android.net.Uri.parse(this.currentFilePath);

      // Open output stream and write content
      const outputStream = contentResolver.openOutputStream(uri, "wt");
      const writer = new java.io.BufferedWriter(
        new java.io.OutputStreamWriter(outputStream)
      );

      writer.write(content);
      writer.flush();
      writer.close();

      this.setUnsavedChanges(false);
      return true;
    } catch (error) {
      console.error("Error saving to current file:", error);
      return false;
    }
  }

  /**
   * Called when unsaved changes state changes
   */
  protected onUnsavedChangesChanged(hasChanges: boolean): void {
    // Notify any listeners about the change
    this._eventSource.notify({
      eventName: "unsavedChangesChanged",
      object: this._eventSource,
      hasChanges,
    });
  }

  /**
   * Add event listener for file events
   */
  public addEventListener(
    eventName: string,
    callback: (args: any) => void
  ): void {
    this._eventSource.on(eventName, callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(
    eventName: string,
    callback: (args: any) => void
  ): void {
    this._eventSource.off(eventName, callback);
  }

  /**
   * Get the file URI
   */
  public getCurrentFileUri(): string | null {
    return this.currentFilePath;
  }
}
