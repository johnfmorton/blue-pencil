# Blue Pencil - Product & Technical Requirements

## 1. Product Vision

### 1.1 Overview
Blue Pencil is a writing application for fiction and nonfiction authors that combines a distraction-free writing environment with AI-powered editorial assistance. The AI editor maintains awareness of the author's planning documents (outlines, characters, structure) and provides contextually relevant guidance throughout the writing process.

### 1.2 Core Value Proposition
- **For writers** who struggle to maintain consistency across long-form projects
- **Blue Pencil** is a writing tool with an embedded AI editor
- **That** understands your entire project's context—characters, plot, structure
- **Unlike** generic AI writing assistants that require re-explaining context each session
- **Our product** maintains a persistent, incrementally-updated index of your work

### 1.3 Target Users

| Persona | Description | Primary Needs |
|---------|-------------|---------------|
| **Novel Writer** | Writing 80k+ word fiction | Character consistency, plot tracking, pacing feedback |
| **Non-fiction Author** | Writing structured arguments/narratives | Argument flow, source consistency, chapter coherence |
| **Screenwriter** | Writing scripts with dialogue focus | Character voice, scene structure, dialogue coaching |

---

## 2. User Workflows

### 2.1 Primary Views

#### Writing View
The main workspace where authors compose their manuscript.
- Large, distraction-free text editor (like Word/Scrivener)
- Collapsible sidebar with AI assistant panels
- Status bar showing word count, document position, context freshness

#### Outline View
A planning workspace for story structure.
- Hierarchical tree: Acts → Chapters → Scenes → Beats
- Drag-and-drop reordering
- Status indicators (planned/in-progress/draft/revised/complete)
- Links to corresponding manuscript sections

#### Character Bible
A reference panel for character management.
- Character cards with attributes, relationships, arcs
- Alias tracking for name variations
- Presence tracking (which scenes feature each character)

### 2.2 Core User Stories

#### Writing Flow
```
As a writer, I want to:
- Open my project and immediately continue where I left off
- Write without interruption in a clean editor
- See my word count and progress at a glance
- Access AI help without leaving my writing context
```

#### AI Assistance
```
As a writer, I want to:
- Ask the AI for feedback on my current passage
- Get suggestions that account for my characters and plot
- Receive guidance aligned with my outline goals
- See which parts of my project the AI referenced in its response
```

#### Planning & Organization
```
As a writer, I want to:
- Create an outline before or during writing
- Link outline nodes to manuscript sections
- Track which planned scenes are drafted vs. incomplete
- Manage my cast of characters with consistent details
```

### 2.3 Interaction Patterns

#### Invoking the AI Editor
1. Writer clicks "AI Editor" in sidebar (or keyboard shortcut)
2. System pulls latest context snapshot (pre-computed)
3. Writer types question or selects quick action
4. System sends compact prompt with context + user query
5. AI responds with suggestions and source citations
6. Writer can apply suggestions or continue conversation

#### Context Stays Fresh
1. Writer makes edits → deltas captured
2. After pause (debounced), context updater processes changes
3. Summaries regenerated in background worker
4. Context snapshot marked "fresh"
5. Next AI invocation uses updated snapshot

---

## 3. Feature Requirements

### 3.1 Editor Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Rich text editing | P0 | Bold, italic, headings, block quotes |
| Auto-save | P0 | Save on pause, configurable interval |
| Word count | P0 | Document and session word counts |
| Scene breaks | P1 | Visual separators between scenes |
| Focus mode | P1 | Hide UI, center text, reduce distractions |
| Typewriter mode | P2 | Keep cursor vertically centered |
| Dark mode | P2 | Color scheme toggle |

### 3.2 Outline Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Hierarchical nodes | P0 | Act/Chapter/Scene/Beat/Note types |
| Node status | P0 | Planned → In Progress → Draft → Revised → Complete |
| Document linking | P0 | Connect outline nodes to manuscript sections |
| Drag-drop reorder | P1 | Reorganize structure visually |
| Word count targets | P2 | Per-node target vs. actual tracking |
| Color coding | P2 | Visual categorization of nodes |

### 3.3 Character Features

| Feature | Priority | Description |
|---------|----------|-------------|
| Character profiles | P0 | Name, role, description, attributes |
| Alias support | P0 | Track nicknames, titles, alternate names |
| Relationships | P1 | Define connections between characters |
| Character arcs | P1 | Starting state → key moments → ending state |
| Presence tracking | P1 | Which documents/sections feature each character |
| Mention detection | P2 | Auto-detect character names in text |

### 3.4 AI Features

| Feature | Priority | Description |
|---------|----------|-------------|
| AI Editor mode | P0 | Grammar, style, consistency feedback |
| AI Coach mode | P0 | Big-picture craft guidance |
| Context awareness | P0 | AI knows outline, characters, recent work |
| Citation display | P0 | Show which project elements AI referenced |
| Quick actions | P1 | One-click: check grammar, improve style, etc. |
| Suggestion application | P1 | Apply AI edits directly to document |
| Conversation history | P2 | Remember past exchanges in session |

