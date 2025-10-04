export interface ExampleMetaJson {
  title: string;
  description: string;
  author: string;
  displayMemory: string;
}

export interface ExampleMeta extends ExampleMetaJson {
  code: string;
}
