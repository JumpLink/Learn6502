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
  /** Example license */
  license: "CC-BY-4.0"; // Currently only CC-BY-4.0 is supported
  /** Source code URL */
  sourceUrl?: string;
  /** GitHub username */
  githubUsername?: string;
}

export interface ExampleMeta extends ExampleMetaJson {
  /** Example code */
  code: string;
}
