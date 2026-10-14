import { Utils } from "@nativescript/core";
import { encodeKey } from "@nativescript/localize/resource.common";

/**
 * A msgid's translation, left unformatted like GJS's `_()`. `localize()` runs every string through
 * sprintf, which throws on the `%d` a shared msgid keeps for the caller's own `formatMessage()`.
 */
export const translate = (msgid: string): string => {
  const id = Utils.android.resources.getStringId(encodeKey(msgid));
  return id === 0 ? msgid : Utils.android.getApplicationContext().getResources().getString(id);
};
