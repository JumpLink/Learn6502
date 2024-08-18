import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import GtkSource from '@girs/gtksource-5'

import Template from './editor.ui?raw'

interface _Editor {
  // Child widgets
  _scrolledWindow: Gtk.ScrolledWindow
}

class _Editor extends Adw.Bin {

  private _buffer: GtkSource.Buffer;
  private _sourceView: GtkSource.View;

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)

    // TODO: Add 6502 assembly language support

    // Get the language we want to use
    // const language_manager = GtkSource.LanguageManager.get_default();
    // const language = language_manager.get_language("js");

    // if(!language) {
    //   const supportedLanguages = language_manager.get_language_ids()
    //   throw new Error(`Language not found, supported languages: ${supportedLanguages?.join(', ')}`)
    // }

    // // Create the buffer - this holds the text that's used in the SourceView
    // const buffer = GtkSource.Buffer.new_with_language(language);

    this._buffer = new GtkSource.Buffer();

    this._buffer.set_text(`
      LDA #$01
      STA $0200
      LDA #$05
      STA $0201
      LDA #$08
      STA $0202`, -1);

    // Create the SourceView which displays the buffer's display
    this._sourceView = new GtkSource.View({
      auto_indent: true,
      indent_width: 4,
      buffer: this._buffer,
      show_line_numbers: true,
    });

    this._scrolledWindow.set_child(this._sourceView)
  }

  public getBuffer(): GtkSource.Buffer {
    return this._buffer;
  }
}

export const Editor = GObject.registerClass(
  {
    GTypeName: 'Editor',
    Template,
    InternalChildren: ['scrolledWindow']
  },
  _Editor
)
