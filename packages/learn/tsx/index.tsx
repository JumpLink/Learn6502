import { renderSSR } from 'nano-jsx/esm/index.js'
import Tutorial from '../tutorial.mdx'
import QuickHelp from '../quick-help.mdx'
import { GtkComponents, GtkRoot } from './components/gtk/index.tsx'
// import * as HtmlComponents from './components/html/index.tsx'
import { components as NsComponents, generateNativeScriptXml } from './components/nativescript/index.tsx'
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

async function saveNativeScriptXml(fileName: string, component: string) {
  try {
    await writeFile(`dist/${fileName}.ns.xml`, component, 'utf-8')
    console.log(`Output saved to ${fileName}.ns.xml`)
  } catch (error) {
    console.error("Error saving NativeScript XML file:", error)
  }
}

async function generateHtml(fileName: string, component: string) {
  try {
    await writeFile(`dist/${fileName}.html`, component, 'utf-8')
    console.log(`Output saved to ${fileName}.html`)
  } catch (error) {
    console.error("Error saving file:", error)
  }
}

// Generate GTK UI files
await generateGtkUiXml('tutorial', renderSSR(<GtkRoot class="Tutorial"><Tutorial components={GtkComponents}/></GtkRoot>))
await generateGtkUiXml('quick-help', renderSSR(<GtkRoot class="QuickHelp"><QuickHelp components={GtkComponents}/></GtkRoot>))

// Generate NativeScript XML files
const tutorialXml = generateNativeScriptXml(<Tutorial components={NsComponents}/>)
await saveNativeScriptXml('tutorial', tutorialXml)

const quickHelpXml = generateNativeScriptXml(<QuickHelp components={NsComponents}/>)
await saveNativeScriptXml('quick-help', quickHelpXml)

// Generate HTML files
await generateHtml('tutorial', renderSSR(<Tutorial/>))
await generateHtml('quick-help', renderSSR(<QuickHelp/>))