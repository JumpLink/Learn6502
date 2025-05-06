/**
 * Common interface for SourceView component across platforms
 */
export interface SourceViewInterface {
  /**
   * The source code in the view
   */
  code: string;

  /**
   * Whether to show line numbers
   */
  lineNumbers?: boolean;

  /**
   * Whether the source view is editable
   */
  editable?: boolean;

  /**
   * Whether the source view is read-only
   */
  readonly?: boolean;
}
