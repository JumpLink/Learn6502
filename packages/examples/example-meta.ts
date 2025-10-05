export interface ExampleMetaJson {
  /** Example slug */
  slug: string;
  /** Example title */
  title: string;
  /** Example description */
  description: string;
  /** Example author */
  author: string;
  /** Memory snapshot to display in the example list item */
  displayMemory: string;
  /** Source code URL */
  sourceUrl?: string;
  /** GitHub username */
  githubUsername?: string;
}

export interface ExampleMeta extends ExampleMetaJson {
  /** Example code */
  code: string;
}
