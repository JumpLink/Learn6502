/**
 * Configuration options for the xgettext plugin
 * Used to extract translatable strings from source files
 */
export interface XGettextPluginOptions {
  /** Glob patterns for source files to extract strings from */
  sources: string[];
  /** Output path for the POT template file */
  output: string;
  /** The gettext domain name, defaults to 'messages' */
  domain?: string;
  /** Keywords to look for when extracting strings, defaults to ['_', 'gettext', 'ngettext'] */
  keywords?: string[];
  /** Additional options to pass to xgettext command */
  xgettextOptions?: string[];
  /** Enable verbose logging */
  verbose?: boolean;
  /** Automatically update PO files after POT changes */
  autoUpdatePo?: boolean;
  /** Version of the POT file, defaults to '1.0' */
  version?: string;
  /** Preset to use for extracting strings, defaults to 'glib' */
  preset?: 'glib';
  /** URL for reporting bugs in the POT file */
  msgidBugsAddress?: string;
  /** Copyright holder to set in the POT file */
  copyrightHolder?: string;
}

/**
 * Configuration options for the gettext plugin
 * Used to compile PO files to binary MO format
 */
export interface GettextPluginOptions {
  /** Directory containing PO translation files */
  poDirectory: string;
  /** Output directory for compiled MO files */
  moDirectory: string;
  /** Filename of the MO file, defaults to 'messages.mo' */
  filename?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}
