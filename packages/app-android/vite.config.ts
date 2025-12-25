import { defineConfig, mergeConfig, UserConfig, Plugin } from "vite";
import type { Plugin as RollupPlugin } from "rollup";
import { typescriptConfig } from "@nativescript/vite/configuration/typescript";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

/**
 * Plugin to fix CommonJS import issues with shorthash and sprintf-js
 * These modules are used by @nativescript/localize but have CommonJS export issues
 * The modules use exports.unique, exports.sprintf, etc. but need to be transformed to ESM
 */
function fixCommonJSImports(): Plugin & RollupPlugin {
  const workspaceRoot = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../.."
  );

  return {
    name: "fix-commonjs-imports",
    enforce: "pre",
    resolveId(id, importer) {
      // Create virtual modules for these CommonJS packages
      // Only do this for @nativescript/localize, so that the virtual module can itself
      // `require("shorthash")` without recursively resolving back to itself.
      if (id === "shorthash" && importer?.includes("@nativescript/localize")) {
        console.log(
          `[fix-commonjs-imports] Resolving virtual module: ${id} from ${importer?.substring(importer.length - 50)}`
        );
        return "\0virtual:shorthash";
      }
      if (id === "sprintf-js" && importer?.includes("@nativescript/localize")) {
        console.log(
          `[fix-commonjs-imports] Resolving virtual module: ${id} from ${importer?.substring(importer.length - 50)}`
        );
        return "\0virtual:sprintf-js";
      }
      return null;
    },
    load(id) {
      // Load virtual modules with proper ESM exports
      if (id === "\0virtual:shorthash") {
        console.log(`[fix-commonjs-imports] Loading virtual shorthash module`);
        // Use package resolution (no absolute build-machine paths in the output bundle)
        return `
const shorthashModule = require('shorthash');
export const unique = shorthashModule.unique;
export const bitwise = shorthashModule.bitwise;
export const binaryTransfer = shorthashModule.binaryTransfer;
export const random = shorthashModule.random;
`;
      }
      if (id === "\0virtual:sprintf-js") {
        console.log(`[fix-commonjs-imports] Loading virtual sprintf-js module`);
        // Use package resolution (no absolute build-machine paths in the output bundle)
        return `
const sprintfModule = require('sprintf-js');
export const sprintf = sprintfModule.sprintf;
export const vsprintf = sprintfModule.vsprintf;
`;
      }
      return null;
    },
    // Transform the final bundle after all modules have been bundled
    renderChunk(code, chunk) {
      let transformed = code;
      let changed = false;

      // Add error logging without interfering with NativeScript's require
      // This helps us debug where errors occur without breaking module resolution
      if (chunk.fileName === "bundle.mjs") {
        const errorLogger = `
// Enhanced error logging for debugging (does NOT override global.require)
(function() {
  function __nsWriteDebug(msg) {
    try {
      // We can't rely on console output always making it into logcat on every device/CI setup,
      // so also persist a minimal trace file we can read via adb shell run-as.
      const line = String(Date.now()) + " " + String(msg) + "\\n";

      // Best-effort: emit to Android logcat early (works even if file I/O is restricted).
      try {
        const a = (typeof android !== "undefined" ? android : (globalThis && globalThis.android));
        const Log = a && a.util && a.util.Log;
        if (Log && typeof Log.e === "function") {
          Log.e("NS-BUNDLE", line);
        }
      } catch (_) {
        // ignore
      }

      // First preference: Java FileWriter (fast, no framework imports)
      try {
        const path = "/data/data/eu.jumplink.Learn6502/files/ns-bundle-debug.log";
        const j = (typeof java !== "undefined" ? java : (globalThis && globalThis.java));
        const FileWriter = j && j.io && j.io.FileWriter;
        if (FileWriter) {
          const fw = new FileWriter(path, true);
          fw.write(line);
          fw.close();
          return;
        }
      } catch (_) {
        // ignore
      }

      // Fallback: NativeScript file-system (if available)
      try {
        const req = (typeof global !== "undefined" && typeof global.require === "function")
          ? global.require
          : (typeof require === "function" ? require : null);
        if (!req) return;
        const fs = req("@nativescript/core/file-system");
        if (!fs || !fs.knownFolders) return;
        const file = fs.knownFolders.documents().getFile("ns-bundle-debug.log");
        file.writeTextSync((file.readTextSync() || "") + line);
      } catch (_) {
        // ignore
      }
    } catch (_) {
      // ignore
    }
  }

  __nsWriteDebug("[bundle] start");
  try { globalThis.__nsWriteDebug = __nsWriteDebug; } catch (_) {}

  // Wrap NativeScript's global require to log which module id triggers the crash.
  // The stack trace consistently points to require(:1:266) without exposing the requested spec.
  try {
    const g = globalThis;
    const orig = (g && typeof g.require === "function") ? g.require : null;
    if (g && orig) {
      g.require = function(id) {
        try { __nsWriteDebug("[bundle] require -> " + String(id)); } catch (_) {}
        try {
          return orig.apply(this, arguments);
        } catch (e) {
          try { __nsWriteDebug("[bundle] require threw (" + String(id) + "): " + (e && (e.message || e))); } catch (_) {}
          try { __nsWriteDebug("[bundle] require stack: " + (e && e.stack)); } catch (_) {}
          throw e;
        }
      };
      __nsWriteDebug("[bundle] require wrapped");
    } else {
      __nsWriteDebug("[bundle] require not found");
    }
  } catch (_) {
    try { __nsWriteDebug("[bundle] require wrap failed"); } catch (_) {}
  }

  const originalConsoleError = console.error;

  // Enhance console.error to log to our debug endpoint
  console.error = function(...args) {
    originalConsoleError.apply(console, args);
    try {
      const errorMsg = args.map(a => {
        if (a instanceof Error) {
          return a.message + "\\n" + (a.stack || "");
        }
        return String(a);
      }).join(" ");

      fetch("http://127.0.0.1:7244/ingest/41150664-124c-4aae-bb78-92045de202c0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: "console.error",
          message: "Console error",
          data: { error: errorMsg, args: args.map(a => String(a)) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    } catch(e) {
      // Silently fail if logging fails
    }
  };

  __nsWriteDebug("[bundle] console.error wrapped");

  // Hook NativeScript's uncaught error callbacks early (Application may overwrite later).
  try {
    if (typeof global !== "undefined") {
      global.__onUncaughtError = function(err) {
        try { __nsWriteDebug("[uncaught] " + (err && (err.message || err))); } catch (_) {}
        try { __nsWriteDebug("[uncaught-stack] " + (err && err.stack)); } catch (_) {}
      };
      global.__onDiscardedError = function(err) {
        try { __nsWriteDebug("[discarded] " + (err && (err.message || err))); } catch (_) {}
        try { __nsWriteDebug("[discarded-stack] " + (err && err.stack)); } catch (_) {}
      };
    }
  } catch (_) {}

  __nsWriteDebug("[bundle] ns error hooks installed");

  // Add unhandled promise rejection handler (only if supported by the runtime)
  // NativeScript's global object doesn't implement addEventListener, so guard it.
  const g = (typeof globalThis !== "undefined" ? globalThis : (typeof global !== "undefined" ? global : undefined));
  if (g && typeof g.addEventListener === "function") {
    g.addEventListener("unhandledrejection", function(event) {
      console.error("UNHANDLED PROMISE REJECTION:", event && event.reason);
    });
  }

  __nsWriteDebug("[bundle] logger ready");
})();

`;
        transformed = errorLogger + transformed;
        changed = true;
        console.log(`[fix-commonjs-imports] Added error logging to bundle`);
      }

      // Instrument Vite's dynamic-require fallback so we can see which module id triggers the crash.
      // The startup stack trace currently points to `require(:1:266)` with no JS-side message.
      if (chunk.fileName === "bundle.mjs") {
        const dynReqNeedle =
          "throw Error('Dynamic require of \"' + x3 + '\" is not supported');";
        if (transformed.includes(dynReqNeedle)) {
          transformed = transformed.replace(
            dynReqNeedle,
            `try { globalThis.__nsWriteDebug && globalThis.__nsWriteDebug("[bundle] dynamic require blocked: " + x3); } catch (_) {}\n${dynReqNeedle}`
          );
          changed = true;
          console.log(
            `[fix-commonjs-imports] Instrumented dynamic require fallback`
          );
        }
      }

      // Avoid calling legacy NativeScript `require("@nativescript/core")` during early module evaluation.
      // In Vite-bundled mode, the classic require base `app/tns_modules/` is not present, and this call
      // triggers a NativeScriptException that appears to abort module evaluation even if caught.
      if (chunk.fileName === "bundle.mjs") {
        const legacyCoreRequire =
          'const core = g3.require ? g3.require("@nativescript/core") : null;';
        if (transformed.includes(legacyCoreRequire)) {
          transformed = transformed.replace(
            legacyCoreRequire,
            `const _req = g3.__nsVendorRequire || g3.__nsRequire;\n    const core = _req ? _req(\"@nativescript/core\") : null;`
          );
          changed = true;
          console.log(
            `[fix-commonjs-imports] Avoided legacy require("@nativescript/core") in getDocumentsPath`
          );
        }
      }

      // NativeScript's Vite HMR bootstrap expects `WebSocket` to exist.
      // In NativeScript this is not available by default, so the bundle can crash during module evaluation.
      // We guard the HMR startup and (optionally) attempt to install a WebSocket polyfill.
      if (chunk.fileName === "bundle.mjs") {
        const hmrStartPattern = /startViteHMR\(\{\s*wsUrl:\s*(".*?")\s*\}\);/;
        if (hmrStartPattern.test(transformed)) {
          transformed = transformed.replace(hmrStartPattern, (_m, wsUrl) => {
            return `
try {
  try { globalThis.__nsWriteDebug && globalThis.__nsWriteDebug("[bundle] HMR bootstrap begin"); } catch {}
  if (typeof WebSocket === "undefined") {
    try {
      // @valor/nativescript-websockets installs global.WebSocket as a side-effect
      __require("@valor/nativescript-websockets");
    } catch (_e) {
      // ignore
    }
  }
  if (typeof WebSocket !== "undefined") {
    try { globalThis.__nsWriteDebug && globalThis.__nsWriteDebug("[bundle] HMR startViteHMR"); } catch {}
    startViteHMR({ wsUrl: ${wsUrl} });
  } else {
    try { globalThis.__nsWriteDebug && globalThis.__nsWriteDebug("[bundle] HMR disabled: WebSocket missing"); } catch {}
    try { console.warn("[ns-entry] HMR disabled: WebSocket is not available"); } catch {}
  }
} catch (e) {
  try { globalThis.__nsWriteDebug && globalThis.__nsWriteDebug("[bundle] HMR exception: " + (e && (e.message || e))); } catch {}
  try { console.warn("[ns-entry] HMR bootstrap failed; continuing without HMR:", e && (e.message || e)); } catch {}
}
`;
          });
          changed = true;
          console.log(
            `[fix-commonjs-imports] Guarded Vite HMR startup (WebSocket polyfill)`
          );
        }
      }

      // Add high-signal execution markers around the NativeScript bootstrap & entry calls.
      // This lets us pinpoint the first failing top-level statement that leads to:
      // "Module evaluation promise rejected: .../bundle.mjs"
      if (chunk.fileName === "bundle.mjs") {
        // Mark bootstrap stages
        transformed = transformed.replace(
          "installVendorBootstrap(vendorManifest, __nsVendorModuleMap);",
          `try { globalThis.__nsWriteDebug && globalThis.__nsWriteDebug("[bundle] installVendorBootstrap"); } catch (_) {}\ninstallVendorBootstrap(vendorManifest, __nsVendorModuleMap);`
        );
        transformed = transformed.replace(
          "installCoreAliasesEarly(__nsVerboseLog);",
          `try { globalThis.__nsWriteDebug && globalThis.__nsWriteDebug("[bundle] installCoreAliasesEarly"); } catch (_) {}\ninstallCoreAliasesEarly(__nsVerboseLog);`
        );
        transformed = transformed.replace(
          "installRootPlaceholder(__nsVerboseLog);",
          `try { globalThis.__nsWriteDebug && globalThis.__nsWriteDebug("[bundle] installRootPlaceholder"); } catch (_) {}\ninstallRootPlaceholder(__nsVerboseLog);`
        );

        // Wrap the HTTP boot promise so any rejection is handled and logged
        const httpBootNeedle =
          'startHttpOnlyBoot("android", "/app/app.ts", "192.168.178.161", __nsVerboseLog);';
        if (transformed.includes(httpBootNeedle)) {
          transformed = transformed.replace(
            httpBootNeedle,
            `try { globalThis.__nsWriteDebug && globalThis.__nsWriteDebug("[bundle] startHttpOnlyBoot invoke"); } catch (_) {}\nPromise.resolve(startHttpOnlyBoot("android", "/app/app.ts", "192.168.178.161", __nsVerboseLog)).catch((e) => {\n  try { console.error("[ns-entry] startHttpOnlyBoot rejected:", e); } catch (_) {}\n  try { globalThis.__nsWriteDebug && globalThis.__nsWriteDebug("[bundle] startHttpOnlyBoot rejected: " + (e && (e.message || e))); } catch (_) {}\n});`
          );
        }
      }

      // Guard against clobbering NativeScript's `require`.
      // The generated bundle currently overwrites `globalThis.require` with a stub, which can break
      // NativeScript's module loader and lead to "Module evaluation promise rejected".
      if (chunk.fileName === "bundle.mjs") {
        const requireClobberNeedle = `const __nsVerboseLog = false;
try {
  if (typeof globalThis !== "undefined") {`;
        if (transformed.includes(requireClobberNeedle)) {
          transformed = transformed.replace(
            requireClobberNeedle,
            `const __nsVerboseLog = false;
try {
  if (typeof globalThis !== "undefined" && typeof globalThis.require === "undefined") {`
          );
          changed = true;
          console.log(
            `[fix-commonjs-imports] Prevented require() clobbering in bundle`
          );
        }
      }

      // Fix shorthash usage - transform shorthash.unique(...) to safely access exports
      // Try multiple access patterns to handle different __toESM wrapping scenarios
      const shorthashPattern =
        /shorthash\.(unique|bitwise|binaryTransfer|random)\s*\(/g;
      if (shorthashPattern.test(code)) {
        transformed = transformed.replace(
          shorthashPattern,
          "(shorthash.default ? shorthash.default.$1 : shorthash.$1)("
        );
        changed = true;
        console.log(`[fix-commonjs-imports] Fixed shorthash usage in bundle`);
      }

      // Fix sprintf-js usage - transform import_sprintf_js.vsprintf(...) to safely access exports
      const sprintfPattern = /import_sprintf_js\.(sprintf|vsprintf)\s*\(/g;
      if (sprintfPattern.test(code)) {
        transformed = transformed.replace(
          sprintfPattern,
          "(import_sprintf_js.default ? import_sprintf_js.default.$1 : import_sprintf_js.$1)("
        );
        changed = true;
        console.log(`[fix-commonjs-imports] Fixed sprintf-js usage in bundle`);
      }

      // Also fix: (0, import_sprintf_js.vsprintf)
      const sprintfCallPattern =
        /\(0,\s*import_sprintf_js\.(sprintf|vsprintf)\)/g;
      if (sprintfCallPattern.test(code)) {
        transformed = transformed.replace(
          sprintfCallPattern,
          "(0, (import_sprintf_js.default ? import_sprintf_js.default.$1 : import_sprintf_js.$1))"
        );
        changed = true;
        console.log(
          `[fix-commonjs-imports] Fixed sprintf-js call pattern in bundle`
        );
      }

      if (changed) {
        return {
          code: transformed,
          map: null,
        };
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
        // For CommonJS modules with named exports (exports.unique, exports.vsprintf),
        // use "auto" to let Vite decide, but ensure named exports are preserved
        requireReturnsDefault: "auto",
        // Create default export wrapper but preserve named exports
        defaultIsModuleExports: true,
        // Ensure ESM interop - don't externalize these modules
        esmExternals: false,
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
          // Don't externalize @valor/nativescript-websockets - it needs to be bundled
          return false;
        },
      },
    },
    // Disable HMR for better stability
    server: {
      hmr: false,
    },
  });
});
