/**
 * Common interface for Editor component across platforms
 */
export interface EditorInterface {
  /**
   * The source code in the editor
   */
  code: string;

  /**
   * Whether the editor has any code
   */
  readonly hasCode: boolean;
}
