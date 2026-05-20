import { ContentView, Property, TextView, Builder, booleanConverter, Color, Button } from "@nativescript/core";
import { debounce, EventDispatcher } from "@learn6502/6502";
import type { SourceViewEventMap, SourceViewWidget } from "@learn6502/common-ui";
import { OPCODE_PATTERN, COMMENT_PATTERN, HEX_VALUE_PATTERN } from "@learn6502/common-ui";
import { logger } from "~/utils";

export class SourceView extends ContentView implements SourceViewWidget {
  // Static properties
  public static codeProperty = new Property<SourceView, string>({
    name: "code",
    defaultValue: "",
    affectsLayout: true,
    valueChanged(target, oldValue, newValue) {
      if (target.textView && target.textView.text !== newValue) {
        target.textView.text = newValue;
      }
      // Store the code value for later use when textView is loaded
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
      // Editable state is handled by template binding: editable="{{ editable }}"
      // But we still need to handle native Android-specific properties
      if (target.textView && target.textView.android) {
        const nativeEditText = target.textView.android as android.widget.EditText;
        nativeEditText.setEnabled(newValue);
      }
    },
  });

  public static lineNumberStartProperty = new Property<SourceView, number>({
    name: "lineNumberStart",
    defaultValue: 1,
    valueConverter: (v) => parseInt(v, 10),
    valueChanged(target, oldValue, newValue) {
      target._lineNumberStart = newValue;
      if (target.textView) {
        target.updateLineNumbers(target.textView.text);
      }
    },
  });

