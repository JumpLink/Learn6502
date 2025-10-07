import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";
import GLib from "@girs/glib-2.0";

import type {
  ExampleMeta,
  ExampleMetaJson,
} from "@learn6502/examples/example-meta";
import { DisplayAddressRange, Memory } from "@learn6502/6502";
import { ExampleListItem } from "./example-list-item.ts";
import { copyToClipboard } from "../utils.ts";

import Template from "./share-dialog.blp";

// GitHub repository configuration
const GITHUB_OWNER = "JumpLink";
const GITHUB_REPO = "Learn6502";

export class ShareDialog extends Adw.Dialog {
  declare private _carousel: Adw.Carousel;
  declare private _backButton: Gtk.Button;
  declare private _nextButton: Gtk.Button;
  declare private _titleEntry: Adw.EntryRow;
  declare private _authorEntry: Adw.EntryRow;
  declare private _descriptionEntry: Adw.EntryRow;
  declare private _sourceUrlEntry: Adw.EntryRow;
  declare private _examplePreview: ExampleListItem;
  declare private _submitButton: Gtk.Button;
  declare private _copyToClipboardButton: Gtk.Button;
  declare private _closeButton: Gtk.Button;

  private _code: string = "";
  private _memory: Memory | null = null;
  private _currentPage: number = 0;
  private _issueBody: string = "";

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
          "submitButton",
          "copyToClipboardButton",
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

    this._submitButton.connect("clicked", () => {
      this.handleSubmit();
    });

    // Completion page buttons
    this._copyToClipboardButton.connect("clicked", () => {
      this.handleCopyToClipboard();
    });

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
        this._backButton.visible = true;
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
   * URL-encode a string
   */
  private encodeURIComponent(str: string): string {
    return GLib.uri_escape_string(str, null, false);
  }

  /**
   * Build the issue body content
   */
  private buildIssueBody(payload: {
    slug: string;
    title: string;
    description: string;
    author: string;
    sourceUrl?: string;
    code: string;
    displayMemory: string;
  }): string {
    // Build metadata JSON without code (code will be in separate block)
    const metadata = {
      slug: payload.slug,
      title: payload.title,
      description: payload.description,
      author: payload.author,
      ...(payload.sourceUrl && { sourceUrl: payload.sourceUrl }),
      displayMemory: payload.displayMemory,
    };
    const metadataJson = JSON.stringify(metadata, null, 2);

    return [
      "Please do not edit below this line.",
      "",
      "## Metadata",
      "```json",
      metadataJson,
      "```",
      "",
      "## Code",
      "```assembly",
      payload.code,
      "```",
      "",
      "_Submitted via Learn6502 app_",
    ].join("\n");
  }

  /**
   * Build GitHub issue URL with prefilled data
   * Returns both the URL and a flag indicating if it's too long
   */
  private buildGitHubIssueURL(payload: {
    slug: string;
    title: string;
    description: string;
    author: string;
    sourceUrl?: string;
    code: string;
    displayMemory: string;
  }): { url: string; isTooLong: boolean; body: string } {
    const title = `[example] ${payload.slug}`;
    const body = this.buildIssueBody(payload);

    // Build URL with query parameters manually
    const baseUrl = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/new`;
    const encodedTitle = this.encodeURIComponent(title);
    const encodedBody = this.encodeURIComponent(body);

    const fullUrl = `${baseUrl}?title=${encodedTitle}&body=${encodedBody}`;

    // GitHub's URL limit is around 8000 characters, we use 7000 as safe threshold
    const isTooLong = fullUrl.length > 7000;

    // If too long, create URL with help message in body
    let url: string;
    if (isTooLong) {
      const helpMessage =
        "Your example is too large to insert automatically. The complete issue content has been automatically copied to your clipboard. Please paste it to replace this message, then submit the issue.";
      const encodedHelpBody = this.encodeURIComponent(helpMessage);
      url = `${baseUrl}?title=${encodedTitle}&body=${encodedHelpBody}`;
    } else {
      url = fullUrl;
    }

    return { url, isTooLong, body };
  }

  /**
   * Handle form submission
   */
  private handleSubmit(): void {
    const example = this.buildExampleMeta();

    // Build payload with code and display memory as plain strings
    const payload = {
      slug: example.slug,
      title: example.title,
      description: example.description,
      author: example.author,
      ...(example.sourceUrl && { sourceUrl: example.sourceUrl }),
      code: example.code,
      displayMemory: example.displayMemory,
    };

    // Build GitHub issue URL
    const result = this.buildGitHubIssueURL(payload);

    // Open URL in default browser
    // Get the parent window to use as context for URI opening
    const root = this.get_root();
    if (root && root instanceof Gtk.Window) {
      Gtk.show_uri(root, result.url, Gdk.CURRENT_TIME);
    }

    // If URL was too long, copy body to clipboard and show copy button
    if (result.isTooLong) {
      this._issueBody = result.body;
      copyToClipboard(result.body);
      console.log(
        `URL too long (${result.url.length} chars), body copied to clipboard`
      );
    }

    // Emit submit signal with the example data
    this.emit("submit", example);

    // Navigate to completion page
    this.navigateToPage(2);
  }

  private handleCopyToClipboard(): void {
    if (this._issueBody) {
      copyToClipboard(this._issueBody);
      console.log("Issue content copied to clipboard");
    }
  }
}

GObject.type_ensure(ShareDialog.$gtype);
