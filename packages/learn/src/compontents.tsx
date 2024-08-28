import type { MDXComponents } from 'mdx/types'

export const components: MDXComponents = {
    h1(properties) {
      return <h2 {...properties} />
    }
}