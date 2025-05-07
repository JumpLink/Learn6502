import { BaseFileManager } from "@learn6502/common-ui";
import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

/**
 * GNOME-specific implementation of the FileManager
 * Uses GTK file dialogs for file operations
 */
export class GnomeFileManager extends BaseFileManager {
  private window: Gtk.Window;
  private unsavedChangesIndicator: Gtk.Button | null = null;
  private currentFile: Gio.File | null = null;

  constructor(window: Gtk.Window) {
    super();
    this.window = window;
  }

  /**
   * Set the unsaved changes indicator
   */
  public setUnsavedChangesIndicator(indicator: Gtk.Button): void {
    this.unsavedChangesIndicator = indicator;
  }

  /**
   * Open a file dialog and load the selected file
   */
  public async openFile(): Promise<{
    content: string;
    filename: string;
  } | null> {
    try {
      const fileDialog = new Gtk.FileDialog({
        title: _("Open Assembly File"),
        modal: true,
        filters: this.createFileFilters(),
      });

      // Select file
      const file = await fileDialog.open(this.window, null);
      if (!file) return null;

      // Load file contents
      const [contents] = await file.load_contents_async(null);
      if (!contents) {
        return null;
      }

      // Decode text
      const fileContent = new TextDecoder().decode(contents);

      // Set current filename
      this.currentFileName = file.get_basename() || null;
      this.currentFile = file;

      return {
        content: fileContent,
        filename: this.currentFileName || "untitled.asm",
      };
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
      const fileDialog = new Gtk.FileDialog({
        title: _("Save Assembly File"),
        modal: true,
        filters: this.createFileFilters(),
        initial_name: suggestedName || this.getCurrentFileName(),
      });

      const file = await fileDialog.save(this.window, null);
      if (!file) return false;

      // Save
      const success = await this.saveToFile(file, content);
      if (success) {
        this.currentFileName = file.get_basename() || null;
        this.currentFile = file;
        this.setUnsavedChanges(false);
      }

      return success;
    } catch (error) {
      console.error("Error in save as:", error);
      return false;
    }
  }

  /**
   * Save to the currently open file
   */
  protected async saveToCurrentFile(content: string): Promise<boolean> {
    if (!this.currentFile) {
      return false;
    }

    return this.saveToFile(this.currentFile, content);
  }

  /**
   * Internal method to save to a file
   */
  private async saveToFile(file: Gio.File, content: string): Promise<boolean> {
    try {
      // Open stream for writing
      const stream = await file.replace_async(
        null,
        false,
        Gio.FileCreateFlags.NONE,
        GLib.PRIORITY_DEFAULT,
        null
      );

      // Convert string to bytes
      const bytes = new TextEncoder().encode(content);

      // Write content
      await stream.write_bytes_async(
        new GLib.Bytes(bytes),
        GLib.PRIORITY_DEFAULT,
        null
      );

      // Close stream
      await stream.close_async(GLib.PRIORITY_DEFAULT, null);

      return true;
    } catch (error) {
      console.error("Error saving file:", error);
      return false;
    }
  }

  /**
   * Called when unsaved changes state changes
   */
  protected onUnsavedChangesChanged(hasChanges: boolean): void {
    if (this.unsavedChangesIndicator) {
      this.unsavedChangesIndicator.visible = hasChanges;

      // Update tooltip text
      if (this.currentFile === null) {
        this.unsavedChangesIndicator.tooltip_text = _("Unsaved changes");
      } else {
        this.unsavedChangesIndicator.tooltip_text = _(
          'File "%s" has unsaved changes'
        ).format(this.getCurrentFileName());
      }
    }
  }

  /**
   * Create file filters for ASM files
   */
  private createFileFilters(): Gio.ListStore {
    const filters = new Gio.ListStore({ item_type: Gtk.FileFilter.$gtype });

    const asmFilter = Gtk.FileFilter.new();
    asmFilter.set_name(_("Assembly Files"));
    asmFilter.add_pattern("*.asm");
    asmFilter.add_pattern("*.s");

    const allFilter = Gtk.FileFilter.new();
    allFilter.set_name(_("All Files"));
    allFilter.add_pattern("*");

    filters.append(asmFilter);
    filters.append(allFilter);

    return filters;
  }

  /**
   * Get the current file
   */
  public getCurrentGioFile(): Gio.File | null {
    return this.currentFile;
  }
}
