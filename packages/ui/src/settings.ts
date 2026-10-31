import Gio from "@girs/gio-2.0";
// The one schema for every target: on GJS GSettings reads its compiled form, on the web and
// Android the import registers the parsed schema with the Gio.Settings subset.
import "../data/eu.jumplink.Learn6502.gschema.xml?schema";

export const settings = new Gio.Settings({
  schema_id: "eu.jumplink.Learn6502",
  path: "/eu/jumplink/Learn6502/",
});
