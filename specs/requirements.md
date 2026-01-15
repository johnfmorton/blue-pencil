# Technical Specifications

## 1. System Architecture

### 1.1 Overview
Blue Pencil is a local-first web application built with:
- **Frontend**: TypeScript + Vite + ProseMirror
- **Storage**: SQLite via OPFS (Origin Private File System)
- **AI**: User-provided API keys for LLM integration

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Blue Pencil App                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Editor    │  │   Outline   │  │   Character Bible       │  │
│  │   View      │  │   View      │  │   Panel                 │  │
│  │ (ProseMirror)│  │  (Tree)    │  │   (Cards)              │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
│         │                │                     │                │
│         └────────────────┼─────────────────────┘                │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │                    State Management                        │  │
│  │         (Projects, Documents, Characters, Outline)         │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │                    Data Access Layer                       │  │
│  │              (CRUD operations, queries)                    │  │
│  └───────────────────────┬───────────────────────────────────┘  │
│                          │                                      │
│  ┌───────────────────────┴───────────────────────────────────┐  │
│  │                 SQLite (via sql.js/wa-sqlite)             │  │
│  │                    OPFS Persistence                        │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 AI Context System                        │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │    │
│  │  │   Context    │  │  Summarizer  │  │   Staleness  │   │    │
│  │  │   Snapshot   │  │   Worker     │  │   Tracker    │   │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    AI Service                            │    │
│  │         (LLM API calls with user-provided key)           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Models

### 2.1 Project
```typescript
interface Project {
  id: string;                    // UUID
  name: string;
  description: string;
  settings: ProjectSettings;
  createdAt: Date;
  updatedAt: Date;
}

interface ProjectSettings {
  defaultAIModel: string;        // e.g., "gpt-4", "claude-3"
  autoSaveInterval: number;      // ms, default 5000
  contextUpdateDebounce: number; // ms, default 500
}
```

### 2.2 Document
```typescript
interface Document {
  id: string;                    // UUID
  projectId: string;             // FK → Project
  title: string;
  content: ProseMirrorJSON;      // Rich text as JSON
  sortOrder: number;
  parentId: string | null;       // For nested documents
  wordCount: number;
  lastCursorPosition: CursorPosition | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CursorPosition {
  anchor: number;
  head: number;
}

type ProseMirrorJSON = {
  type: string;
  content?: ProseMirrorJSON[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  attrs?: Record<string, unknown>;
  text?: string;
};
```

### 2.3 Section
Sections are derived from document structure (headings, scene breaks).

```typescript
interface Section {
  id: string;                    // UUID
  documentId: string;            // FK → Document
  title: string;
  startPosition: number;         // Character offset in document
  endPosition: number;
  summary: string | null;        // AI-generated
  summaryUpdatedAt: Date | null;
  characterIds: string[];        // Characters present in this section
}
```

### 2.4 OutlineNode
```typescript
interface OutlineNode {
  id: string;                    // UUID
  projectId: string;             // FK → Project
  parentId: string | null;       // For hierarchy
  type: OutlineNodeType;
  title: string;
  description: string;
  sortOrder: number;
  status: OutlineStatus;
  linkedDocumentIds: string[];   // Documents this node maps to
  linkedSectionIds: string[];    // Sections this node maps to
  metadata: OutlineMetadata;
  createdAt: Date;
  updatedAt: Date;
}

type OutlineNodeType = 'act' | 'chapter' | 'scene' | 'beat' | 'note';

type OutlineStatus = 'planned' | 'in_progress' | 'draft' | 'revised' | 'complete';

interface OutlineMetadata {
  wordCountTarget?: number;
  pov?: string;                  // Point of view character
  timeline?: string;
  location?: string;
  tension?: number;              // 1-10 pacing indicator
}
```

### 2.5 Character
```typescript
interface Character {
  id: string;                    // UUID
  projectId: string;             // FK → Project
  name: string;
  aliases: string[];             // Nicknames, titles, alternate names
  role: CharacterRole;
  description: string;
  attributes: CharacterAttributes;
  relationships: CharacterRelationship[];
  arc: CharacterArc | null;
  createdAt: Date;
  updatedAt: Date;
}

type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'mentioned';

interface CharacterAttributes {
  age?: string;
  occupation?: string;
  physicalDescription?: string;
  personality?: string;
  backstory?: string;
  goals?: string;
  fears?: string;
  strengths?: string;
  weaknesses?: string;
  speech?: string;               // How they talk
}

interface CharacterRelationship {
  characterId: string;           // FK → Character (the other character)
  relationshipType: string;      // "friend", "rival", "mentor", etc.
  description: string;
}

interface CharacterArc {
  startingState: string;
  endingState: string;
  keyMoments: string[];
}
```

