import { type Plugin } from 'vite';
import { execa } from 'execa';
import path from 'node:path';
import type { MsgfmtPluginOptions, MsgfmtFormat } from './types.js';
import {
  checkDependencies,
  findAvailableLanguages,
  ensureDirectory
} from './utils.js';

/**
 * Get output file extension based on the format
 * @param format The output format
 * @returns The file extension for the given format
 */
function getOutputExtension(format: MsgfmtFormat): string {
  switch (format) {
    case 'mo':
      return '.mo';
    case 'java':
    case 'java2':
      return '.class';
    case 'csharp':
      return '.dll';
    case 'csharp-resources':
      return '.resources.dll';
    case 'tcl':
      return '.msg';
    case 'desktop':
      return '.desktop';
    case 'xml':
      return '.xml';
    case 'json':
      return '.json';
    case 'qt':
      return '.qm';
    default:
      return '.mo';
  }
}

/**
 * Creates a Vite plugin that compiles PO translation files to various formats
 * Supports metainfo files with special processing
 * @param options Configuration options for the plugin
 * @returns A Vite plugin that handles PO compilation
 */
export function msgfmtPlugin(options: MsgfmtPluginOptions): Plugin {
  const {
    poDirectory,
    outputDirectory,
    domain = 'messages',
    format = 'mo',
    templateFile,
    verbose = false,
    msgfmtOptions = [],
    useLocaleStructure = true
  } = options;

  const pluginName = 'vite-plugin-msgfmt';

  async function compilePoFiles() {
    try {
      // Check if PO directory exists
      try {
        await ensureDirectory(poDirectory);
      } catch {
        if (verbose) {
          console.log(`[${pluginName}] PO directory ${poDirectory} does not exist yet, skipping compilation`);
        }
        return;
      }

      // Create output directory
      await ensureDirectory(outputDirectory);

      // For XML format, we can use the bulk mode if a template is provided
      if (format === 'xml' && templateFile) {

        // Use bulk mode for XML format
        const outputFile = path.join(outputDirectory, options.filename || `${domain}${getOutputExtension(format)}`);

        if (verbose) {
          console.log(`[${pluginName}] Compiling all languages to ${outputFile} using bulk mode`);
        }

        // Base arguments for bulk mode
        const args = [
          '--output-file=' + outputFile,
          '--xml',
          '--template=' + templateFile,
          '-d', poDirectory
        ];

        // Add any additional options
        args.push(...msgfmtOptions);

        if (verbose) {
          console.log(`[${pluginName}] Running msgfmt with: ${args.join(' ')}`);
        }

        await execa('msgfmt', args);
      } else {
        // Find available languages for individual processing
        const languages = await findAvailableLanguages(poDirectory, pluginName, verbose);

        if (languages.length === 0) {
          if (verbose) {
            console.log(`[${pluginName}] No translation files found`);
          }
          return;
        }

        // Process each language individually for other formats
        for (const lang of languages) {
          const poFile = path.join(poDirectory, `${lang}.po`);

          let outputPath: string;
          let outputFile: string;

          if (useLocaleStructure && format === 'mo') {
            // Use standard gettext locale structure
            outputPath = path.join(outputDirectory, 'locale', lang, 'LC_MESSAGES');
            outputFile = path.join(outputPath, options.filename || `${domain}${getOutputExtension(format)}`);
          } else {
            // Use simple language-based structure
            outputPath = path.join(outputDirectory, lang);
            outputFile = path.join(outputPath, options.filename || `${domain}${getOutputExtension(format)}`);
          }

          // Create the directory structure
          await ensureDirectory(outputPath);

          if (verbose) {
            console.log(`[${pluginName}] Compiling ${poFile} to ${outputFile}`);
          }

          // Base arguments
          const args = [
            '--output-file=' + outputFile
          ];

          // Add format-specific arguments
          args.push(`--${format}`);

          // Add any additional options
          args.push(...msgfmtOptions);

          // Add the input PO file
          args.push(poFile);

          if (verbose) {
            console.log(`[${pluginName}] Running msgfmt with: ${args.join(' ')}`);
          }

          await execa('msgfmt', args);
        }
      }
    } catch (error) {
      throw new Error(`Failed to compile files: ${error}`);
    }
  }

  return {
    name: pluginName,

    async buildStart() {
      await checkDependencies('msgfmt', pluginName, verbose);
      await compilePoFiles();
    },

    configureServer(server) {
      server.watcher.add(poDirectory);

      server.watcher.on('change', async (file) => {
        if (file.endsWith('.po')) {
          if (verbose) {
            console.log(`[${pluginName}] PO file changed: ${file}, recompiling`);
          }
          await compilePoFiles();
        }
      });
    }
  };
}
