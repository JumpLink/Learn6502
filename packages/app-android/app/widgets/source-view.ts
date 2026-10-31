// The editor's source view is the shared `@learn6502/ui` component, the same one GNOME and the
// web run. Importing it registers `$SourceView` for the `.blp` files that name it.
// The builder arm teaches the NativeScript shared-tree builder what `GtkSourceView` is.
import "@gjsify/gtksource-nativescript/builder";
export { SourceView } from "@learn6502/ui";