---

## 3. AI Context System

### 3.1 AIContextSnapshot
The pre-computed context sent to the AI at invocation time.

```typescript
interface AIContextSnapshot {
  id: string;                    // UUID
  projectId: string;
  documentId: string | null;     // Currently active document
  version: number;

  // Staleness tracking
  createdAt: Date;
  lastUpdatedAt: Date;
  staleness: ContextStaleness;

  // Active selections (based on cursor position)
  activeOutlineNodeIds: string[];
  activeCharacterIds: string[];

  // Summaries
  projectSummary: string | null;
  documentSummary: string | null;
  sectionSummaries: SectionSummary[];

  // Derived maps
  characterPresenceMap: CharacterPresenceMap;
  outlineAlignmentMap: OutlineAlignmentMap;

  // Recent activity
  recentEdits: RecentEdit[];

  // Narrative structure
  narrativeProgression: NarrativeMarker[];

  // Token management
  tokenEstimate: number;
  compressionLevel: CompressionLevel;
}

type ContextStaleness = 'fresh' | 'recent' | 'stale' | 'outdated';
type CompressionLevel = 'full' | 'standard' | 'compact' | 'minimal';

interface SectionSummary {
  sectionId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  characterIds: string[];
  outlineNodeIds: string[];
  wordCount: number;
}

interface CharacterPresenceMap {
  [characterId: string]: {
    documentIds: string[];
    sectionIds: string[];
    totalMentions: number;
    lastMentionPosition: number;
  };
}

interface OutlineAlignmentMap {
  [outlineNodeId: string]: {
    documentId: string;
    sectionIds: string[];
    implementationStatus: 'not_started' | 'partial' | 'complete';
    wordCount: number;
  };
}

interface RecentEdit {
  documentId: string;
  sectionId: string | null;
  position: number;
  timestamp: Date;
  changeType: 'insert' | 'delete' | 'replace';
  textSnippet: string;
}

interface NarrativeMarker {
  documentId: string;
  position: number;
  markerType: 'scene_break' | 'chapter_start' | 'pov_shift' | 'timeline_jump';
  label: string;
}
```

### 3.2 Staleness Rules

| Staleness | Age | Behavior |
|-----------|-----|----------|
| Fresh | < 30 seconds | Use directly |
| Recent | < 5 minutes | Use directly |
| Stale | < 30 minutes | Warn user, offer refresh |
| Outdated | > 30 minutes | Auto-refresh before AI call |

### 3.3 Context Update Triggers

| Event | Trigger | Priority | Handling |
|-------|---------|----------|----------|
| Document change | Text edit | Normal | Debounced 500ms |
| Cursor move | Selection change | Low | Throttled 1000ms |
| Document switch | Open different doc | Normal | Immediate |
| Outline update | Edit outline node | Normal | Debounced 500ms |
| Character update | Edit character | Normal | Debounced 500ms |
| Document reorder | Drag-drop docs | Normal | Debounced 500ms |
| Force refresh | Manual or stale | High | Immediate |

---

## 4. Database Schema

### 4.1 Tables

```sql
-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  settings TEXT NOT NULL,           -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,            -- ProseMirror JSON
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  last_cursor_position TEXT,        -- JSON: {anchor, head}
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Sections table (derived from documents)
CREATE TABLE sections (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_position INTEGER NOT NULL,
  end_position INTEGER NOT NULL,
  summary TEXT,
  summary_updated_at TEXT,
  character_ids TEXT NOT NULL DEFAULT '[]'  -- JSON array
);

-- Outline nodes table
CREATE TABLE outline_nodes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES outline_nodes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('act', 'chapter', 'scene', 'beat', 'note')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK (status IN ('planned', 'in_progress', 'draft', 'revised', 'complete')),
  linked_document_ids TEXT NOT NULL DEFAULT '[]',  -- JSON array
  linked_section_ids TEXT NOT NULL DEFAULT '[]',   -- JSON array
  metadata TEXT NOT NULL DEFAULT '{}',             -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Characters table
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]',              -- JSON array
  role TEXT NOT NULL DEFAULT 'supporting'
    CHECK (role IN ('protagonist', 'antagonist', 'supporting', 'minor', 'mentioned')),
  description TEXT DEFAULT '',
  attributes TEXT NOT NULL DEFAULT '{}',           -- JSON
  relationships TEXT NOT NULL DEFAULT '[]',        -- JSON array
  arc TEXT,                                        -- JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- AI Context Snapshots table
CREATE TABLE ai_context_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  version INTEGER NOT NULL DEFAULT 1,
  staleness TEXT NOT NULL DEFAULT 'fresh',
  snapshot_data TEXT NOT NULL,                     -- Full snapshot JSON
  token_estimate INTEGER NOT NULL DEFAULT 0,
  compression_level TEXT NOT NULL DEFAULT 'standard',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_parent ON documents(parent_id);
CREATE INDEX idx_sections_document ON sections(document_id);
CREATE INDEX idx_outline_nodes_project ON outline_nodes(project_id);
CREATE INDEX idx_outline_nodes_parent ON outline_nodes(parent_id);
CREATE INDEX idx_characters_project ON characters(project_id);
CREATE INDEX idx_ai_context_project ON ai_context_snapshots(project_id);
CREATE INDEX idx_ai_context_document ON ai_context_snapshots(document_id);
```

