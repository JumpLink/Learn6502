# vite-plugin-blueprint

A Vite plugin for compiling Blueprint UI files (`.blp`) to XML and importing them as strings in your JavaScript/TypeScript code.

## Features

- Automatically compiles `.blp` files to XML when imported
- Optionally minifies the generated XML
- Seamlessly integrates with your Vite build process

## Installation

```bash
npm install @learn6502/vite-plugin-blueprint --save-dev
```

or if you use Yarn:

```bash
yarn add @learn6502/vite-plugin-blueprint -D
```

## Usage

Add the plugin to your Vite configuration:

```javascript
// vite.config.js / vite.config.ts
import { defineConfig } from 'vite';
import blueprintPlugin from '@learn6502/vite-plugin-blueprint';

export default defineConfig({
  plugins: [
    blueprintPlugin({
      minify: true // optional, defaults to false
    })
  ],
  // ... other configurations
});
```

Then, you can import `.blp` files directly in your code:

```javascript
import myUIXML from './path/to/my-ui.blp';
console.log(myUIXML); // This will log the compiled XML content as a string
```

### TypeScript

To use the plugin with TypeScript, you need to declare the module for `.blp` files in a `.d.ts` file:

```typescript
declare module '*.blp' {
  const content: string
  export default content
}
```

Then, you can import `.blp` files in your TypeScript code:

```typescript
import myUIXML from './path/to/my-ui.blp';
console.log(myUIXML); // This will log the compiled XML content as a string
```

## Options

The plugin accepts an options object with the following properties:

- `minify` (boolean, optional): If set to `true`, the plugin will minify the generated XML. Default is `false`.

## Requirements

- Vite 2.x or higher
- Node.js 12.x or higher
- `blueprint-compiler` must be installed and available in your system's PATH

## How it Works

1. When a `.blp` file is imported, the plugin intercepts the import.
2. It runs the `blueprint-compiler` to compile the `.blp` file to XML.
3. If minification is enabled, the XML is minified.
4. The resulting XML is returned as a string, which can be used in your JavaScript/TypeScript code.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.