import fs from "node:fs/promises";
import path from "node:path";

// Resolve example directories + generated files relative to the package root.
// The build is always run from there (`gjsify workspace @learn6502/examples
// build`), so cwd is the package dir. Using cwd instead of `import.meta.url`
// keeps paths correct when this script is bundled to `dist/` for the Node-free
// GJS build (where `import.meta.url` would point at `dist/`, not the package).
const __dirname = process.cwd();

/**
 * Convert a slug to a camelCase JavaScript identifier
 * @param slug - The slug to convert (e.g., "commented-snake")
 * @returns The camelCase version (e.g., "commentedSnake")
 *
 * Every dash has to go, not just the ones before a letter: slugs may contain
 * digits, and `-([a-z])` left "line-buster-6502" as "lineBuster-6502" — an
 * identifier the generated index.ts cannot even parse. A slug may also start
 * with a digit, which no identifier can, so prefix those.
 */
function slugToCamelCase(slug: string): string {
  const camelCase = slug.replace(/-+([a-z0-9])/g, (_, character: string) => character.toUpperCase());
  return /^[0-9]/.test(camelCase) ? `example${camelCase[0].toUpperCase()}${camelCase.slice(1)}` : camelCase;
}

/**
 * Find all example directories
 * @returns Array of directory names
 */
async function findExampleDirectories(): Promise<string[]> {
  const entries = await fs.readdir(__dirname, { withFileTypes: true });
  const directories = entries
    .filter(
      (entry) =>
        entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules" && entry.name !== "dist"
    )
    .map((entry) => entry.name);
  // Sorted, because readdir order is filesystem-dependent and this output is
  // committed: without it the generated examples.ts reorders itself per machine
  // and the examples show up in a different order in the app.
  return directories.sort();
}

/**
 * Find the meta file in a directory
 * @param dir - The directory to search
 * @returns The meta file name or null if not found
 */
async function findMetaFile(dir: string): Promise<string | null> {
  const dirPath = path.join(__dirname, dir);
  const entries = await fs.readdir(dirPath);
  const metaFile = entries.find((file) => file.endsWith(".meta.ts"));
  return metaFile || null;
}

/**
 * Find the asm file in a directory
 * @param dir - The directory to search
 * @returns The asm file name or null if not found
 */
async function findAsmFile(dir: string): Promise<string | null> {
  const dirPath = path.join(__dirname, dir);
  const entries = await fs.readdir(dirPath);
  const asmFile = entries.find((file) => file.endsWith(".asm"));
  return asmFile || null;
}

/**
 * Extract the slug from a meta file
 * @param dir - The directory containing the meta file
 * @param metaFile - The meta file name
 * @returns The slug
 */
async function extractSlug(dir: string, metaFile: string): Promise<string> {
  const metaPath = path.join(__dirname, dir, metaFile);
  const content = await fs.readFile(metaPath, "utf-8");
  const slugMatch = content.match(/slug:\s*["']([^"']+)["']/);
  if (!slugMatch) {
    throw new Error(`Could not extract slug from ${metaPath}`);
  }
  return slugMatch[1];
}

/**
 * Generate the index.ts content for an example
 * @param slug - The example slug
 * @param asmFile - The asm file name
 * @param metaFile - The meta file name
 * @returns The index.ts content
 */
function generateIndexContent(slug: string, asmFile: string, metaFile: string): string {
  const camelCaseName = slugToCamelCase(slug);
  return `import { default as ${camelCaseName}Code } from "./${asmFile}";
import ${camelCaseName}Meta from "./${metaFile}";
import type { ExampleMeta } from "../example-meta.ts";
const ${camelCaseName}: ExampleMeta = {
  ...${camelCaseName}Meta,
  code: ${camelCaseName}Code,
};
export { ${camelCaseName} };
`;
}

/**
 * Generate the examples.ts content that exports all examples
 * @param examples - Array of example information
 * @returns The examples.ts content
 */
function generateExamplesContent(examples: Array<{ dir: string; slug: string }>): string {
  const exports = examples.map(({ dir }) => `export * from "./${dir}";`).join("\n");
  return `${exports}\n`;
}

interface ExampleInfo {
  dir: string;
  slug: string;
  camelCaseName: string;
}

/**
 * Build index.ts files for all examples
 */
async function buildExamples(): Promise<void> {
  const directories = await findExampleDirectories();
  console.log(`Found ${directories.length} directories`);

  let generated = 0;
  let skipped = 0;
  const examples: ExampleInfo[] = [];

  for (const dir of directories) {
    console.log(`\nProcessing directory: ${dir}`);

    const metaFile = await findMetaFile(dir);
    if (!metaFile) {
      console.log(`  ⚠️  Skipping: No .meta.ts file found`);
      skipped++;
      continue;
    }

    const asmFile = await findAsmFile(dir);
    if (!asmFile) {
      console.log(`  ⚠️  Skipping: No .asm file found`);
      skipped++;
      continue;
    }

    const slug = await extractSlug(dir, metaFile);
    const camelCaseName = slugToCamelCase(slug);
    console.log(`  📝 Slug: ${slug} (${camelCaseName})`);
    console.log(`  📄 Meta file: ${metaFile}`);
    console.log(`  📄 ASM file: ${asmFile}`);

    const indexContent = generateIndexContent(slug, asmFile, metaFile);
    const indexPath = path.join(__dirname, dir, "index.ts");

    await fs.writeFile(indexPath, indexContent, "utf-8");
    console.log(`  ✅ Generated: ${dir}/index.ts`);
    generated++;

    examples.push({ dir, slug, camelCaseName });
  }

  // Generate examples.ts
  if (examples.length > 0) {
    const examplesContent = generateExamplesContent(examples);
    const examplesPath = path.join(__dirname, "examples.ts");
    await fs.writeFile(examplesPath, examplesContent, "utf-8");
    console.log(`\n✅ Generated: examples.ts with ${examples.length} exports`);
  }

  console.log(`\n✨ Build complete!`);
  console.log(`   Generated: ${generated}`);
  console.log(`   Skipped: ${skipped}`);
}

// Run the build. This MUST be awaited at the top level: under GJS the module's
// synchronous body finishing is what ends the process, so a fire-and-forget
// `buildExamples().catch(...)` was torn down mid-chain — it printed the first
// "Processing directory" line, wrote no index.ts, regenerated no examples.ts,
// and still exited 0. Top-level await keeps module evaluation pending until the
// build is actually done.
try {
  await buildExamples();
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}
