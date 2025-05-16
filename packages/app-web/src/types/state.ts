export interface State {
  assemble: boolean;
  run?: [boolean, string];
  reset: boolean;
  hexdump: boolean;
  disassemble: boolean;
  debug: [boolean, boolean];
}
