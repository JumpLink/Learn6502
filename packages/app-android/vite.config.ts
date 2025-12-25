import { defineConfig, mergeConfig, UserConfig, Plugin } from "vite";
import type { Plugin as RollupPlugin } from "rollup";
import { typescriptConfig } from "@nativescript/vite/configuration/typescript";

/**
 * Plugin to fix CommonJS import issues with shorthash and sprintf-js
 * These modules are used by @nativescript/localize but have CommonJS export issues
 */
function fixCommonJSImports(): Plugin {
  return {
    name: "fix-commonjs-imports",
    enforce: "pre",
    resolveId(id) {
      if (id === "shorthash" || id === "sprintf-js") {
        return id;
      }
      return null;
    },
    load(id) {
      // Fix shorthash: CommonJS module uses exports.unique, exports.bitwise, etc.
      if (id === "shorthash") {
        return `
const shorthashModule = require('shorthash/shorthash.js');
export const unique = shorthashModule.unique;
export const bitwise = shorthashModule.bitwise;
export const binaryTransfer = shorthashModule.binaryTransfer;
export const random = shorthashModule.random;
export default shorthashModule;
`;
      }
      // Fix sprintf-js: CommonJS module uses exports.sprintf, exports.vsprintf
      if (id === "sprintf-js") {
        return `
const sprintfModule = require('sprintf-js/src/sprintf.js');
export const sprintf = sprintfModule.sprintf;
export const vsprintf = sprintfModule.vsprintf;
export default sprintfModule;
`;
      }
      return null;
    },
  };
}

/**
 * Plugin to remove manualChunks from output options when inlineDynamicImports is set
 * This is necessary because inlineDynamicImports is incompatible with manualChunks
 */
function removeManualChunks(): RollupPlugin {
  return {
    name: "remove-manual-chunks",
    generateBundle(options, bundle) {
      // This plugin ensures manualChunks is removed before bundle generation
    },
    outputOptions(options) {
      // Remove manualChunks if inlineDynamicImports is set
      if (options.inlineDynamicImports && options.manualChunks) {
        delete options.manualChunks;
      }
      return null;
    },
  };
}

export default defineConfig(({ mode }): UserConfig => {
  const defaultConfig = typescriptConfig({ mode });

  return mergeConfig(defaultConfig, {
    plugins: [fixCommonJSImports(), removeManualChunks()],
    resolve: {
      ...defaultConfig.resolve,
      // Support for Yarn 4 workspaces - preserve symlinks to workspace packages
      preserveSymlinks: true,
    },
    optimizeDeps: {
      ...defaultConfig.optimizeDeps,
      include: [
        ...(defaultConfig.optimizeDeps?.include || []),
        "@learn6502/6502",
        "@learn6502/common-ui",
      ],
    },
    build: {
      ...defaultConfig.build,
      commonjsOptions: {
        ...defaultConfig.build?.commonjsOptions,
        // Ensure CommonJS modules are properly transformed
        include: [
          /shorthash/,
          /sprintf-js/,
          /@nativescript\/localize/,
          ...(Array.isArray(defaultConfig.build?.commonjsOptions?.include)
            ? defaultConfig.build.commonjsOptions.include
            : []),
        ],
        transformMixedEsModules: true,
        // Ensure proper interop for CommonJS modules
        requireReturnsDefault: "auto",
      },
      rollupOptions: {
        ...defaultConfig.build?.rollupOptions,
        // Completely override output to ensure manualChunks is removed
        // inlineDynamicImports is incompatible with manualChunks
        output: (() => {
          const defaultOutput = defaultConfig.build?.rollupOptions?.output;
          // Get base output config without manualChunks
          const getCleanOutput = (output: any) => {
            if (!output) return {};
            const { manualChunks, inlineDynamicImports, ...rest } = output;
            return rest;
          };

          if (Array.isArray(defaultOutput)) {
            return defaultOutput.map((o) => ({
              ...getCleanOutput(o),
              inlineDynamicImports: true,
            }));
          }
          if (defaultOutput) {
            return {
              ...getCleanOutput(defaultOutput),
              inlineDynamicImports: true,
            };
          }
          return {
            inlineDynamicImports: true,
          };
        })(),
        external: (id, importer, isResolved) => {
          // Check if it's already externalized in default config
          const defaultExternal = defaultConfig.build?.rollupOptions?.external;
          if (typeof defaultExternal === "function") {
            if (defaultExternal(id, importer, isResolved)) return true;
          } else if (Array.isArray(defaultExternal)) {
            if (defaultExternal.includes(id)) return true;
          }
          // Externalize @valor/nativescript-websockets
          if (id === "@valor/nativescript-websockets") return true;
          return false;
        },
      },
    },
  });
});