  public static selectableProperty = new Property<SourceView, boolean>({
    name: "selectable",
    defaultValue: true,
    valueConverter: booleanConverter,
    valueChanged(target, oldValue, newValue) {
      target._selectable = newValue;
      if (target.textView && target.textView.android) {
        const nativeEditText = target.textView.android as android.widget.EditText;
        nativeEditText.setTextIsSelectable(newValue);
        nativeEditText.setCursorVisible(newValue);
        nativeEditText.setFocusable(newValue);
        nativeEditText.setFocusableInTouchMode(newValue);
      }
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
  private debouncedHighlighting: (code: string) => void;
  private textView!: TextView;
  private lineNumbersView!: TextView;
  private copyButton!: Button;
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
    this.debouncedHighlighting = debounce((code: string) => {
      this.applyHighlighting(code);
    }, 150);
  }

  // Instance methods - public
  /**
   * Get the source code
   */
  get code(): string {
    return this.textView ? this.textView.text : this._pendingCode;
  }

  /**
   * Set the source code
   */
  set code(value: string) {
    if (this.code === value) return;

    this._pendingCode = value;
    if (this.textView && this.textView.text !== value) {
      this.textView.text = value;
    }
    this.notifyPropertyChange("code", value);
  }

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
    // Editable state is handled by template binding: editable="{{ editable }}"
    // But we still need to handle native Android-specific properties
    if (this.textView && this.textView.android) {
      const nativeEditText = this.textView.android as android.widget.EditText;
      nativeEditText.setEnabled(value);
    }
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
    this._lineNumberStart = value;
    if (this.textView) {
      this.updateLineNumbers(this.textView.text);
    }
    this.notifyPropertyChange("lineNumberStart", value);
  }

  get selectable(): boolean {
    return this._selectable;
  }

  set selectable(value: boolean) {
    if (this._selectable === value) return;
    this._selectable = value;
    if (this.textView && this.textView.android) {
      const nativeEditText = this.textView.android as android.widget.EditText;
      nativeEditText.setTextIsSelectable(value);
      nativeEditText.setCursorVisible(value);
      nativeEditText.setFocusable(value);
      nativeEditText.setFocusableInTouchMode(value);
    }
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
    if (this.textView) {
      return this.textView.focus();
    }
    return false;
  }

  onLoaded() {
    super.onLoaded();

    const componentView = Builder.load({
      path: "~/widgets",
      name: "source-view",
    });

    this.textView = componentView.getViewById<TextView>("textView");
    this.lineNumbersView = componentView.getViewById<TextView>("lineNumbersView");
    this.copyButton = componentView.getViewById<Button>("copyButton");

    if (!this.textView) {
      throw new Error("Failed to find textView in source-view.xml");
    }
    this.textView.color = new Color("white");
    this.textView.backgroundColor = new Color("transparent");

    if (this.textView.android) {
      const nativeEditText = this.textView.android as android.widget.EditText;
      // These native Android properties are not covered by template binding
      nativeEditText.setTextIsSelectable(this.selectable);
      nativeEditText.setCursorVisible(this.selectable);
      nativeEditText.setFocusable(this.selectable);
      nativeEditText.setFocusableInTouchMode(this.selectable);
      nativeEditText.setEnabled(this.editable);
    }

    if (!this.lineNumbersView) {
      throw new Error("Failed to find lineNumbersView in source-view.xml");
    }
    this.lineNumbersView.color = new Color("lightgray");
    this.lineNumbersView.backgroundColor = new Color("transparent");
    // Visibility is handled by template binding: visibility="{{ lineNumbers ? 'visible' : 'collapsed' }}"

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

    this.textView.on("textChange", (args: any) => {
      if (this.textView) {
        const newText = args.value as string;

        this.debouncedHighlighting(newText);
        this.updateLineNumbers(newText);
        this.events.dispatch("changed", { code: newText });
      }
    });

    this.content = componentView;

    // Apply pending code if it was set before textView was loaded
    if (this._pendingCode && this.textView.text !== this._pendingCode) {
      this.textView.text = this._pendingCode;
      this.debouncedHighlighting(this._pendingCode);
      this.updateLineNumbers(this._pendingCode);
    } else if (this.textView.text) {
      // Update line numbers for any existing text
      this.updateLineNumbers(this.textView.text);
    }

    const textEdit = this.textView.android as android.widget.EditText;
    if (textEdit) {
      textEdit.setOnScrollChangeListener(
        new android.view.View.OnScrollChangeListener({
          onScrollChange: (v, scrollX, scrollY, oldScrollX, oldScrollY) => {
            if (this.lineNumbersView && this.lineNumbersView.android) {
              const lineNumbersEdit = this.lineNumbersView.android as android.widget.EditText;
              lineNumbersEdit.scrollTo(0, scrollY);
            }
          },
        })
      );
    } else {
      logger.error(
        "SourceView",
        "textEdit (native) is null, couldn't set scroll listener. This may affect line number scrolling synchronization."
      );
    }

    // Apply current selectable state
    this.selectable = this._selectable;
  }

  // Instance methods - private
  private applyHighlighting(code: string) {
    if (this.textView?.android) {
      const nativeEditText = this.textView.android as android.widget.EditText;
      let selectionStart = 0;
      let selectionEnd = 0;
      if (nativeEditText.isFocused()) {
        selectionStart = Math.min(nativeEditText.getSelectionStart(), code.length);
        selectionEnd = Math.min(nativeEditText.getSelectionEnd(), code.length);
      }

      const spannable = new android.text.SpannableString(code);
      const commentPattern = /;.*/g;
      let match: RegExpExecArray | null;
      while ((match = commentPattern.exec(code)) !== null) {
        spannable.setSpan(
          new android.text.style.ForegroundColorSpan(android.graphics.Color.parseColor("#008000")),
          match.index,
          match.index + match[0].length,
          android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        );
      }

      const opcodePattern = new RegExp(OPCODE_PATTERN, "gi");
      while ((match = opcodePattern.exec(code)) !== null) {
        spannable.setSpan(
          new android.text.style.ForegroundColorSpan(android.graphics.Color.parseColor("#0000FF")),
          match.index,
          match.index + match[0].length,
          android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        );
        spannable.setSpan(
          new android.text.style.StyleSpan(android.graphics.Typeface.BOLD),
          match.index,
          match.index + match[0].length,
          android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        );
      }

      const hexPattern = new RegExp(HEX_VALUE_PATTERN, "gi");
      while ((match = hexPattern.exec(code)) !== null) {
        spannable.setSpan(
          new android.text.style.ForegroundColorSpan(android.graphics.Color.parseColor("#800080")),
          match.index,
          match.index + match[0].length,
          android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
        );
      }

      try {
        nativeEditText.setText(spannable as any);
        if (
          nativeEditText.isFocused() &&
          selectionStart >= 0 &&
          selectionEnd >= 0 &&
          selectionStart <= code.length &&
          selectionEnd <= code.length
        ) {
          nativeEditText.setSelection(selectionStart, selectionEnd);
        }
      } catch (error) {
        logger.error("SourceView", "Error applying text highlighting:", error);
      }
    }
  }

  private updateLineNumbers(code: string) {
    if (this.lineNumbersView) {
      const lines = code.split("\n");
      const lineNumbersText = lines.map((_, index) => (index + this.lineNumberStart).toString()).join("\n");
      this.lineNumbersView.text = lineNumbersText;
    }
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
