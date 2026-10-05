import type { View } from "@nativescript/core";
import { ContentView, Property, Builder, booleanConverter } from "@nativescript/core";
import { EventDispatcher } from "@learn6502/core";
import type { SourceViewEventMap, SourceViewWidget } from "@learn6502/common-ui";
import { GtkSource } from "@gjsify/gtksource-nativescript";
import { registerGtkSourceData } from "~/services/gtksource-setup";
import { logger } from "~/utils";

export class SourceView extends ContentView implements SourceViewWidget {
  // Static properties
  public static codeProperty = new Property<SourceView, string>({
    name: "code",
    defaultValue: "",
    affectsLayout: true,
    valueChanged(target, oldValue, newValue) {
      if (target.sourceView && target.sourceView.buffer.text !== newValue) {
        target.sourceView.buffer.text = newValue;
      }
      // Store the code value for later use when the GtkSource.View is loaded
      target._pendingCode = newValue;
    },
  });

  public static lineNumbersProperty = new Property<SourceView, boolean>({
    name: "lineNumbers",
    defaultValue: true,
    affectsLayout: true,
    valueConverter: booleanConverter,
    valueChanged(target, oldValue, newValue) {
      target._lineNumbers = newValue;
    },
  });

  public static editableProperty = new Property<SourceView, boolean>({
    name: "editable",
    defaultValue: true,
    valueConverter: booleanConverter,
    valueChanged(target, oldValue, newValue) {
      target._editable = newValue;
      if (target.sourceView) target.sourceView.editable = newValue;
    },
  });

  public static lineNumberStartProperty = new Property<SourceView, number>({
    name: "lineNumberStart",
    defaultValue: 1,
    valueConverter: (v) => parseInt(v, 10),
    valueChanged(target, oldValue, newValue) {
      // GtkSource.View numbers from 1; kept only so the widget contract holds.
      target._lineNumberStart = newValue;
    },
  });

  public static selectableProperty = new Property<SourceView, boolean>({
    name: "selectable",
    defaultValue: true,
    valueConverter: booleanConverter,
    valueChanged(target, oldValue, newValue) {
      target._selectable = newValue;
      target.applySelectable();
    },
  });

  public static copyableProperty = new Property<SourceView, boolean>({
    name: "copyable",
    defaultValue: false,
    valueConverter: booleanConverter,
    valueChanged(target, oldValue, newValue) {
      target._copyable = newValue;
    },
  });

  public static copyButtonIconProperty = new Property<SourceView, string>({
    name: "copyButtonIcon",
    defaultValue: "",
    valueChanged(target, oldValue, newValue) {
      target._copyButtonIcon = newValue;
    },
  });

  public static copyButtonTooltipProperty = new Property<SourceView, string>({
    name: "copyButtonTooltip",
    defaultValue: "",
    valueChanged(target, oldValue, newValue) {
      target._copyButtonTooltip = newValue;
      if (target.copyButton) {
        target.copyButton.accessibilityLabel = newValue;
      }
    },
  });

  // Instance properties - public
  readonly events: EventDispatcher<SourceViewEventMap> = new EventDispatcher<SourceViewEventMap>();

  // Instance properties - private
  private sourceView!: InstanceType<typeof GtkSource.View>;
  private bufferHandler: number | null = null;
  private copyButton!: View;
  private _editable: boolean = true;
  private _lineNumbers: boolean = true;
  private _lineNumberStart: number = 1;
  private _selectable: boolean = true;
  private _copyable: boolean = false;
  private _copyButtonIcon: string = "";
  private _copyButtonTooltip: string = "";
  private _pendingCode: string = "";

  // Constructor
  constructor() {
    super();
  }

  // Instance methods - public
  //
  // NOTE — `code` has NO accessor here on purpose. `codeProperty.register(SourceView)`
  // (bottom of this file) defines `code` on the prototype itself, so a `get code()` /
  // `set code()` written in the class body is overwritten before any instance exists.
  // A pair of them lived here and looked authoritative; reads went to NativeScript's
  // property store instead, which is why the editor's text never reached the
  // assembler. Reading and writing both go through the property now: the widget
  // pushes with `nativeValueChange` (see `textChange`), and `valueChanged` writes
  // the other way.
  /** Defined on the prototype by `codeProperty.register()`; declared so TypeScript sees it. */
  declare code: string;

  /**
   * Get whether the source view has code
   */
  get hasCode(): boolean {
    return this.code.trim().length > 0;
  }

  get lineNumbers(): boolean {
    return this._lineNumbers;
  }

  set lineNumbers(value: boolean) {
    if (this._lineNumbers === value) return;
    this._lineNumbers = value;
    this.notifyPropertyChange("lineNumbers", value);
  }

  /**
   * Set the no line numbers property of the source view
   */
  get noLineNumbers(): boolean {
    return !this.lineNumbers;
  }

  /**
   * Get the no line numbers property of the source view
   */
  set noLineNumbers(value: boolean) {
    this.lineNumbers = !value;
  }

  get editable(): boolean {
    return this._editable;
  }

  set editable(value: boolean) {
    if (this._editable === value) return;
    this._editable = value;
    if (this.sourceView) this.sourceView.editable = value;
    this.notifyPropertyChange("editable", value);
  }

