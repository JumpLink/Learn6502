export interface SourceViewEventMap {
  changed: SourceViewChangedEvent;
  copy: SourceViewCopyEvent;
}

export interface SourceViewChangedEvent {
  code: string;
}

export interface SourceViewCopyEvent {
  code: string;
}
