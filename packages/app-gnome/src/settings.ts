import Gio from "@girs/gio-2.0";

export const settings = new Gio.Settings({
  schema_id: "eu.jumplink.Learn6502",
  path: "/eu/jumplink/Learn6502/",
});
