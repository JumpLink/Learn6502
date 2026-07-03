// `*.css` imports resolve to a JS string default export — via gjsify's
// css-as-string (`gjsify build --app browser`) and, in Vite dev, the
// `gjsifyBrowser({ cssAsString: true })` preset. Same author-once pattern the
// native app-gnome uses for its `.css` files. Ambient (non-module) file so
// `declare module "*.css"` is global.
declare module "*.css" {
  const content: string;
  export default content;
}
