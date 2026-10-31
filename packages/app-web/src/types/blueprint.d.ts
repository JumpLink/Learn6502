// A Blueprint file as the tree `@gjsify/vite-plugin-blueprint` projects it (`?shared-tree`)
declare module "*.blp?shared-tree" {
  import type { buildWithSiblings } from "@gjsify/adwaita-web";
  const tree: Parameters<typeof buildWithSiblings>[0];
  export default tree;
}
