import { renderSSR } from 'nano-jsx/esm/index.js'
import Tutorial from './tutorial.mdx'
import { GtkComponents, GtkRoot } from './components/gtk/index.tsx'
// import * as HtmlComponents from './components/html/index.tsx'
import { writeFile } from 'node:fs/promises'

async function generateGtkUiXml() {
  const output = `<?xml version="1.0" encoding="UTF-8"?>` + renderSSR(<GtkRoot class="Tutorial"><Tutorial components={GtkComponents}/></GtkRoot>)

  try {
    await writeFile('dist/tutorial.ui', output, 'utf-8')
    console.log("Output saved to tutorial.ui", output)
  } catch (error) {
    console.error("Error saving file:", error)
  }
}

async function generateHtml() {
  const output = renderSSR(<Tutorial/>)
  try {
    await writeFile('dist/tutorial.html', output, 'utf-8')
    console.log("Output saved to tutorial.html")
  } catch (error) {
    console.error("Error saving file:", error)
  }
}

await generateGtkUiXml()
await generateHtml()