---

## 5. User Interface Requirements

### 5.1 Writing View
- Full-width ProseMirror editor with minimal chrome
- Toolbar for formatting (bold, italic, headings, block quote)
- Collapsible sidebar (left or right, user preference)
- Status bar at bottom:
  - Word count (total / session)
  - Document position indicator
  - Context freshness indicator (green/yellow/red)
  - Auto-save status

### 5.2 Outline View
- Tree control with expandable/collapsible nodes
- Node types visually distinguished (icons or indentation)
- Status badges on each node
- Drag-drop reordering
- Right-click context menu for node operations
- Link indicator showing connected documents/sections

### 5.3 Character Bible
- Grid or list of character cards
- Card shows: name, role, brief description
- Expanded view shows full attributes
- Relationship visualization (optional)
- Search/filter by name, role, or alias

### 5.4 AI Panel
- Chat-style interface in sidebar
- Mode toggle: Editor / Coach
- Quick action buttons
- Response area with citation highlighting
- "Apply suggestion" button for inline edits
- Context freshness indicator with refresh button

---

## 6. Performance Requirements

| Metric | Target | Measurement |
|--------|--------|-------------|
| Editor input latency | < 16ms (60fps) | Time from keypress to render |
| Auto-save latency | < 100ms | Time to persist to SQLite |
| AI context refresh (incremental) | < 500ms | For single document changes |
| AI context refresh (full) | < 3s | For project-wide rebuild |
| AI response start | < 2s | Time to first streaming token |
| App startup | < 3s | Time to interactive state |

---

## 7. Security & Privacy Requirements

| Requirement | Implementation |
|-------------|----------------|
| Local-first storage | All data in SQLite via OPFS, no server |
| Offline capability | Full functionality without network |
| User owns data | Export to standard formats (Markdown, JSON) |
| AI API isolation | API calls only when user explicitly invokes AI |
| API key security | User-provided keys stored locally (localStorage or OPFS) |
| No telemetry | No data sent to any server except user-chosen LLM API |

---

## 8. Integration Requirements

### 8.1 LLM API Integration
- Support for OpenAI API (GPT-4, GPT-3.5)
- Support for Anthropic API (Claude)
- Abstraction layer for easy addition of other providers
- Streaming response support
- Token counting for context budget management

### 8.2 Export Formats (Phase 1)
- Markdown export (documents, outline, characters)
- JSON export (full project backup)

### 8.3 Export Formats (Future)
- DOCX export
- PDF export
- EPUB export (for manuscripts)

---

## 9. Error Handling

### 9.1 Data Integrity
- All database operations wrapped in transactions
- Write-ahead logging enabled for crash recovery
- Auto-save failure triggers user notification

### 9.2 AI Fallbacks
- If context snapshot is outdated, fall back to on-demand assembly
- If AI API fails, show error with retry option
- Rate limiting detection with backoff

### 9.3 Offline Handling
- Detect network status changes
- Queue AI requests when offline (optional)
- Clear indication of offline mode in UI

---

## 10. Glossary

| Term | Definition |
|------|------------|
| Context Snapshot | Pre-computed summary of project state for AI consumption |
| Staleness | How recently the context snapshot was updated |
| Section | A subdivision of a document derived from structure (headings, scene breaks) |
| Outline Node | A planning element in the hierarchical outline (act, chapter, scene, beat, note) |
| Character Presence | Tracking which characters appear in which documents/sections |
| Citation | AI response reference to a specific project element, formatted as [doc:X], [char:Y], [outline:Z] |
| ProseMirror | Rich text editing framework used for the document editor |
| OPFS | Origin Private File System - browser API for persistent local storage |
