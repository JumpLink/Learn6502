import type { View } from "@nativescript/core";

/**
 * The two ways `main.window.blp` hands a widget to the shell, each failing loudly when the
 * blueprint stops providing it. A missing part used to travel on as `undefined` and surface far
 * from its cause — `GridLayout.setRow(undefined, 0)` reported only "element cannot be null or
 * undefined" from inside NativeScript, with nothing naming the widget or the blueprint.
 */

/** An object the blueprint builds beside the template, like `Adw.AlertDialog unsavedChangesDialog {}`. */
export function sibling<T>(siblings: ReadonlyMap<string, object>, id: string): T {
  const found = siblings.get(id);
  if (found === undefined) {
    throw new Error(
      `main.window.blp names no sibling object '${id}'. It has: ${[...siblings.keys()].sort().join(", ")}.`
    );
  }
  return found as T;
}

/** A widget inside the built window tree, by the id the blueprint gives it. */
export function partById<T>(root: View, id: string): T {
  const found = root.getViewById<View>(id);
  if (!found) {
    throw new Error(`main.window.blp has no widget with id '${id}' inside the window tree.`);
  }
  // The widgets are typed against the GJS bindings, but at run time they are NativeScript views.
  return found as unknown as T;
}
