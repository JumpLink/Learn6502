import { renderSSR } from 'nano-jsx/esm/index.js'
import Tutorial from './tutorial.mdx'
import * as GtkComponents from './components/gtk/index.tsx'
// import * as HtmlComponents from './components/html/index.tsx'
import { GtkRoot } from './components/gtk/index.tsx'
import { writeFile } from 'node:fs/promises'

async function generateGtkUiXml() {
  const output = `<?xml version="1.0" encoding="UTF-8"?>` + renderSSR(<GtkRoot components={GtkComponents}><Tutorial /></GtkRoot>)

  try {
    await writeFile('tutorial.ui', output, 'utf-8')
    console.log("Output saved to tutorial.ui")
  } catch (error) {
    console.error("Error saving file:", error)
  }
}

async function generateHtml() {
  const output = renderSSR(<Tutorial/>)
  try {
    await writeFile('tutorial.html', output, 'utf-8')
    console.log("Output saved to tutorial.html")
  } catch (error) {
    console.error("Error saving file:", error)
  }
}

await generateGtkUiXml()
await generateHtml()