---

## 4. Data Model

### 4.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Project   │───────│  Document   │───────│   Section   │
└─────────────┘  1:N  └─────────────┘  1:N  └─────────────┘
       │                     │                     │
       │                     │                     │
       │ 1:N                 │                     │
       ▼                     │                     │
┌─────────────┐              │                     │
│ OutlineNode │──────────────┼─────────────────────┘
└─────────────┘    links     │        links
       │                     │
       │                     │
       │ 1:N                 │
       ▼                     │
┌─────────────┐              │
│  Character  │──────────────┘
└─────────────┘   mentioned in
       │
       │ N:N
       ▼
┌─────────────────────┐
│ CharacterRelationship│
└─────────────────────┘
```

### 4.2 Core Entities

#### Project
```typescript
{
  id: string
  name: string
  description: string
  settings: {
    defaultAIModel: string
    autoSaveInterval: number      // ms
    contextUpdateDebounce: number // ms
  }
  createdAt: Date
  updatedAt: Date
}
```

#### Document
```typescript
{
  id: string
  projectId: string
  title: string
  content: ProseMirrorJSON        // Rich text content
  sortOrder: number
  parentId: string | null         // For nested documents
  wordCount: number
  lastCursorPosition: { anchor: number, head: number } | null
  createdAt: Date
  updatedAt: Date
}
```

#### Section
Derived from document structure (headings, scene breaks).
```typescript
{
  id: string
  documentId: string
  title: string
  startPosition: number
  endPosition: number
  summary: string | null          // AI-generated
  summaryUpdatedAt: Date | null
  characterIds: string[]          // Characters present
}
```

#### OutlineNode
```typescript
{
  id: string
  projectId: string
  parentId: string | null
  type: 'act' | 'chapter' | 'scene' | 'beat' | 'note'
  title: string
  description: string
  sortOrder: number
  status: 'planned' | 'in_progress' | 'draft' | 'revised' | 'complete'
  linkedDocumentIds: string[]
  linkedSectionIds: string[]
  metadata: {
    wordCountTarget?: number
    pov?: string                  // Point of view character
    timeline?: string
    location?: string
    tension?: number              // 1-10 pacing indicator
  }
  createdAt: Date
  updatedAt: Date
}
```

#### Character
```typescript
{
  id: string
  projectId: string
  name: string
  aliases: string[]               // Nicknames, titles
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor' | 'mentioned'
  description: string
  attributes: {
    age?: string
    occupation?: string
    physicalDescription?: string
    personality?: string
    backstory?: string
    goals?: string
    fears?: string
    strengths?: string
    weaknesses?: string
    speech?: string               // How they talk
  }
  relationships: [{
    characterId: string
    relationshipType: string      // "friend", "rival", etc.
    description: string
  }]
  arc: {
    startingState: string
    endingState: string
    keyMoments: string[]
  } | null
  createdAt: Date
  updatedAt: Date
}
```

---

## 5. AI Context System

### 5.1 Design Goals

| Goal | Rationale |
|------|-----------|
| **Near-instant AI responses** | No waiting for full-document scanning at invocation |
| **Reduced prompt size** | Pre-computed summaries fit more context in token budget |
| **Consistent answers** | Stable grounding reduces hallucination and drift |
| **Future extensibility** | Enables progress tracking, inconsistency warnings |

### 5.2 Input Events

Events that trigger context updates:

| Event | Trigger | Priority | Handling |
|-------|---------|----------|----------|
| Document change | Text edit | Normal | Debounced 500ms |
| Cursor move | Selection change | Low | Throttled 1000ms |
| Document switch | Open different doc | Normal | Immediate |
| Outline update | Edit outline node | Normal | Debounced 500ms |
| Character update | Edit character | Normal | Debounced 500ms |
| Document reorder | Drag-drop docs | Normal | Debounced 500ms |
| Force refresh | Manual or stale | High | Immediate |

### 5.3 Derived Context

What gets computed and cached:

| Context Type | Description | Update Frequency |
|--------------|-------------|------------------|
| Active document summary | 2-3 sentence summary of current doc | On document change |
| Section summaries | Per-section summaries with key points | On section change |
| Character presence map | Which characters appear where | On text analysis |
| Outline alignment map | Which outline nodes map to which sections | On link changes |
| Recent edits | Last N changes with snippets | On document change |
| Narrative markers | Scene breaks, POV shifts, timeline jumps | On structure change |

### 5.4 AIContextSnapshot

The snapshot sent to the AI at invocation time:

```typescript
{
  id: string
  projectId: string
  documentId: string | null       // Active document
  version: number

  // Staleness tracking
  createdAt: Date
  lastUpdatedAt: Date
  staleness: 'fresh' | 'recent' | 'stale' | 'outdated'

  // Active selections (based on cursor position)
  activeOutlineNodeIds: string[]
  activeCharacterIds: string[]

  // Summaries
  projectSummary: string | null
  documentSummary: string | null
  sectionSummaries: [{
    sectionId: string
    title: string
    summary: string
    keyPoints: string[]
    characterIds: string[]
    outlineNodeIds: string[]
    wordCount: number
  }]

  // Derived maps
  characterPresenceMap: {
    [characterId]: {
      documentIds: string[]
      sectionIds: string[]
      totalMentions: number
      lastMentionPosition: number
    }
  }
  outlineAlignmentMap: {
    [outlineNodeId]: {
      documentId: string
      sectionIds: string[]
      implementationStatus: 'not_started' | 'partial' | 'complete'
      wordCount: number
    }
  }

  // Recent activity
  recentEdits: [{
    documentId: string
    sectionId: string | null
    position: number
    timestamp: Date
    changeType: 'insert' | 'delete' | 'replace'
    textSnippet: string
  }]

  // Narrative structure
  narrativeProgression: [{
    documentId: string
    position: number
    markerType: 'scene_break' | 'chapter_start' | 'pov_shift' | 'timeline_jump'
    label: string
  }]

  // Token management
  tokenEstimate: number
  compressionLevel: 'full' | 'standard' | 'compact' | 'minimal'
}
```

### 5.5 Staleness Detection

| Staleness | Age | Behavior |
|-----------|-----|----------|
| Fresh | < 30 seconds | Use directly |
| Recent | < 5 minutes | Use directly |
| Stale | < 30 minutes | Warn user, offer refresh |
| Outdated | > 30 minutes | Auto-refresh before AI call |

### 5.6 Invocation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User Clicks "AI Editor"                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Check Context Staleness                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Fresh?    │→ │   Recent?   │→ │  Stale/Outdated?    │  │
│  │  Use as-is  │  │  Use as-is  │  │  Refresh first      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Build Prompt                                  │
│  • System prompt (AI Editor or Coach personality)           │
│  • Serialized context snapshot (summaries, maps)            │
│  • User's question + selected text range                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Send to LLM                                   │
│  • Compact, deterministic prompt                            │
│  • No full-document scanning at this stage                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Parse Response                                │
│  • Extract content                                          │
│  • Extract citations [doc:X], [char:Y], [outline:Z]        │
│  • Display with clickable source links                      │
└─────────────────────────────────────────────────────────────┘
```

