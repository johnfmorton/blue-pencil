import type { EditorState } from 'prosemirror-state';

export interface EditorStateContainer {
  documentId: string;
  editorState: EditorState;
  isDirty: boolean;
  lastSavedAt: Date | null;
  pendingChanges: DocumentDelta[];
}

export interface DocumentDelta {
  id: string;
  documentId: string;
  timestamp: Date;
  steps: SerializedStep[];
  beforeSelection: SerializedSelection;
  afterSelection: SerializedSelection;
}

export interface SerializedStep {
  type: string;
  from?: number;
  to?: number;
  slice?: unknown;
}

export interface SerializedSelection {
  anchor: number;
  head: number;
}

export interface EditorUIState {
  activeDocumentId: string | null;
  isSidebarOpen: boolean;
  activeSidebarTab: 'ai-editor' | 'ai-coach' | 'outline' | 'characters';
  isFullscreen: boolean;
  zoom: number;
  showWordCount: boolean;
  focusMode: boolean;
}

export interface EditorConfig {
  autoSave: boolean;
  autoSaveDelay: number;
  spellCheck: boolean;
  grammarCheck: boolean;
  typewriterMode: boolean;
  darkMode: boolean;
}
