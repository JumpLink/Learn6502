import { Plugin } from 'vite';
import { execa } from 'execa';
import path from 'node:path';
import fs from 'node:fs/promises';
import glob from 'fast-glob';
import type { XGettextPluginOptions } from './types.js';
import { readFile } from 'node:fs/promises';
import { version } from 'node:os';

// Add GLib preset constants
// From https://github.com/mesonbuild/meson/blob/467da051c859ba3112803b035e317bddadd756ef/mesonbuild/modules/i18n.py
const GLIB_PRESET_ARGS = [
  '--from-code=UTF-8',
  '--add-comments',
  // https://developer.gnome.org/glib/stable/glib-I18N.html
  '--keyword=_',
  '--keyword=N_',
  '--keyword=C_:1c,2',
  '--keyword=NC_:1c,2',
  '--keyword=g_dcgettext:2',
  '--keyword=g_dngettext:2,3',
  '--keyword=g_dpgettext2:2c,3',
  '--flag=N_:1:pass-c-format',
  '--flag=C_:2:pass-c-format',
  '--flag=NC_:2:pass-c-format',
  '--flag=g_dngettext:2:pass-c-format',
  '--flag=g_strdup_printf:1:c-format',
  '--flag=g_string_printf:2:c-format',
  '--flag=g_string_append_printf:2:c-format',
  '--flag=g_error_new:3:c-format',
  '--flag=g_set_error:4:c-format',
  '--flag=g_markup_printf_escaped:1:c-format',
  '--flag=g_log:3:c-format',
  '--flag=g_print:1:c-format',
  '--flag=g_printerr:1:c-format',
  '--flag=g_printf:1:c-format',
  '--flag=g_fprintf:2:c-format',
  '--flag=g_sprintf:2:c-format',
  '--flag=g_snprintf:3:c-format',
];

/**
 * Checks if xgettext is installed and available
 * @param verbose Enable verbose logging
 * @throws Error if xgettext is not found
 */
async function checkDependencies(verbose: boolean) {
  try {
    await execa('xgettext', ['--version']);
    if (verbose) {
      console.log('[vite-plugin-xgettext] Found xgettext');
    }
  } catch (error) {
    throw new Error(
      'xgettext not found. Please install gettext:\n' +
      '  Ubuntu/Debian: sudo apt-get install gettext\n' +
      '  Fedora: sudo dnf install gettext\n' +
      '  Arch: sudo pacman -S gettext\n' +
      '  macOS: brew install gettext'
    );
  }
}

/**
 * Creates a Vite plugin that extracts translatable strings from source files
 * Uses GNU xgettext to generate a POT template file that can be used as basis for translations
 * @param options Configuration options for the plugin
 * @returns A Vite plugin that handles string extraction
 */
export function xgettextPlugin(options: XGettextPluginOptions): Plugin {
  return {
    name: 'vite-plugin-xgettext',

    async buildStart() {
      await checkDependencies(options.verbose ?? false);
      const files = await glob(options.sources);
      await extractStrings(files, options);
    },

    configureServer(server) {
      server.watcher.add(options.sources);

      server.watcher.on('change', async (file) => {
        if (options.sources.some(pattern => file.match(pattern))) {
          if (options.verbose) {
            console.log(`[vite-plugin-xgettext] Source file changed: ${file}, re-running extraction`);
          }
          const files = await glob(options.sources);
          await extractStrings(files, options);
        }
      });
    }
  };
}

async function generatePotfiles(files: string[], outputDir: string, verbose = false) {
  const potfilesPath = path.join(outputDir, 'POTFILES')
  const content = files.join('\n')

  try {
    await fs.writeFile(potfilesPath, content)
    if (verbose) {
      console.log(`[vite-plugin-xgettext] Generated POTFILES with ${files.length} source files`)
    }
  } catch (error) {
    console.error('[vite-plugin-xgettext] Error writing POTFILES:', error)
  }
}

async function extractStrings(files: string[], options: XGettextPluginOptions) {
  const {
    output,
    domain = 'messages',
    keywords = [],
    language = [],
    xgettextOptions = [],
    preset,
    verbose = false
  } = options;

  try {
    const outputDir = path.dirname(output);
    await fs.mkdir(outputDir, { recursive: true });

    await generatePotfiles(files, outputDir, verbose);

    // Base arguments
    let args = [
      '--package-name=' + domain,
      options.version ? '--package-version=' + options.version : '',
      '--output=' + output,
      '--files-from=' + path.join(outputDir, 'POTFILES'),
      '--sort-output',
    ];

    // Add preset arguments if specified
    if (preset === 'glib') {
      args = [...args, ...GLIB_PRESET_ARGS];
    }

    // Add custom keywords and options after preset
    // This allows overriding preset values if needed
    args = [
      ...args,
      ...keywords.map(k => `--keyword=${k}`),
      ...language.map(l => `--language=${l}`),
      ...xgettextOptions,
    ];

    if (verbose) {
      console.log('[vite-plugin-xgettext] Running xgettext:', args.join(' '));
    }

    const result = await execa('xgettext', args);

    if (verbose && result.stdout) {
      console.log('[vite-plugin-xgettext] Output:', result.stdout);
    }

    if (options.autoUpdatePo) {
      await updatePoFiles(options.output, options.verbose || false);
    }
  } catch (error) {
    throw new Error(`Failed to extract translations: ${error}`);
  }
}

async function updatePoFiles(potFile: string, verbose: boolean) {
  try {
    const linguasPath = path.join(path.dirname(potFile), 'LINGUAS');
    const languages = (await readFile(linguasPath, 'utf-8')).split('\n').filter(Boolean);

    for (const lang of languages) {
      const poFile = path.join(path.dirname(potFile), `${lang}.po`);
      if (verbose) {
        console.log(`[vite-plugin-xgettext] Updating ${poFile}`);
      }
      await execa('msgmerge', ['--update', '--backup=none', poFile, potFile]);
    }
  } catch (error) {
    console.error('[vite-plugin-xgettext] Error updating PO files:', error);
  }
}
