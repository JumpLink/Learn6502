import GObject from '@girs/gobject-2.0'
import Gio from '@girs/gio-2.0'
import Gdk from '@girs/gdk-4.0'
import Gtk from '@girs/gtk-4.0'
import Adw from '@girs/adw-1'
import GLib from '@girs/glib-2.0'

import { ApplicationWindow } from './application-window.ts'
import { PreferencesDialog } from './preferences-dialog.ts'
import { APPLICATION_ID, RESOURCES_PATH } from '../constants.ts'
import { initResources } from '../resources.ts'

import applicationStyle from './application.css?inline'
import Template from './application.blp'

export class Application extends Adw.Application {
  // File actions
  private openFileAction = new Gio.SimpleAction({ name: 'open-file' });
  private saveFileAction = new Gio.SimpleAction({ name: 'save-file' });
  private saveAsFileAction = new Gio.SimpleAction({ name: 'save-as-file' });

  // Template widgets
  declare private _unsavedChangesDialog: Adw.AlertDialog;

  private currentFile: Gio.File | null = null

  static {
    GObject.registerClass({
      GTypeName: 'Application',
      Template,
      InternalChildren: ['unsavedChangesDialog'],
    }, this)
  }

  constructor() {
    super({
      applicationId: APPLICATION_ID,
      flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
    })
    this.onStartup = this.onStartup.bind(this)
    this.connect('startup', this.onStartup)
    this.initActions()
  }

  protected onStartup(): void {
    this.initStyles()
    initResources()
  }

  /** Load the stylesheet in a CssProvider and add it to the Gtk.StyleContext */
  protected initStyles() {
    const provider = new Gtk.CssProvider();
    provider.load_from_string(applicationStyle);
    const display = Gdk.Display.get_default()

    if (!display) {
      console.error('No display found')
      return
    }

    Gtk.StyleContext.add_provider_for_display(
      display,
      provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );
  }

  initActions() {
    // Quit action
    const quitAction = new Gio.SimpleAction({ name: 'quit' })
    quitAction.connect('activate', (_action) => {
      log('quitAction activated')
      this.quit()
    })
    this.add_action(quitAction)
    this.set_accels_for_action('app.quit', ['<primary>q'])

    // About action
    const showAboutAction = new Gio.SimpleAction({ name: 'about' })
    showAboutAction.connect('activate', this.onShowAboutDialog.bind(this))
    this.add_action(showAboutAction)

    const showPreferencesAction = new Gio.SimpleAction({ name: 'preferences' })
    showPreferencesAction.connect('activate', (_action) => {
      const preferencesDialog = new PreferencesDialog()
      preferencesDialog.present(this.active_window)
    })
    this.add_action(showPreferencesAction)

    // Initialize file actions
    this.initFileActions();
  }

  private initFileActions(): void {
    // Open file action
    this.openFileAction.connect('activate', this.handleOpenFile.bind(this));
    this.add_action(this.openFileAction);

    // Save file action
    this.saveFileAction.connect('activate', this.handleSaveFile.bind(this));
    this.add_action(this.saveFileAction);

    // Save as file action
    this.saveAsFileAction.connect('activate', this.handleSaveAsFile.bind(this));
    this.add_action(this.saveAsFileAction);

    // Set keyboard shortcuts
    this.set_accels_for_action(`app.${this.openFileAction.get_name()}`, ['<Control>o']);
    this.set_accels_for_action(`app.${this.saveFileAction.get_name()}`, ['<Control>s']);
    this.set_accels_for_action(`app.${this.saveAsFileAction.get_name()}`, ['<Control><Shift>s']);
  }

  private getActiveWindow(): ApplicationWindow | null {
    return this.get_active_window() as ApplicationWindow | null;
  }

  private handleOpenFile(): void {
    const window = this.getActiveWindow();
    if (window) {
      this.openFile(window);
    }
  }

