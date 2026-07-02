// Workaround (spike finding, feeds gjsify ADR 0004): @gjsify/adwaita-fonts
// declares `"types": "./index.d.ts"` in its exports map but does not ship that
// file (its entry point is CSS, fontsource-style). Declare the module so the
// side-effect import in @gjsify/adwaita-web's declarations type-checks.
// Remove once the gjsify-side packaging is fixed.
declare module "@gjsify/adwaita-fonts";
