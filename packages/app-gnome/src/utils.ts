import Gio from '@girs/gio-2.0'

export const rootDir = Gio.File.new_for_uri(
  import.meta.url,
).resolve_relative_path('../..')