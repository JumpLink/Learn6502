import { type Plugin } from "vite";
import path from "node:path";
import fs from "node:fs/promises";
import * as gettextParser from "gettext-parser";
import type { GettextPo2JsonPluginOptions } from "./types.js";
import {
  checkDependencies,
  findAvailableLanguages,
  ensureDirectory,
} from "./utils.js";

/**
 * Simplifies the gettext-parser output to a clean key-value object
 * where the key is the original text and the value is the translation
 * @param translations The parsed PO file from gettext-parser
 * @returns A simplified object with just the translations
 */
function simplifyTranslations(translations: any): Record<string, string> {
  const result: Record<string, string> = {};

  // Go through all translation contexts
  Object.keys(translations.translations).forEach((context) => {
    const contextTranslations = translations.translations[context];

    // Skip the header (empty msgid)
    Object.keys(contextTranslations).forEach((key) => {
      if (key === "") return;

      const translation = contextTranslations[key];
      // Get the original text (msgid)
      const original = translation.msgid;
      // Get the translated text (first item in msgstr array)
      const translated = translation.msgstr[0];

      // Only add the translation if it exists and is not empty
      if (translated && translated.trim() !== "") {
        result[original] = translated;
      }
    });
  });

  return result;
}

/**
 * Creates a dictionary of all original strings from all translations
 * For the default language, we need to gather all possible keys
 * @param jsonDirectory Directory with JSON files
 * @param allTranslations Collection of all translations
 * @param defaultLanguage The default language code
 * @param verbose Whether to log verbose messages
 * @param pluginName The name of the plugin
 * @param additionalTranslations Additional translations to include
 * @returns Object with original strings as both keys and values
 */
async function createDefaultLanguageJson(
  jsonDirectory: string,
  allTranslations: Record<string, Record<string, string>>,
  defaultLanguage: string,
  verbose: boolean,
  pluginName: string,
  additionalTranslations: Record<string, string> = {}
): Promise<void> {
  // Create a set of all original strings from all translations
  const allOriginalStrings = new Set<string>();

  // Collect all original strings from all translations
  Object.values(allTranslations).forEach((translations) => {
    Object.keys(translations).forEach((key) => {
      allOriginalStrings.add(key);
    });
  });

  // Create the default language JSON with keys matching values
  const defaultLanguageJson: Record<string, string> = {};
  allOriginalStrings.forEach((str) => {
    defaultLanguageJson[str] = str;
  });

  // Process additional translations
  const finalTranslations = { ...defaultLanguageJson };

  // For each additional translation, try to find a translation or use the original
  Object.entries(additionalTranslations).forEach(([key, originalText]) => {
    // If there's a translation for the original text, use it
    if (defaultLanguageJson[originalText]) {
      finalTranslations[key] = defaultLanguageJson[originalText];
    } else {
      // Otherwise use the original text
      finalTranslations[key] = originalText;
    }
  });

  // Write the default language file with .default.json extension
  const defaultLangDefaultFile = path.join(
    jsonDirectory,
    `${defaultLanguage}.default.json`
  );

  if (verbose) {
    console.log(
      `[${pluginName}] Creating default language file: ${defaultLangDefaultFile}`
    );
  }

  await fs.writeFile(
    defaultLangDefaultFile,
    JSON.stringify(finalTranslations, null, 2)
  );
}

/**
 * Creates a Vite plugin that converts PO translation files to JSON format
 * The JSON files are placed in the specified output directory
 * @param options Configuration options for the plugin
 * @returns A Vite plugin that handles PO to JSON conversion
 */
export function po2jsonPlugin(options: GettextPo2JsonPluginOptions): Plugin {
  const {
    poDirectory,
    jsonDirectory,
    defaultLanguage = "en",
    verbose = false,
    additionalTranslations = {},
  } = options;

  const pluginName = "vite-plugin-gettext-po2json";

  async function convertPoToJson() {
    try {
      // Check if PO directory exists
      try {
        await ensureDirectory(poDirectory);
      } catch {
        if (verbose) {
          console.log(
            `[${pluginName}] PO directory ${poDirectory} does not exist yet, skipping conversion`
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

      // Create JSON directory
      await ensureDirectory(jsonDirectory);

      // Collection of all translations to create the default language file
      const allTranslations: Record<string, Record<string, string>> = {};

      // Skip the default language if it exists in the list
      const nonDefaultLanguages = languages.filter(
        (lang) => lang !== defaultLanguage
      );

      // Handle default language if it exists in the list
      if (languages.includes(defaultLanguage)) {
        const poFile = path.join(poDirectory, `${defaultLanguage}.po`);
        const jsonFile = path.join(jsonDirectory, `${defaultLanguage}.json`);

        if (verbose) {
          console.log(
            `[${pluginName}] Converting default language ${poFile} to ${jsonFile}`
          );
        }

        // Read and parse PO file
        const poContent = await fs.readFile(poFile);
        const translations = gettextParser.po.parse(poContent);

        // Convert the translations to a simple JSON object
        const simplifiedTranslations = simplifyTranslations(translations);

        // Process additional translations for default language
        const finalTranslations = { ...simplifiedTranslations };

        // For each additional translation, add it to the default language file
        Object.entries(additionalTranslations).forEach(
          ([key, originalText]) => {
            finalTranslations[key] = originalText;
          }
        );

        // Write JSON file for default language
        await fs.writeFile(
          jsonFile,
          JSON.stringify(finalTranslations, null, 2)
        );
      }

      // Add additional translations for all languages
      for (const lang of nonDefaultLanguages) {
        const poFile = path.join(poDirectory, `${lang}.po`);
        const jsonFile = path.join(jsonDirectory, `${lang}.json`);

        if (verbose) {
          console.log(`[${pluginName}] Converting ${poFile} to ${jsonFile}`);
        }

        // Read and parse PO file
        const poContent = await fs.readFile(poFile);
        const translations = gettextParser.po.parse(poContent);

        // Convert the translations to a simple JSON object
        const simplifiedTranslations = simplifyTranslations(translations);

        // Store translations for creating the default language file
        allTranslations[lang] = simplifiedTranslations;

        // Process additional translations
        const finalTranslations = { ...simplifiedTranslations };

        // For each additional translation, try to find a translation or use the original
        Object.entries(additionalTranslations).forEach(
          ([key, originalText]) => {
            // If there's a translation for the original text, use it
            if (simplifiedTranslations[originalText]) {
              finalTranslations[key] = simplifiedTranslations[originalText];
            } else {
              // Otherwise use the original text
              finalTranslations[key] = originalText;
            }
          }
        );

        // Write JSON file
        await fs.writeFile(
          jsonFile,
          JSON.stringify(finalTranslations, null, 2)
        );
      }

      // Create the default language file (with all original strings as both keys and values)
      await createDefaultLanguageJson(
        jsonDirectory,
        allTranslations,
        defaultLanguage,
        verbose,
        pluginName,
        additionalTranslations
      );
    } catch (error) {
      throw new Error(`Failed to convert PO files to JSON: ${error}`);
    }
  }

  return {
    name: pluginName,

    async buildStart() {
      await convertPoToJson();
    },

    configureServer(server) {
      server.watcher.add(poDirectory);

      server.watcher.on("change", async (file) => {
        if (file.endsWith(".po")) {
          if (verbose) {
            console.log(
              `[${pluginName}] PO file changed: ${file}, reconverting`
            );
          }
          await convertPoToJson();
        }
      });
    },
  };
}
