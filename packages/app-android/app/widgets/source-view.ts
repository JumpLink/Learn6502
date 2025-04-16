import { ContentView, Property, TextView, Builder } from '@nativescript/core';
import { debounce } from '@learn6502/6502';

export class SourceView extends ContentView {
    textView: TextView;
    private debouncedHighlighting: (code: string) => void;
    private _code: string = '';
    private lineNumbersView: TextView;

    public static codeProperty = new Property<SourceView, string>({
        name: 'code',
        defaultValue: '',
        affectsLayout: true,
        valueChanged(target, oldValue, newValue) {
            target._code = newValue;
            target.updateText(newValue);
        },
    });

    get code(): string {
        return this._code;
    }

    set code(value: string) {
        this._code = value;
    }

    constructor() {
        super();
        // Create debounced version of the highlighting function
        this.debouncedHighlighting = debounce((code: string) => {
            this.applyHighlighting(code);
        }, 150); // Reduced delay for better responsiveness
    }

    updateText(code: string) {
        if (this.textView) {
            this.debouncedHighlighting(code);
        }
    }

    private applyHighlighting(code: string) {
        if (this.textView?.android) {
            // Save cursor position
            const nativeEditText = this.textView.android as android.widget.EditText;
            const selectionStart = Math.min(nativeEditText.getSelectionStart(), code.length);
            const selectionEnd = Math.min(nativeEditText.getSelectionEnd(), code.length);

            const spannable = new android.text.SpannableString(code);

            // Comments (green)
            const commentPattern = /;.*/g;
            let match: RegExpExecArray | null;
            while ((match = commentPattern.exec(code)) !== null) {
                spannable.setSpan(
                    new android.text.style.ForegroundColorSpan(android.graphics.Color.parseColor('#008000')),
                    match.index,
                    match.index + match[0].length,
                    android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
                );
            }

            // Opcodes (blue)
            const opcodePattern = /\b(LDA|LDX|LDY|STA|STX|STY|ADC|SBC|INC|DEC|JMP|JSR|RTS|BEQ|BNE)\b/gi;
            while ((match = opcodePattern.exec(code)) !== null) {
                spannable.setSpan(
                    new android.text.style.ForegroundColorSpan(android.graphics.Color.parseColor('#0000FF')),
                    match.index,
                    match.index + match[0].length,
                    android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
                );
                // Bold for opcodes
                spannable.setSpan(
                    new android.text.style.StyleSpan(android.graphics.Typeface.BOLD),
                    match.index,
                    match.index + match[0].length,
                    android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
                );
            }

            // Hex values (purple)
            const hexPattern = /(\$[0-9A-F]+|#\$[0-9A-F]+)/gi;
            while ((match = hexPattern.exec(code)) !== null) {
                spannable.setSpan(
                    new android.text.style.ForegroundColorSpan(android.graphics.Color.parseColor('#800080')),
                    match.index,
                    match.index + match[0].length,
                    android.text.Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
                );
            }

            try {
                // Set text and restore cursor position
                nativeEditText.setText(spannable as any); // Wrong parameter type in NativeScript?
                // Only set selection if we have valid positions
                if (selectionStart >= 0 && selectionEnd >= 0 && selectionStart <= code.length && selectionEnd <= code.length) {
                    nativeEditText.setSelection(selectionStart, selectionEnd);
                }
            } catch (error) {
                // Log error but don't crash
                console.error('Error applying text highlighting:', error);
            }
        }
    }

    onLoaded() {
        super.onLoaded();

        // Load the XML layout using Builder
        const componentView = Builder.load({
            path: '~/widgets',
            name: 'source-view'
        });

        console.log("componentView", componentView, componentView.getViewById('textView'));

        // Bind the TextView from the loaded XML
        this.textView = componentView.getViewById<TextView>('textView');

        if (!this.textView) {
            throw new Error('Failed to find textView in source-view.xml');
        }

        // Bind the lineNumbersView from the loaded XML
        this.lineNumbersView = componentView.getViewById<TextView>('lineNumbersView');

        if (!this.lineNumbersView) {
            throw new Error('Failed to find lineNumbersView in source-view.xml');
        }

        // Synchronize line numbers with text changes
        this.textView.on('textChange', () => {
            if (this.textView) {
                this.updateText(this.textView.text);
                this.updateLineNumbers(this.textView.text);
            }
        });

        // Add the componentView to the content, only after that the native views (`.android`) are ready
        this.content = componentView;

        const textEdit = this.textView.android as android.widget.EditText;

        if (!textEdit) {
            throw new Error('Failed to find textEdit in source-view.xml');
        }

        // Set up scroll change listener
        textEdit.setOnScrollChangeListener(new android.view.View.OnScrollChangeListener({
            onScrollChange: (v, scrollX, scrollY, oldScrollX, oldScrollY) => {
                if (this.lineNumbersView && this.lineNumbersView.android) {
                    const lineNumbersEdit = this.lineNumbersView.android as android.widget.EditText;
                    lineNumbersEdit.scrollTo(0, scrollY);
                }
            }
        }));

        // Apply initial text if set
        if (this.code) {
            this.updateText(this.code);
        }
    }

    private updateLineNumbers(code: string) {
        if (this.lineNumbersView) {
            const lines = code.split('\n').map((_, index) => (index + 1).toString()).join('\n');
            this.lineNumbersView.text = lines;
        }
    }
}

SourceView.codeProperty.register(SourceView);
