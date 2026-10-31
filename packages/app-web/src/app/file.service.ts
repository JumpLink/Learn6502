import { Gio, Gtk } from "@gjsify/adwaita-web";
import { FileService as BaseFileService } from "@learn6502/common-ui";
import { _ } from "@learn6502/ui";

/** What the web door's `Gtk.FileDialog` and `Gio.File` give back; their typings still list the callback forms. */
interface PickedFile {
  get_basename(): string;
  load_contents_async(cancellable: null): Promise<[Uint8Array, string | null]>;
  replace_contents_async(
    contents: Uint8Array,
    etag: null,
    makeBackup: boolean,
    flags: number,
    cancellable: null
  ): Promise<[boolean, string | null]>;
}

interface PromisedFileDialog {
  open(parent: null, cancellable: null): Promise<PickedFile>;
  save(parent: null, cancellable: null): Promise<PickedFile>;
}

/**
 * Opens and saves through `Gtk.FileDialog`, which the browser answers with the system file pickers where
 * it has them and with an in-page dialog over the origin's private storage where it does not.
 */
export class FileService extends BaseFileService {
  private currentFile: PickedFile | null = null;

  public async openFile(): Promise<{ content: string; filename: string } | null> {
    try {
      const file = await this.createDialog(_("Open Assembly File")).open(null, null);
      const [contents] = await file.load_contents_async(null);
      this.currentFile = file;
      this.currentFileName = file.get_basename();
      return { content: new TextDecoder().decode(contents), filename: this.currentFileName };
    } catch (error) {
      // Dismissing the dialog is a refusal, not a failure worth reporting
      if (!isDismissed(error)) console.error("Error opening file:", error);
      return null;
    }
  }

  public async saveFileAs(content: string, suggestedName?: string): Promise<boolean> {
    try {
      const file = await this.createDialog(_("Save Assembly File"), suggestedName).save(null, null);
      if (!(await this.write(file, content))) return false;
      this.currentFile = file;
      this.currentFileName = file.get_basename();
      this.setUnsavedChanges(false);
      return true;
    } catch (error) {
      if (!isDismissed(error)) console.error("Error in save as:", error);
      return false;
    }
  }

  protected async saveToCurrentFile(content: string): Promise<boolean> {
    return this.currentFile ? this.write(this.currentFile, content) : false;
  }

  public hasCurrentFile(): boolean {
    return this.currentFile !== null;
  }

  private async write(file: PickedFile, content: string): Promise<boolean> {
    try {
      const [ok] = await file.replace_contents_async(new TextEncoder().encode(content), null, false, 0, null);
      return ok;
    } catch (error) {
      console.error("Error saving file:", error);
      return false;
    }
  }

  private createDialog(title: string, initialName?: string): PromisedFileDialog {
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

    const dialog = new Gtk.FileDialog({
      title,
      modal: true,
      filters,
      initial_name: initialName || this.getCurrentFileName(),
    });
    // The typings keep GIR's callback signatures; the web door promisifies them.
    return dialog as unknown as PromisedFileDialog;
  }
}

function isDismissed(error: unknown): boolean {
  return (
    (error as { matches?: (domain: unknown, code: number) => boolean }).matches?.(
      Gtk.DialogError,
      Gtk.DialogError.DISMISSED
    ) === true
  );
}
