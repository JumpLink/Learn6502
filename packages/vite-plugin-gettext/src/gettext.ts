import { type Plugin } from "vite";
import { execa } from "execa";
import path from "node:path";
import type { GettextPluginOptions } from "./types.js";
import {
  checkDependencies,
  findAvailableLanguages,
  generateLinguasFile,
  ensureDirectory,
} from "./utils.js";

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
    filename = "messages.mo",
    verbose = false,
  } = options;

  const pluginName = "vite-plugin-gettext";

  async function compileMoFiles() {
    try {
      // Check if PO directory exists
      try {
        await ensureDirectory(poDirectory);
      } catch {
        if (verbose) {
          console.log(
            `[${pluginName}] PO directory ${poDirectory} does not exist yet, skipping compilation`
          );
        }
        return;
      }

      // Find available languages
      const languages = await findAvailableLanguages(
        poDirectory,
        pluginName,
        verbose
      );

      if (languages.length === 0) {
        if (verbose) {
          console.log(`[${pluginName}] No translation files found`);
        }
        return;
      }

      // Generate LINGUAS file
      await generateLinguasFile(languages, poDirectory, verbose);

      // Create MO directory
      await ensureDirectory(path.join(moDirectory, "locale"));

      for (const lang of languages) {
        const poFile = path.join(poDirectory, `${lang}.po`);
        const moPath = path.join(moDirectory, "locale", lang, "LC_MESSAGES");
        const moFile = path.join(moPath, filename);

        await ensureDirectory(moPath);

        if (verbose) {
          console.log(`[${pluginName}] Compiling ${poFile} to ${moFile}`);
        }

        await execa("msgfmt", ["--output-file=" + moFile, poFile]);
      }
    } catch (error) {
      throw new Error(`Failed to compile MO files: ${error}`);
    }
  }

  return {
    name: pluginName,

    async buildStart() {
      await checkDependencies("msgfmt", pluginName, verbose);
      await compileMoFiles();
    },

    configureServer(server) {
      server.watcher.add(poDirectory);

      server.watcher.on("change", async (file) => {
        if (file.endsWith(".po")) {
          if (verbose) {
            console.log(
              `[${pluginName}] PO file changed: ${file}, recompiling`
            );
          }
          await compileMoFiles();
        }
      });
    },
  };
}
