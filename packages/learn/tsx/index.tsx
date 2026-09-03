import { renderSSR } from "nano-jsx/esm/index.js";
import Tutorial from "../tutorial.mdx";
import QuickHelp from "../quick-help.mdx";
import { GtkComponents, GtkRoot } from "./components/gtk/index.tsx";
import { HtmlComponents, HtmlRoot } from "./components/html/index.tsx";
import { components as NsComponents, generateNativeScriptXml, NsRoot } from "./components/nativescript/index.tsx";
import { writeFile } from "node:fs/promises";
import { withSourceFileContext } from "./utils.ts";

// A failed write is not recoverable here and must not be swallowed: the build
// would exit 0 having left the previous run's artifact in place, and everything
// downstream — the check, and `xgettext` reading `dist/*.ui` — would then pass
// over output that no longer matches the source.

async function generateGtkUiXml(fileName: string, component: string) {
  const output = `<?xml version="1.0" encoding="UTF-8"?>` + component;
  await writeFile(`dist/${fileName}.ui`, output, "utf-8");
  console.log(`Output saved to ${fileName}.ui`);
}

async function saveNativeScriptXml(fileName: string, component: string) {
  await writeFile(`dist/${fileName}.ns.xml`, component, "utf-8");
  console.log(`Output saved to ${fileName}.ns.xml`);
}

async function generateHtml(fileName: string, component: string) {
  await writeFile(`dist/${fileName}.html`, component, "utf-8");
  console.log(`Output saved to ${fileName}.html`);
}

// Generate GTK UI files
await generateGtkUiXml(
  "tutorial",
  withSourceFileContext("packages/learn/tutorial.mdx", () =>
    renderSSR(
      <GtkRoot class="TutorialView">
        <Tutorial components={GtkComponents} />
      </GtkRoot>
    )
  )
);
await generateGtkUiXml(
  "quick-help",
  withSourceFileContext("packages/learn/quick-help.mdx", () =>
    renderSSR(
      <GtkRoot class="QuickHelpView">
        <QuickHelp components={GtkComponents} />
      </GtkRoot>
    )
  )
);

// Generate NativeScript XML files
const tutorialXml = generateNativeScriptXml(
  <NsRoot>
    <Tutorial components={NsComponents} />
  </NsRoot>
);
await saveNativeScriptXml("tutorial", tutorialXml);

const quickHelpXml = generateNativeScriptXml(
  <NsRoot>
    <QuickHelp components={NsComponents} />
  </NsRoot>
);
await saveNativeScriptXml("quick-help", quickHelpXml);

// Generate HTML files
await generateHtml(
  "tutorial",
  withSourceFileContext("packages/learn/tutorial.mdx", () =>
    renderSSR(
      <HtmlRoot class="TutorialView">
        <Tutorial components={HtmlComponents} />
      </HtmlRoot>
    )
  )
);
await generateHtml(
  "quick-help",
  withSourceFileContext("packages/learn/quick-help.mdx", () =>
    renderSSR(
      <HtmlRoot class="QuickHelpView">
        <QuickHelp components={HtmlComponents} />
      </HtmlRoot>
    )
  )
);