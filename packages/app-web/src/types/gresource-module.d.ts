// `*.gresource.xml` compiles to the GResource bytes (gjsify ADR 0116), for `Gio.Resource.new_from_data`.
// First in tsconfig `files`: TypeScript resolves `*.gresource.xml` against @learn6502/ui's `*.xml`
// by declaration order, and the earlier one wins.
/// <reference types="@gjsify/rolldown-plugin-gjsify/types" />
