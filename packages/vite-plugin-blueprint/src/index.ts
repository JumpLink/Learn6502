import { type Plugin } from "vite";
import { execa } from "execa";
import minifyXML from "minify-xml";

export interface BlueprintPluginOptions {
  minify?: boolean;
  verbose?: boolean;
}

export default function blueprintPlugin(
  options: BlueprintPluginOptions = {}
): Plugin {
  const { minify = false, verbose = false } = options;

  return {
    name: "vite-plugin-blueprint",

    async load(id) {
      if (id.endsWith(".blp")) {
        try {
          // Compile .blp file and get XML output directly
          const { stdout } = await execa("blueprint-compiler", ["compile", id]);
          if (verbose) console.log(`Compiled ${id}`);

          let xmlContent = stdout;

          // Minify XML if option is enabled
          if (minify) {
            xmlContent = minifyXML(xmlContent);
            if (verbose) console.log(`Minified XML for ${id}`);
          }

          // Return the XML content as a string
          return `export default ${JSON.stringify(xmlContent)};`;
        } catch (error) {
          console.error(`Error processing ${id}:`, error);
          throw error;
        }
      }
    },
  };
}
