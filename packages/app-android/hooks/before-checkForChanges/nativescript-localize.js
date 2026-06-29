// Registers @nativescript/localize's resource-generation hook. Normally injected
// by `npm install`, but this project uses gjsify-managed node_modules (+ the
// build runs `ns prepare --disable-npm-install`), so the hook is never injected
// and the per-language Android string resources (res/values-*/strings.xml) go
// stale vs app/i18n/*.json. Wiring it here makes `ns prepare` regenerate them.
module.exports = require("@nativescript/localize/hooks/before-checkForChanges.js");