  private handleSaveFile(): void {
    const window = this.getActiveWindow();
    if (window) {
      this.saveFile(window);
    }
  }

  private handleSaveAsFile(): void {
    const window = this.getActiveWindow();
    if (window) {
      this.saveAsFile(window);
    }
  }

  /**
   * Get the current file name
   */
  public getCurrentFile(): Gio.File | null {
    return this.currentFile;
  }

  /**
   * Get the current file name
   */
  public getCurrentFileName(): string {
    if (!this.currentFile) return _("untitled") + ".asm";
    return this.currentFile.get_basename() || _("untitled") + ".asm";
  }

  /**
   * Open a file in the given window
   */
  public async openFile(window: ApplicationWindow): Promise<void> {
    // Check for unsaved changes first
    if (window.hasUnsavedChanges()) {
      this.showUnsavedChangesDialogForOpen(window);
      return;
    }

    await this.openFileImpl(window);
  }

  /**
   * Implementation of the file open operation
   */
  private async openFileImpl(window: ApplicationWindow): Promise<void> {
    try {
      const file = await this.openFileDialog(window, _('Open Assembly File'));
      if (!file) return;

      const fileContent = await this.loadContentFromFile(file);
      if (!fileContent) {
        this.showToast(window, {
          title: _("Failed to load file"),
          timeout: 3
        });
        return;
      }

      // Update window with file contents
      window.setEditorContent(fileContent);
      this.currentFile = file;
      window.resetCodeChanged();
      window.clearUnsavedChanges();
      window.showEditorView();

      this.showToast(window, {
        title: _("File loaded successfully"),
        timeout: 3
      });
    } catch (error) {
      console.error("Error opening file:", error);
      this.showToast(window, {
        title: _("Error opening file"),
        timeout: 3
      });
    }
  }

  /**
   * Save the current file
   */
  public async saveFile(window: ApplicationWindow): Promise<boolean> {
    const currentFile = this.currentFile;

    window.clearUnsavedChanges();

    if (currentFile) {
      return this.saveToFile(window, currentFile);
    } else {
      return this.saveAsFile(window);
    }
  }

  /**
   * Save the current file with a new name
   */
  public async saveAsFile(window: ApplicationWindow): Promise<boolean> {
    try {
      const file = await this.saveFileDialog(window, _('Save Assembly File'), this.getCurrentFileName());
      if (!file) return false;

      return this.saveToFile(window, file);
    } catch (error) {
      console.error("Error in save as:", error);
      this.showToast(window, {
        title: _("Error saving file"),
        timeout: 3
      });
      return false;
    }
  }

  /**
   * Save content to a specific file
   */
  private async saveToFile(window: ApplicationWindow, file: Gio.File): Promise<boolean> {
    try {
      const content = window.getEditorContent();
      const success = await this.saveContentToFile(file, content);

      if (success) {
        this.currentFile = file;
        window.clearUnsavedChanges();

        this.showToast(window, {
          title: _("File saved successfully"),
          timeout: 3
        });
      }
      return success;
    } catch (error) {
      console.error("Error saving file:", error);
      this.showToast(window, {
        title: _("Error saving file"),
        timeout: 3
      });
      return false;
    }
  }

  /**
   * Shows a toast notification in the specified window
   */
  public showToast(window: ApplicationWindow, params: Partial<Adw.Toast.ConstructorProps>): void {
    window.showToast(params);
  }

  /**
   * Shows the dialog for unsaved changes when opening a file
   */
  private showUnsavedChangesDialogForOpen(window: ApplicationWindow): void {
    this.showUnsavedChangesDialog(window, 'open', (response) => {
      this.handleUnsavedChangesResponse(window, 'open', response);
    });
  }

  /**
   * Shows the dialog for unsaved changes when closing a window
   */
  public showUnsavedChangesDialogForClose(window: ApplicationWindow): void {
    this.showUnsavedChangesDialog(window, 'close', (response) => {
      this.handleUnsavedChangesResponse(window, 'close', response);
    });
  }

