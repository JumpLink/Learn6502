import Gtk from '@girs/gtk-4.0'
import Gdk from '@girs/gdk-4.0'
import GObject from '@girs/gobject-2.0';

export const findIdsInXml = (prefix: string, xmlString: string): string[] => {
  const regex = new RegExp(`id="${prefix}(\\d+)"`, 'g');
  const result: string[] = [];
  let match;

  while ((match = regex.exec(xmlString)) !== null) {
    result.push(`${prefix}${match[1]}`);
  }

  return result;
}

export const copyToClipboard = (text: string, clipboard?: Gdk.Clipboard): boolean => {
  if (!clipboard) {
    clipboard = Gdk.Display.get_default()?.get_clipboard();
  }

  if (!clipboard) {
    console.error('Failed to get clipboard');
    return false;
  }

  // Create a value to hold the string
  const value = new GObject.Value();
  value.init(GObject.TYPE_STRING);
  value.set_string(text);

  const contentProvider = Gdk.ContentProvider.new_for_value(value);
  const success = clipboard.set_content(contentProvider) || false;

  return success;
}
