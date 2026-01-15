export type ContextStaleness = 'fresh' | 'recent' | 'stale' | 'outdated';

export type CompressionLevel = 'full' | 'standard' | 'compact' | 'minimal';

export type ContextUpdateType =
  | 'document_change'
  | 'cursor_move'
  | 'document_switch'
  | 'outline_update'
  | 'character_update'
  | 'document_reorder'
  | 'force_refresh';

export interface AIContextSnapshot {
  id: string;
  projectId: string;
  documentId: string | null;
  version: number;
  createdAt: Date;
  lastUpdatedAt: Date;
  staleness: ContextStaleness;

  activeOutlineNodeIds: string[];
  activeCharacterIds: string[];

  projectSummary: string | null;
  documentSummary: string | null;
  sectionSummaries: SectionSummary[];

  characterPresenceMap: CharacterPresenceMap;
  outlineAlignmentMap: OutlineAlignmentMap;
  recentEdits: RecentEdit[];
  narrativeProgression: NarrativeMarker[];

  tokenEstimate: number;
  compressionLevel: CompressionLevel;
}

export interface SectionSummary {
  sectionId: string;
  documentId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  characterIds: string[];
  outlineNodeIds: string[];
  wordCount: number;
  updatedAt: Date;
}

export interface CharacterPresenceMap {
  [characterId: string]: {
    documentIds: string[];
    sectionIds: string[];
    totalMentions: number;
    lastMentionPosition: number;
  };
}

export interface OutlineAlignmentMap {
  [outlineNodeId: string]: {
    documentId: string;
    sectionIds: string[];
    implementationStatus: 'not_started' | 'partial' | 'complete';
    wordCount: number;
  };
}

export interface RecentEdit {
  documentId: string;
  sectionId: string | null;
  position: number;
  timestamp: Date;
  changeType: 'insert' | 'delete' | 'replace';
  textSnippet: string;
}

export interface NarrativeMarker {
  documentId: string;
  position: number;
  markerType: 'scene_break' | 'chapter_start' | 'pov_shift' | 'timeline_jump';
  label: string;
}

export interface ContextUpdateEvent {
  type: ContextUpdateType;
  payload: unknown;
  timestamp: Date;
  priority: 'high' | 'normal' | 'low';
}
