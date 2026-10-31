import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";
import { FileService as BaseFileService } from "./services/file.service.ts";
import { _ } from "./translate.ts";

Gio._promisify(Gio.OutputStream.prototype, "write_bytes_async", "write_bytes_finish");
Gio._promisify(Gio.OutputStream.prototype, "close_async", "close_finish");
Gio._promisify(Gio.File.prototype, "load_contents_async", "load_contents_finish");
Gio._promisify(Gio.File.prototype, "replace_async", "replace_finish");
Gio._promisify(Gtk.FileDialog.prototype, "open", "open_finish");
Gio._promisify(Gtk.FileDialog.prototype, "save", "save_finish");

export interface FileServiceOptions {
  /** Owner window for the dialogs; GNOME passes the main window, web and Android may omit it. */
  parent?: () => Gtk.Window | null;
  /** A failure the user should hear about (not a dismissal). Default: console.error. */
  onError?: (message: string, error: unknown) => void;
}

/**
 * Opens and saves through `Gtk.FileDialog` and `Gio.File`, which GNOME answers natively, the browser with
 * its file pickers and Android with the Storage Access Framework.
 */
export class FileService extends BaseFileService {
  private currentFile: Gio.File | null = null;

  constructor(private readonly options: FileServiceOptions = {}) {
    super();
  }

  public async openFile(): Promise<{ content: string; filename: string } | null> {
    try {
      const file = await this.createDialog(_("Open Assembly File")).open(this.options.parent?.() ?? null, null);
      const [contents] = await file.load_contents_async(null);
      this.currentFile = file;
      this.currentFileName = file.get_basename() || null;
      return { content: new TextDecoder().decode(contents), filename: this.getCurrentFileName() };
    } catch (error) {
      if (!isDismissed(error)) this.fail(_("Failed to open file"), error);
      return null;
    }
  }

  public async saveFileAs(content: string, suggestedName?: string): Promise<boolean> {
    try {
      const dialog = this.createDialog(_("Save Assembly File"), suggestedName || this.getCurrentFileName());
      const file = await dialog.save(this.options.parent?.() ?? null, null);
      if (!(await this.write(file, content))) return false;
      this.currentFile = file;
      this.currentFileName = file.get_basename() || null;
      this.setUnsavedChanges(false);
      return true;
    } catch (error) {
      if (!isDismissed(error)) this.fail(_("Failed to save file"), error);
      return false;
    }
  }

  protected async saveToCurrentFile(content: string): Promise<boolean> {
    return this.currentFile ? this.write(this.currentFile, content) : false;
  }

  public hasCurrentFile(): boolean {
    return this.currentFile !== null;
  }

  public getCurrentFile(): Gio.File | null {
    return this.currentFile;
  }

  private async write(file: Gio.File, content: string): Promise<boolean> {
    try {
      const stream = await file.replace_async(null, false, Gio.FileCreateFlags.NONE, GLib.PRIORITY_DEFAULT, null);
      await stream.write_bytes_async(new GLib.Bytes(new TextEncoder().encode(content)), GLib.PRIORITY_DEFAULT, null);
      await stream.close_async(GLib.PRIORITY_DEFAULT, null);
      return true;
    } catch (error) {
      this.fail(_("Failed to save file"), error);
      return false;
    }
  }

  private fail(message: string, error: unknown): void {
    (this.options.onError ?? ((m, e) => console.error(m, e)))(message, error);
  }

  private createDialog(title: string, initialName?: string): Gtk.FileDialog {
    const filters = new Gio.ListStore({ item_type: Gtk.FileFilter.$gtype });

    const asmFilter = Gtk.FileFilter.new();
    // TRANSLATORS: File filter name for assembly source files
    asmFilter.set_name(_("Assembly Files"));
    asmFilter.add_pattern("*.asm");
    asmFilter.add_pattern("*.s");

    const allFilter = Gtk.FileFilter.new();
    // TRANSLATORS: File filter name for all file types
    allFilter.set_name(_("All Files"));
    allFilter.add_pattern("*");

    filters.append(asmFilter);
    filters.append(allFilter);

    return new Gtk.FileDialog({ title, modal: true, filters, ...(initialName ? { initial_name: initialName } : {}) });
  }
}

function isDismissed(error: unknown): boolean {
  return error instanceof GLib.Error && error.matches(Gtk.DialogError, Gtk.DialogError.DISMISSED);
}
