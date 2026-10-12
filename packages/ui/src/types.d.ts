// `*.blp?template` is the template exit of ADR 0096 § 4: the GtkBuilder XML
// string on GJS, an opaque projected tree under `--gi-renderer`.
declare module "*.blp?template" {
  const template: string;
  export default template;
}
declare module "*.lang" {
  const content: string;
  export default content;
}
declare module "*.xml" {
  const content: string;
  export default content;
}
