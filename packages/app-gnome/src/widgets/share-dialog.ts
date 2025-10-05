import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import type {
  ExampleMeta,
  ExampleMetaJson,
} from "@learn6502/examples/example-meta";
import { DisplayAddressRange, Memory } from "@learn6502/6502";
import { ExampleListItem } from "./example-list-item.ts";

import Template from "./share-dialog.blp";

export class ShareDialog extends Adw.Dialog {
  declare private _carousel: Adw.Carousel;
  declare private _backButton: Gtk.Button;
  declare private _nextButton: Gtk.Button;
  declare private _titleEntry: Adw.EntryRow;
  declare private _authorEntry: Adw.EntryRow;
  declare private _descriptionEntry: Adw.EntryRow;
  declare private _sourceUrlEntry: Adw.EntryRow;
  declare private _examplePreview: ExampleListItem;
  declare private _cancelButton: Gtk.Button;
  declare private _submitButton: Gtk.Button;
  declare private _closeButton: Gtk.Button;

  private _code: string = "";
  private _memory: Memory | null = null;
  private _currentPage: number = 0;

  static {
    GObject.registerClass(
      {
        GTypeName: "ShareDialog",
        Template,
        InternalChildren: [
          "carousel",
          "backButton",
          "nextButton",
          "titleEntry",
          "authorEntry",
          "descriptionEntry",
          "sourceUrlEntry",
          "examplePreview",
          "cancelButton",
          "submitButton",
          "closeButton",
        ],
        Signals: {
          submit: {
            param_types: [GObject.TYPE_JSOBJECT],
          },
        },
      },
      this
    );
  }

  constructor(params?: Partial<Adw.Dialog.ConstructorProps>) {
    super(params);
    this.setupSignalListeners();
    this.updateButtonVisibility();
  }

  private setupSignalListeners(): void {
    // Navigation buttons
    this._backButton.connect("clicked", () => {
      this.navigateToPage(this._currentPage - 1);
    });

    this._nextButton.connect("clicked", () => {
      if (this._currentPage === 0) {
        if (this.validateForm()) {
          this.updatePreview();
          this.navigateToPage(1);
        }
      }
    });

    // Carousel page changes
    this._carousel.connect("notify::position", () => {
      const position = this._carousel.get_position();
      this._currentPage = Math.round(position);
      this.updateButtonVisibility();
    });

    // Form entries
    this._titleEntry.connect("notify::text", () => {
      this.validateForm();
    });

    this._authorEntry.connect("notify::text", () => {
      this.validateForm();
    });

    this._descriptionEntry.connect("notify::text", () => {
      this.validateForm();
    });

    // Preview page buttons
    this._cancelButton.connect("clicked", () => {
      this.close();
    });

    this._submitButton.connect("clicked", () => {
      this.handleSubmit();
    });

    // Completion page button
    this._closeButton.connect("clicked", () => {
      this.close();
    });
  }

  /**
   * Set the code to be shared
   */
  public setCode(code: string): void {
    this._code = code;
  }

  /**
   * Set the memory to generate display snapshot
   */
  public setMemory(memory: Memory): void {
    this._memory = memory;
  }

  /**
   * Navigate to a specific page
   */
  private navigateToPage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= 3) {
      return;
    }

    this._currentPage = pageIndex;
    this._carousel.scroll_to(
      this._carousel.get_nth_page(pageIndex),
      true // animate
    );
  }

  /**
   * Update button visibility based on current page
   */
  private updateButtonVisibility(): void {
    switch (this._currentPage) {
      case 0: // Form page
        this._backButton.visible = false;
        this._nextButton.visible = true;
        this._nextButton.sensitive = this.validateForm();
        break;
      case 1: // Preview page
        this._backButton.visible = true;
        this._nextButton.visible = false;
        break;
      case 2: // Completion page
        this._backButton.visible = false;
        this._nextButton.visible = false;
        break;
    }
  }

  /**
   * Validate the form entries
   * @returns true if form is valid
   */
  private validateForm(): boolean {
    const title = this._titleEntry.get_text().trim();
    const author = this._authorEntry.get_text().trim();
    const description = this._descriptionEntry.get_text().trim();

    const isValid =
      title.length > 0 && author.length > 0 && description.length > 0;

    // Update next button sensitivity
    this._nextButton.sensitive = isValid;

    return isValid;
  }

  /**
   * Generate a slug from the title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Generate display memory hex string
   */
  private generateDisplayMemory(): string {
    if (!this._memory) {
      return "";
    }

    let hexString = "";
    for (
      let addr = DisplayAddressRange.START;
      addr <= DisplayAddressRange.END;
      addr++
    ) {
      const value = this._memory.get(addr);
      hexString += value.toString(16).padStart(2, "0");
    }
    return hexString;
  }

  /**
   * Build the example metadata
   */
  private buildExampleMeta(): ExampleMeta {
    const title = this._titleEntry.get_text().trim();
    const author = this._authorEntry.get_text().trim();
    const description = this._descriptionEntry.get_text().trim();
    const sourceUrl = this._sourceUrlEntry.get_text().trim();

    const meta: ExampleMeta = {
      slug: this.generateSlug(title),
      title,
      description,
      author,
      displayMemory: this.generateDisplayMemory(),
      code: this._code,
    };

    if (sourceUrl) {
      meta.sourceUrl = sourceUrl;
    }

    return meta;
  }

  /**
   * Update the preview with current form data
   */
  private updatePreview(): void {
    const example = this.buildExampleMeta();
    this._examplePreview.setExample(example);
  }

  /**
   * Handle form submission
   */
  private handleSubmit(): void {
    const example = this.buildExampleMeta();

    // Emit submit signal with the example data
    this.emit("submit", example);

    // Navigate to completion page
    this.navigateToPage(2);
  }
}

GObject.type_ensure(ShareDialog.$gtype);
