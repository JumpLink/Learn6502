// XML door for `Gtk.*` widgets — `<gtk:Button xmlns:gtk="~/gtk" />` resolves through
// this barrel, the same way `~/widgets/index` resolves `<w:SourceView>`. A plain XML
// app (no Angular/Vue) has no `registerElement` global to register widgets through,
// so `@gjsify/adwaita-nativescript`'s own convention is an app-local barrel per
// namespace that re-exports the package's `/gtk` (and `/adw`) subpath.
export * from "@gjsify/adwaita-nativescript/gtk";