### 5.7 Background Processing

Heavy operations run asynchronously:

| Operation | Trigger | Worker |
|-----------|---------|--------|
| Full project summarization | Project open, force refresh | Summarizer worker |
| Document summarization | Document change (debounced) | Summarizer worker |
| Character mention detection | Document change | Main thread (lightweight) |
| Section boundary detection | Document structure change | Main thread |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Target |
|--------|--------|
| Editor input latency | < 16ms (60fps) |
| Auto-save latency | < 100ms |
| AI context refresh | < 500ms for incremental, < 3s for full |
| AI response start | < 2s (streaming) |
| App startup | < 3s to interactive |

### 6.2 Data & Privacy

| Requirement | Implementation |
|-------------|----------------|
| Local-first storage | SQLite in browser (OPFS) or desktop |
| No cloud dependency | Works fully offline |
| User owns data | Export to standard formats |
| AI API calls | Only when user invokes AI (no background uploads) |
| API key storage | User provides own key, stored locally |

### 6.3 Reliability

| Requirement | Implementation |
|-------------|----------------|
| Crash recovery | Auto-save ensures < 5s of work lost |
| Context fallback | If index stale, fall back to on-demand assembly |
| Offline mode | Full functionality without network |
| Data integrity | SQLite transactions, write-ahead logging |

---

## 7. Open Questions

> These should be resolved before or during implementation:

1. **Summarization strategy**: Use local LLM, or same cloud API as editor?
2. **Export formats**: Which formats to support? (Markdown, DOCX, PDF, EPUB)
3. **Collaboration**: Single-user MVP, or plan for multi-user from start?
4. **Version history**: Track document versions? How far back?
5. **Sync**: Future cloud sync, or local-only permanently?
6. **Mobile**: Web-only, or plan for mobile/tablet?

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Context freshness | 95% of AI calls use "fresh" or "recent" context | Telemetry |
| AI response relevance | 80% of responses cite correct project elements | User feedback |
| Writing session length | Average 30+ minutes | Local analytics |
| Feature adoption | 60% of users use outline linking | Local analytics |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Context Snapshot** | Pre-computed summary of project state for AI consumption |
| **Staleness** | How recently the context snapshot was updated |
| **Section** | A subdivision of a document (derived from structure) |
| **Outline Node** | A planning element (act, chapter, scene, beat, note) |
| **Character Presence** | Tracking which characters appear in which documents |
| **Citation** | AI response reference to a specific project element |
