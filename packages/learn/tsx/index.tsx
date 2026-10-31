import { renderSSR } from "nano-jsx/esm/index.js";
import Tutorial from "../tutorial.mdx";
import QuickHelp from "../quick-help.mdx";
import { GtkComponents, GtkRoot } from "./components/gtk/index.tsx";
import { assertBlueprintMatchesUi, uiToBlueprint } from "./ui-to-blueprint.ts";
import { writeFile } from "node:fs/promises";
import { withSourceFileContext } from "./utils.ts";

/**
 * The MDX documents, and the view class each one becomes a template for.
 *
 * One artifact per document, not three: GNOME, web and Android all import the
 * `.blp` and let `@gjsify/vite-plugin-blueprint` compile it, so the per-target
 * renderers this package used to carry are gone. `tsx/components/gtk` stays
 * because the GtkBuilder XML it produces is still the intermediate the
 * blueprint is derived from — see `tsx/ui-to-blueprint.ts` for why the
 * conversion goes through XML rather than emitting blueprint directly.
 */
const DOCUMENTS = [
  { name: "tutorial", view: "TutorialView", source: "packages/learn/tutorial.mdx", Document: Tutorial },
  { name: "quick-help", view: "QuickHelpView", source: "packages/learn/quick-help.mdx", Document: QuickHelp },
];

// A failed write is not recoverable here and must not be swallowed: the build
// would exit 0 having left the previous run's artifact in place, and everything
// downstream — the check, and `xgettext` reading `dist/*.blp` — would then pass
// over output that no longer matches the source.
for (const { name, view, source, Document } of DOCUMENTS) {
  const ui = withSourceFileContext(source, () =>
    renderSSR(
      <GtkRoot class={view}>
        <Document components={GtkComponents} />
      </GtkRoot>
    )
  );
  const blueprint = uiToBlueprint(ui);
  assertBlueprintMatchesUi(ui, blueprint, `${name}.blp`);
  await writeFile(`dist/${name}.blp`, blueprint, "utf-8");
  console.log(`Output saved to ${name}.blp`);
}