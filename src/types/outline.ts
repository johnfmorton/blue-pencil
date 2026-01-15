export type OutlineNodeType = 'act' | 'chapter' | 'scene' | 'beat' | 'note';

export type OutlineNodeStatus =
  | 'planned'
  | 'in_progress'
  | 'draft'
  | 'revised'
  | 'complete';

export interface OutlineNode {
  id: string;
  projectId: string;
  parentId: string | null;
  type: OutlineNodeType;
  title: string;
  description: string;
  sortOrder: number;
  linkedDocumentIds: string[];
  linkedSectionIds: string[];
  color: string | null;
  status: OutlineNodeStatus;
  metadata: OutlineNodeMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface OutlineNodeMetadata {
  wordCountTarget?: number;
  pov?: string;
  timeline?: string;
  location?: string;
  tension?: number;
  notes?: string;
}

export interface OutlineTree {
  nodes: Map<string, OutlineNode>;
  rootIds: string[];
  childMap: Map<string, string[]>;
}
