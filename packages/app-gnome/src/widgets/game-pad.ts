import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'

import Template from './game-pad.blp'

export interface GamePad {
  // GObject signals
  connect(id: string, callback: (...args: any[]) => any): number;
  connect_after(id: string, callback: (...args: any[]) => any): number;
  emit(id: string, ...args: any[]): void;

  // Custom signals
  connect(signal: 'gamepad-pressed', callback: (_source: this, key: number) => void): number;
  connect_after(signal: 'gamepad-pressed', callback: (_source: this, key: number) => void): number;
  emit(signal: 'gamepad-pressed', key: number): void;
}

export class GamePad extends Adw.Bin {

  // Child widgets
  declare private _buttonLeft: Gtk.Button
  declare private _buttonRight: Gtk.Button
  declare private _buttonUp: Gtk.Button
  declare private _buttonDown: Gtk.Button
  declare private _buttonA: Gtk.Button
  declare private _buttonB: Gtk.Button

  static {
    GObject.registerClass({
      GTypeName: 'GamePad',
      Template,
      InternalChildren: ['buttonLeft', 'buttonRight', 'buttonUp', 'buttonDown', 'buttonA', 'buttonB'],
      Signals: {
        'gamepad-pressed': {
          param_types: [GObject.TYPE_INT],
        },
      },
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params)

    this._buttonUp.connect('clicked', () => {
      this.emit('gamepad-pressed', 119);
    });

    this._buttonDown.connect('clicked', () => {
      this.emit('gamepad-pressed', 115);
    });

    this._buttonLeft.connect('clicked', () => {
      this.emit('gamepad-pressed', 97);
    });

    this._buttonRight.connect('clicked', () => {
      this.emit('gamepad-pressed', 100);
    });

    this._buttonA.connect('clicked', () => {
      this.emit('gamepad-pressed', 13);
    });

    this._buttonB.connect('clicked', () => {
      this.emit('gamepad-pressed', 32);
    });
  }

  public press(buttonName: 'Left' | 'Right' | 'Up' | 'Down' | 'A' | 'B'): void {
    let button: Gtk.Button | null = null;

    switch(buttonName) {
      case 'Left':
        button = this._buttonLeft;
        break;
      case 'Right':
        button = this._buttonRight;
        break;
      case 'Up':
        button = this._buttonUp;
        break;
      case 'Down':
        button = this._buttonDown;
        break;
      case 'A':
        button = this._buttonA;
        break;
      case 'B':
        button = this._buttonB;
        break;
    }

    if(!button || !(button instanceof Gtk.Button)) {
      throw new Error('Invalid button name');
    }

    button.activate();
  }
}

GObject.type_ensure(GamePad.$gtype)