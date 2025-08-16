import { execa } from "execa";
import path from "node:path";
import fs from "node:fs/promises";

/**
 * Checks if a gettext utility is installed and available
 * @param command The command to check (msgfmt, xgettext, etc.)
 * @param pluginName Name of the plugin for logging
 * @param verbose Enable verbose logging
 * @throws Error if the command is not found
 */
export async function checkDependencies(
  command: string,
  pluginName: string,
  verbose: boolean
) {
  try {
    await execa(command, ["--version"]);
    if (verbose) {
      console.log(`[${pluginName}] Found ${command}`);
    }
  } catch (error) {
    throw new Error(
      `${command} not found. Please install gettext:\n` +
        "  Ubuntu/Debian: sudo apt-get install gettext\n" +
        "  Fedora: sudo dnf install gettext\n" +
        "  Arch: sudo pacman -S gettext\n" +
        "  macOS: brew install gettext"
    );
  }
}

/**
 * Scans the PO directory to find available language translations
 * @param poDirectory Directory containing PO files
 * @param pluginName Name of the plugin for logging
 * @param verbose Enable verbose logging
 * @returns Array of language codes found (e.g. ['de', 'fr', 'es'])
 */
export async function findAvailableLanguages(
  poDirectory: string,
  pluginName: string,
  verbose: boolean
): Promise<string[]> {
  try {
    const files = await fs.readdir(poDirectory);
    const languages = files
      .filter((file) => file.endsWith(".po"))
      .map((file) => path.basename(file, ".po"));

    if (verbose) {
      console.log(`[${pluginName}] Found languages: ${languages.join(", ")}`);
    }

    return languages;
  } catch (error) {
    if (verbose) {
      console.log(`[${pluginName}] No PO directory found at ${poDirectory}`);
    }
    return [];
  }
}

/**
 * Generates a LINGUAS file containing the list of available languages
 * @param languages List of language codes
 * @param poDirectory Directory where the LINGUAS file should be created
 * @param verbose Enable verbose logging
 */
export async function generateLinguasFile(
  languages: string[],
  poDirectory: string,
  verbose = false
) {
  const linguasPath = path.join(poDirectory, "LINGUAS");
  const content = languages.join("\n");

  try {
    await fs.writeFile(linguasPath, content);
    if (verbose) {
      console.log(
        `Generated LINGUAS file with languages: ${languages.join(", ")}`
      );
    }
  } catch (error) {
    console.error("Error writing LINGUAS file:", error);
  }
}

/**
 * Creates directory structure recursively
 * @param directory Directory path to create
 */
export async function ensureDirectory(directory: string): Promise<void> {
  await fs.mkdir(directory, { recursive: true });
}

/**
 * Processes a filename with potential .in suffix
 * @param filePath Original file path or filename
 * @returns Object with processed filename and extension
 */
export function processFilename(filePath: string): {
  filename: string;
  extension: string;
} {
  // Extract just the filename if a path is provided
  const filename = path.basename(filePath);
  let extension = path.extname(filename).toLowerCase();
  let processedFilename = filename;

  // Handle .in extension
  if (filename.endsWith(".in")) {
    processedFilename = filename.substring(0, filename.length - 3);
    extension = path.extname(processedFilename).toLowerCase();
  }

  return { filename: processedFilename, extension };
}
