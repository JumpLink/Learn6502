import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert a slug to camelCase
 * @param slug - The slug to convert (e.g., "commented-snake")
 * @returns The camelCase version (e.g., "commentedSnake")
 */
function slugToCamelCase(slug: string): string {
  return slug.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
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
        entry.isDirectory() &&
        !entry.name.startsWith(".") &&
        entry.name !== "node_modules" &&
        entry.name !== "dist"
    )
    .map((entry) => entry.name);
  return directories;
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
function generateIndexContent(
  slug: string,
  asmFile: string,
  metaFile: string
): string {
  const camelCaseName = slugToCamelCase(slug);
  return `import { default as ${camelCaseName}Code } from "./${asmFile}?raw";
import ${camelCaseName}Meta from "./${metaFile}";
import type { ExampleMeta } from "../example-meta.ts";
const ${camelCaseName}: ExampleMeta = { ...${camelCaseName}Meta, code: ${camelCaseName}Code };
export { ${camelCaseName} };
`;
}

/**
 * Generate the examples.ts content that exports all examples
 * @param examples - Array of example information
 * @returns The examples.ts content
 */
function generateExamplesContent(
  examples: Array<{ dir: string; slug: string }>
): string {
  const exports = examples
    .map(({ dir }) => `export * from "./${dir}";`)
    .join("\n");
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

// Run the build
buildExamples().catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});