  /**
   * Shows the unsaved changes dialog with the appropriate callback
   */
  private showUnsavedChangesDialog(parent: Gtk.Window, action: 'open' | 'close', callback: (response: string) => void): void {
    // Store the handler ID so we can disconnect it later
    const handlerId = this._unsavedChangesDialog.connect('response', (_dialog, response) => {
      // Disconnect the handler after it fires once
      this._unsavedChangesDialog.disconnect(handlerId);
      callback(response);
    });

    this._unsavedChangesDialog.present(parent);
  }

  /**
   * Handles the response from the unsaved changes dialog
   */
  private handleUnsavedChangesResponse(window: ApplicationWindow, action: 'open' | 'close', response: string): void {
    switch (response) {
      case 'save':
        // Save and then continue with the action
        this.saveFile(window).then(success => {
          if (success) {
            if (action === 'open') {
              this.openFileImpl(window);
            } else if (action === 'close') {
              window.closeForReal();
            }
          }
        });
        break;

      case 'discard':
        // Discard changes and continue
        window.clearUnsavedChanges();
        if (action === 'open') {
          this.openFileImpl(window);
        } else if (action === 'close') {
          window.closeForReal();
        }
        break;

      case 'cancel':
      default:
        // Do nothing
        break;
    }
  }

  /**
   * Creates file filters for file dialogs
   */
  public createFileFilters(): Gio.ListStore {
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
   * Opens a file dialog and returns the selected file
   */
  public async openFileDialog(parent: Gtk.Window, title: string): Promise<Gio.File | null> {
    try {
      const fileDialog = new Gtk.FileDialog({
        title: title,
        modal: true,
        filters: this.createFileFilters()
      });

      return await fileDialog.open(parent, null);
    } catch (error) {
      console.error("Error opening file dialog:", error);
      return null;
    }
  }

  /**
   * Opens a save dialog and returns the selected file
   */
  public async saveFileDialog(parent: Gtk.Window, title: string, initialName: string): Promise<Gio.File | null> {
    try {
      const fileDialog = new Gtk.FileDialog({
        title: title,
        modal: true,
        filters: this.createFileFilters(),
        initial_name: initialName
      });

      return await fileDialog.save(parent, null);
    } catch (error) {
      console.error("Error in save dialog:", error);
      return null;
    }
  }

  /**
   * Saves content to a file
   */
  public async saveContentToFile(file: Gio.File, content: string): Promise<boolean> {
    try {
      // Create a file output stream
      const stream = await file.replace_async(
        null,
        false,
        Gio.FileCreateFlags.NONE,
        GLib.PRIORITY_DEFAULT,
        null
      );

      // Convert string to bytes
      const bytes = new TextEncoder().encode(content);

      // Write the content
      await stream.write_bytes_async(new GLib.Bytes(bytes), GLib.PRIORITY_DEFAULT, null);
      await stream.close_async(GLib.PRIORITY_DEFAULT, null);

      return true;
    } catch (error) {
      console.error("Error saving file:", error);
      return false;
    }
  }

  /**
   * Loads content from a file
   */
  public async loadContentFromFile(file: Gio.File): Promise<string | null> {
    try {
      const [contents] = await file.load_contents_async(null);
      if (!contents) {
        return null;
      }
      return new TextDecoder().decode(contents);
    } catch (error) {
      console.error("Error loading file:", error);
      return null;
    }
  }

  private onShowAboutDialog() {
    const aboutDialog = Adw.AboutDialog.new_from_appdata(`${RESOURCES_PATH}/metainfo/${pkg.name}.metainfo.xml`, pkg.version)
    aboutDialog.present(this.get_active_window());
  }

  vfunc_activate() {
    let { active_window } = this

    if (!active_window) active_window = new ApplicationWindow(this)

    active_window.present()
  }
}
