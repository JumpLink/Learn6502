import { Plugin } from 'vite';
import { execa } from 'execa';
import path from 'node:path';
import fs from 'node:fs/promises';
import glob from 'fast-glob';
import type { XGettextPluginOptions } from './types.js';
import { readFile } from 'node:fs/promises';

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

async function extractStrings(files: string[], options: XGettextPluginOptions) {
  const {
    output,
    domain = 'messages',
    keywords = ['_', 'gettext', 'ngettext'],
    xgettextOptions = [],
    verbose = false
  } = options;

  try {
    await fs.mkdir(path.dirname(output), { recursive: true });

    const args = [
      '--from-code=UTF-8',
      '--add-comments=TRANSLATORS:',
      '--package-name=' + domain,
      '--output=' + output,
      ...keywords.map(k => `--keyword=${k}`),
      ...xgettextOptions,
      ...files
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
