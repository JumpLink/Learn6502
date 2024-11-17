import { Plugin } from 'vite';
import { execa } from 'execa';
import path from 'node:path';
import fs from 'node:fs/promises';
import glob from 'fast-glob';
import type { XGettextPluginOptions } from './types.js';

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

export function xgettextPlugin(options: XGettextPluginOptions): Plugin {
  const {
    sources,
    output,
    domain = 'messages',
    keywords = ['_', 'gettext', 'ngettext'],
    xgettextOptions = [],
    verbose = false
  } = options;

  async function extractStrings() {
    try {
      await fs.mkdir(path.dirname(output), { recursive: true });

      // Resolve glob patterns to actual files
      const files = await glob(sources);
      
      if (files.length === 0) {
        if (verbose) {
          console.log('[vite-plugin-xgettext] No source files found');
        }
        return;
      }

      const args = [
        '--from-code=UTF-8',
        '--add-comments=TRANSLATORS:',
        '--package-name=' + domain,
        '--output=' + output,
        '--language=JavaScript',
        ...keywords.map(k => `--keyword=${k}`),
        ...xgettextOptions,
        ...files
      ];

      if (verbose) {
        console.log('[vite-plugin-xgettext] Running xgettext with args:', args.join(' '));
      }

      const result = await execa('xgettext', args);

      if (verbose && result.stdout) {
        console.log('[vite-plugin-xgettext] Output:', result.stdout);
      }
    } catch (error) {
      throw new Error(`Failed to extract translations: ${error}`);
    }
  }

  return {
    name: 'vite-plugin-xgettext',
    
    async buildStart() {
      await checkDependencies(verbose);
      await extractStrings();
    },

    configureServer(server) {
      server.watcher.add(sources);
      
      server.watcher.on('change', async (file) => {
        if (sources.some(pattern => file.match(pattern))) {
          if (verbose) {
            console.log(`[vite-plugin-xgettext] Source file changed: ${file}, re-running extraction`);
          }
          await extractStrings();
        }
      });
    }
  };
}