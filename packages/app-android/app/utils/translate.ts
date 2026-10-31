import { localize as _ } from "@nativescript/localize";

/** The catalog hook for `.blp` strings the shared-tree builder marks with `_()`. */
export const translate = (text: string): string => _(text);
