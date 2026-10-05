import Gdk from "@girs/gdk-4.0";

export const findIdsInXml = (prefix: string, xmlString: string): string[] => {
  const regex = new RegExp(`id="${prefix}(\\d+)"`, "g");
  const result: string[] = [];
  let match;

  while ((match = regex.exec(xmlString)) !== null) {
    result.push(`${prefix}${match[1]}`);
  }

  return result;
};

export const copyToClipboard = (text: string, clipboard?: Gdk.Clipboard): boolean => {
  if (!clipboard) {
    clipboard = Gdk.Display.get_default()?.get_clipboard();
  }

  if (!clipboard) {
    console.error("Failed to get clipboard");
    return false;
  }

  clipboard.set(text);
  return true;
};
