# Ralph Fix Plan

## High Priority

### Foundation
- [x] Set up TypeScript project with Vite build system
- [x] Configure SQLite via sql.js or wa-sqlite for OPFS storage
- [x] Define TypeScript interfaces for all core entities (Project, Document, Section, OutlineNode, Character)
- [x] Implement database schema and migrations

### Core Editor (P0)
- [x] Integrate ProseMirror with basic schema (paragraphs, headings, bold, italic, blockquote)
- [x] Implement auto-save with configurable debounce interval
- [x] Add word count tracking (document total and session delta)
- [x] Store and restore cursor position on document load
- [x] Create main Writing View layout with collapsible sidebar

### Data Layer (P0)
- [x] Implement Project CRUD operations
- [x] Implement Document CRUD with nested document support
- [ ] Build Section detection from document structure (headings, scene breaks)
- [x] Implement OutlineNode CRUD with hierarchical tree structure
- [x] Implement Character CRUD with alias and relationship support

## Medium Priority

### Outline System (P0/P1)
- [x] Build Outline View with hierarchical tree rendering
- [x] Implement status workflow (planned → in_progress → draft → revised → complete)
- [ ] Add document/section linking to outline nodes
- [ ] Implement drag-drop reordering for outline nodes
- [ ] Store outline node metadata (POV, location, timeline, tension)

### Character Bible (P0/P1)
- [x] Create Character Bible panel with profile cards
- [ ] Implement character relationship management (N:N)
- [ ] Add character arc tracking (starting state, key moments, ending state)
- [ ] Build character presence tracking (which documents/sections)

### AI Context System (P0)
- [x] Design AIContextSnapshot data structure (types defined)
- [ ] Implement context staleness detection (fresh/recent/stale/outdated)
- [ ] Build debounced context update triggers
- [ ] Create document summarization (AI-generated)
- [ ] Build section summarization with key points extraction
- [ ] Implement character presence map computation
- [ ] Build outline alignment map (outline node → document/section mapping)

## Low Priority

### AI Integration (P0)
- [ ] Create AI service abstraction for LLM API calls
- [ ] Implement AI Editor mode (grammar, style, consistency)
- [ ] Implement AI Coach mode (craft guidance)
- [ ] Build citation parsing and display ([doc:X], [char:Y], [outline:Z])
- [x] Add quick action buttons (grammar check, style improve) - UI scaffolding in place
- [ ] Implement suggestion application (apply AI edits to document)

### Secondary Features (P1)
- [ ] Add scene break visual separators in editor
- [x] Implement focus mode (hide UI, center text)
- [ ] Add character mention detection in text

### Polish (P2)
- [ ] Implement typewriter mode (keep cursor centered)
- [ ] Add dark mode toggle
- [ ] Implement word count targets per outline node
- [ ] Add color coding for outline nodes
- [ ] Build AI conversation history within session

## Completed
- [x] Project initialization
- [x] Create PROMPT.md with Ralph instructions
- [x] Create @fix_plan.md with prioritized tasks
- [x] Create specs/requirements.md with technical specifications
- [x] Create main.tsx entry point and App component
- [x] Create WelcomeScreen for project creation
- [x] Create MainLayout with header, sidebar, editor area
- [x] Create Sidebar with tabs (Documents, Outline, Characters, AI)
- [x] Create StatusBar with word count and context status
- [x] Create ProseMirror Editor with toolbar and auto-save
- [x] Create DocumentList with CRUD operations
- [x] Create OutlinePanel with hierarchical tree
- [x] Create CharacterPanel with profile cards
- [x] Create AIPanel with chat interface and quick actions
- [x] Add comprehensive CSS styles for all components

## Notes

### Open Questions (to resolve during implementation)
1. **Summarization strategy**: Recommend using same cloud API as editor to avoid local LLM complexity
2. **Export formats**: Start with Markdown, add DOCX/PDF in later phase
3. **Collaboration**: Single-user MVP—do not plan for multi-user
4. **Version history**: Defer to later phase
5. **Sync**: Local-only for MVP
6. **Mobile**: Web-only, responsive design for tablet

### Technical Decisions
- Use ProseMirror for rich text (standard in writing apps)
- SQLite via OPFS for browser persistence (works offline)
- Debounce edits at 500ms for context updates
- Throttle cursor movement updates at 1000ms
- Background workers for heavy summarization tasks

### Performance Targets
- Editor input latency: <16ms (60fps)
- Auto-save latency: <100ms
- AI context refresh: <500ms incremental, <3s full
- AI response start: <2s (streaming)
- App startup: <3s to interactive

### Key Architecture Patterns
- Local-first: all data stored locally, no cloud dependency
- User-provided API keys only
- Context snapshot pre-computation (not on-demand at AI invocation)
- Staleness-aware context updates

### Recent Progress (This Session)
- Built complete React UI with ProseMirror editor
- All core components in place: Editor, DocumentList, OutlinePanel, CharacterPanel, AIPanel
- Zustand stores operational with CRUD operations
- CSS styles applied for professional look
- Focus mode implemented (hides chrome for distraction-free writing)
