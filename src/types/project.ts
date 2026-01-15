export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
}

export interface ProjectSettings {
  defaultAIModel: string;
  autoSaveInterval: number;
  contextUpdateDebounce: number;
}

export interface Document {
  id: string;
  projectId: string;
  title: string;
  content: DocumentContent;
  sortOrder: number;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  lastCursorPosition: CursorPosition | null;
}

export interface DocumentContent {
  type: 'doc';
  content: ProseMirrorNode[];
}

export interface ProseMirrorNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: ProseMirrorNode[];
  marks?: Mark[];
  text?: string;
}

export interface Mark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface CursorPosition {
  anchor: number;
  head: number;
  documentId: string;
  timestamp: Date;
}

export interface Section {
  id: string;
  documentId: string;
  title: string;
  startPosition: number;
  endPosition: number;
  summary: string | null;
  summaryUpdatedAt: Date | null;
  characterIds: string[];
}
