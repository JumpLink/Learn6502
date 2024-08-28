import { renderSSR } from 'nano-jsx/esm/index.js'
import Content from './example.mdx'
import { components } from './compontents.jsx'

console.log("Output:", renderSSR(<Content components={components} />))