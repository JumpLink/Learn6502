import type { EventDispatcher } from "@learn6502/6502";
import type { SourceViewEventMap } from "../types/source-view-event-map";

/**
 * Common interface for SourceView component across platforms
 */
export interface SourceViewWidget {
  readonly events: EventDispatcher<SourceViewEventMap>;

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
