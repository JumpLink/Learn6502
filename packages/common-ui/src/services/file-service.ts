/**
 * Abstract class for file operations across platforms
 */
export abstract class FileService {
  protected currentFileName: string | null = null;
  protected unsavedChanges: boolean = false;

  /**
   * Open a file dialog and load the selected file's content
   * @returns Promise with the file content and name or null if canceled
   */
  public abstract openFile(): Promise<{
    content: string;
    filename: string;
  } | null>;

  /**
   * Save content to the current file or show save dialog if no file is open
   * @param content Content to save
   * @param suggestedName Optional suggested filename
   */
  public async saveFile(
    content: string,
    suggestedName?: string
  ): Promise<boolean> {
    if (this.currentFileName) {
      const success = await this.saveToCurrentFile(content);
      if (success) {
        this.setUnsavedChanges(false);
      }
      return success;
    } else {
      return this.saveFileAs(content, suggestedName);
    }
  }

  /**
   * Save content to a new file, showing the file dialog
   * @param content Content to save
   * @param suggestedName Suggested filename
   * @returns Promise that resolves to true if save succeeded
   */
  public abstract saveFileAs(
    content: string,
    suggestedName?: string
  ): Promise<boolean>;

  /**
   * Platform-specific implementation to save to the current file
   */
  protected abstract saveToCurrentFile(content: string): Promise<boolean>;

  /**
   * Get the current filename or a default
   * @returns Current filename or a default name
   */
  public getCurrentFileName(): string {
    return this.currentFileName || "untitled.asm";
  }

  /**
   * Check if there are unsaved changes
   * @returns True if there are unsaved changes
   */
  public hasUnsavedChanges(): boolean {
    return this.unsavedChanges;
  }

  /**
   * Set the unsaved changes flag
   * @param hasChanges Whether there are unsaved changes
   */
  public setUnsavedChanges(hasChanges: boolean): void {
    this.unsavedChanges = hasChanges;
    this.onUnsavedChangesChanged(hasChanges);
  }

  /**
   * Called when unsaved changes state changes
   * Platform implementations can override to update UI
   */
  protected onUnsavedChangesChanged(hasChanges: boolean): void {
    // Base implementation does nothing
  }
}
