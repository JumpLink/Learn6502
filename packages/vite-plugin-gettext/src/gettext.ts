import { Plugin } from 'vite';
import { execa } from 'execa';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { GettextPluginOptions } from './types.js';

/**
 * Checks if msgfmt is installed and available
 * @param verbose Enable verbose logging
 * @throws Error if msgfmt is not found
 */
async function checkDependencies(verbose: boolean) {
  try {
    await execa('msgfmt', ['--version']);
    if (verbose) {
      console.log('[vite-plugin-gettext] Found msgfmt');
    }
  } catch (error) {
    throw new Error(
      'msgfmt not found. Please install gettext:\n' +
      '  Ubuntu/Debian: sudo apt-get install gettext\n' +
      '  Fedora: sudo dnf install gettext\n' +
      '  Arch: sudo pacman -S gettext\n' +
      '  macOS: brew install gettext'
    );
  }
}

/**
 * Scans the PO directory to find available language translations
 * @param poDirectory Directory containing PO files
 * @param verbose Enable verbose logging
 * @returns Array of language codes found (e.g. ['de', 'fr', 'es'])
 */
async function findAvailableLanguages(poDirectory: string, verbose: boolean): Promise<string[]> {
  try {
    const files = await fs.readdir(poDirectory);
    const languages = files
      .filter(file => file.endsWith('.po'))
      .map(file => path.basename(file, '.po'));

    if (verbose) {
      console.log(`[vite-plugin-gettext] Found languages: ${languages.join(', ')}`);
    }

    return languages;
  } catch (error) {
    if (verbose) {
      console.log(`[vite-plugin-gettext] No PO directory found at ${poDirectory}`);
    }
    return [];
  }
}

/**
 * Creates a Vite plugin that compiles PO translation files to binary MO format
 * The MO files are placed in the standard gettext directory structure:
 * {moDirectory}/locale/{lang}/LC_MESSAGES/messages.mo
 * @param options Configuration options for the plugin
 * @returns A Vite plugin that handles PO compilation
 */
export function gettextPlugin(options: GettextPluginOptions): Plugin {
  const {
    poDirectory,
    moDirectory,
    verbose = false
  } = options;

  async function compileMoFiles() {
    try {
      // Check if PO directory exists
      try {
        await fs.access(poDirectory);
      } catch {
        if (verbose) {
          console.log(`[vite-plugin-gettext] PO directory ${poDirectory} does not exist yet, skipping compilation`);
        }
        return;
      }

      // Find available languages
      const languages = await findAvailableLanguages(poDirectory, verbose);
      
      if (languages.length === 0) {
        if (verbose) {
          console.log('[vite-plugin-gettext] No translation files found');
        }
        return;
      }

      // Create MO directory
      await fs.mkdir(path.join(moDirectory, 'locale'), { recursive: true });

      for (const lang of languages) {
        const poFile = path.join(poDirectory, `${lang}.po`);
        const moPath = path.join(moDirectory, 'locale', lang, 'LC_MESSAGES');
        const moFile = path.join(moPath, 'messages.mo');

        await fs.mkdir(moPath, { recursive: true });

        if (verbose) {
          console.log(`[vite-plugin-gettext] Compiling ${poFile} to ${moFile}`);
        }

        await execa('msgfmt', [
          '--output-file=' + moFile,
          poFile
        ]);
      }
    } catch (error) {
      throw new Error(`Failed to compile MO files: ${error}`);
    }
  }

  return {
    name: 'vite-plugin-gettext',
    
    async buildStart() {
      await checkDependencies(verbose);
      await compileMoFiles();
    },

    configureServer(server) {
      server.watcher.add(poDirectory);
      
      server.watcher.on('change', async (file) => {
        if (file.endsWith('.po')) {
          if (verbose) {
            console.log(`[vite-plugin-gettext] PO file changed: ${file}, recompiling`);
          }
          await compileMoFiles();
        }
      });
    }
  };
}