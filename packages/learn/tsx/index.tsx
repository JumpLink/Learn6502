import { renderSSR } from 'nano-jsx/esm/index.js'
import Tutorial from '../tutorial.mdx'
import QuickHelp from '../quick-help.mdx'
import { GtkComponents, GtkRoot } from './components/gtk/index.tsx'
// import * as HtmlComponents from './components/html/index.tsx'
import { writeFile } from 'node:fs/promises'

async function generateGtkUiXml(fileName: string, component: string) {
  const output = `<?xml version="1.0" encoding="UTF-8"?>` + component

  try {
    await writeFile(`dist/${fileName}.ui`, output, 'utf-8')
    console.log(`Output saved to ${fileName}.ui`)
  } catch (error) {
    console.error("Error saving file:", error)
  }
}

async function generateHtml(fileName: string, component: string) {
  const output = renderSSR(<Tutorial/>)
  try {
    await writeFile(`dist/${fileName}.html`, output, 'utf-8')
    console.log(`Output saved to ${fileName}.html`)
  } catch (error) {
    console.error("Error saving file:", error)
  }
}

await generateGtkUiXml('tutorial', renderSSR(<GtkRoot class="Tutorial"><Tutorial components={GtkComponents}/></GtkRoot>))
await generateGtkUiXml('quick-help', renderSSR(<GtkRoot class="QuickHelp"><QuickHelp components={GtkComponents}/></GtkRoot>))
await generateHtml('tutorial', renderSSR(<Tutorial/>))
await generateHtml('quick-help', renderSSR(<QuickHelp/>))