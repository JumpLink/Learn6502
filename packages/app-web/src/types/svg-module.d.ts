// `*.svg` is a text loader (package.json#gjsify.loaders): the SVG source as a string, for `registerIcon`.
declare module "*.svg" {
  const content: string;
  export default content;
}