  get readonly(): boolean {
    return !this.editable;
  }

  set readonly(value: boolean) {
    this.editable = !value;
  }

  get lineNumberStart(): number {
    return this._lineNumberStart;
  }

  set lineNumberStart(value: number) {
    if (this._lineNumberStart === value) return;
    // GtkSource.View always numbers from 1; kept so the widget contract holds.
    this._lineNumberStart = value;
    this.notifyPropertyChange("lineNumberStart", value);
  }

  get selectable(): boolean {
    return this._selectable;
  }

  set selectable(value: boolean) {
    if (this._selectable === value) return;
    this._selectable = value;
    this.applySelectable();
    this.notifyPropertyChange("selectable", value);
  }

  /**
   * Set the unselectable property of the source view
   */
  get unselectable(): boolean {
    return !this.selectable;
  }

  /**
   * Get the unselectable property of the source view
   */
  set unselectable(value: boolean) {
    this.selectable = !value;
  }

  get copyable(): boolean {
    return this._copyable;
  }

  set copyable(value: boolean) {
    if (this._copyable === value) return;
    this._copyable = value;
    // Visibility is handled by template binding: visibility="{{ copyable ? 'visible' : 'collapsed' }}"
    this.notifyPropertyChange("copyable", value);
  }

  get copyButtonIcon(): string {
    return this._copyButtonIcon;
  }

  set copyButtonIcon(value: string) {
    if (this._copyButtonIcon === value) return;
    this._copyButtonIcon = value;
    this.notifyPropertyChange("copyButtonIcon", value);
  }

  get copyButtonTooltip(): string {
    return this._copyButtonTooltip;
  }

  set copyButtonTooltip(value: string) {
    if (this._copyButtonTooltip === value) return;
    this._copyButtonTooltip = value;
    if (this.copyButton) {
      this.copyButton.accessibilityLabel = value;
    }
    this.notifyPropertyChange("copyButtonTooltip", value);
  }

  focus(): boolean {
    return this.sourceView ? this.sourceView.focus() : false;
  }

  onLoaded() {
    super.onLoaded();

    registerGtkSourceData();
    const componentView = Builder.load({
      path: "~/widgets",
      name: "source-view",
    });

    this.sourceView = componentView.getViewById<InstanceType<typeof GtkSource.View>>("sourceView");
    this.copyButton = componentView.getViewById<View>("copyButton");

    if (!this.sourceView) {
      throw new Error("Failed to find sourceView in source-view.xml");
    }

    const buffer = this.sourceView.buffer;
    buffer.language = GtkSource.LanguageManager.getDefault().getLanguage("6502-assembler");
    buffer.styleScheme = GtkSource.StyleSchemeManager.getDefault().getScheme("Learn6502");
    this.sourceView.editable = this.editable;

    if (this.copyButton) {
      if (this.copyButtonTooltip) {
        this.copyButton.accessibilityLabel = this.copyButtonTooltip;
      }
      // Visibility is handled by template binding: visibility="{{ copyable ? 'visible' : 'collapsed' }}"
      this.copyButton.on("tap", () => {
        this.events.dispatch("copy", { code: this.code });
      });
    } else {
      logger.warn("SourceView", "copyButton not found in source-view.xml");
    }

    // The typed text goes back into the `code` property: `codeProperty.register()` below
    // replaces any accessor written in the class body, so without `nativeValueChange`
    // nothing would ever read what the user wrote (the assembler got an empty program).
    // `nativeValueChange` skips `valueChanged`'s write-back into the widget the value came from.
    this.bufferHandler = buffer.connect("changed", () => {
      const newText = buffer.text;
      SourceView.codeProperty.nativeValueChange(this, newText);
      this.events.dispatch("changed", { code: newText });
    });

    // The `{{ lineNumbers }}` / `{{ copyable }}` bindings in source-view.xml read from this widget.
    componentView.bindingContext = this;
    this.content = componentView;

    // Apply code that was set before the view was loaded
    if (this._pendingCode && buffer.text !== this._pendingCode) {
      buffer.text = this._pendingCode;
    }

    this.applySelectable();
  }

  onUnloaded() {
    if (this.sourceView && this.bufferHandler !== null) {
      this.sourceView.buffer.disconnect(this.bufferHandler);
    }
    this.bufferHandler = null;
    super.onUnloaded();
  }

  // Instance methods - private
  private applySelectable() {
    const nativeEditText = this.sourceView?.android as android.widget.EditText | undefined;
    if (!nativeEditText) return;
    nativeEditText.setTextIsSelectable(this._selectable);
    nativeEditText.setCursorVisible(this._selectable);
    nativeEditText.setFocusable(this._selectable);
    nativeEditText.setFocusableInTouchMode(this._selectable);
  }
}

SourceView.codeProperty.register(SourceView);
SourceView.lineNumbersProperty.register(SourceView);
SourceView.editableProperty.register(SourceView);
SourceView.lineNumberStartProperty.register(SourceView);
SourceView.selectableProperty.register(SourceView);
SourceView.copyableProperty.register(SourceView);
SourceView.copyButtonIconProperty.register(SourceView);
SourceView.copyButtonTooltipProperty.register(SourceView);
