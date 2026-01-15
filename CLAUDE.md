# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blue Pencil is a fiction writing assistant built with React, ProseMirror, and Claude AI integration. It provides rich text editing with AI-powered writing assistance (grammar, style, coaching) for fiction authors.

## Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # TypeScript compile + Vite build
npm run lint     # ESLint check
npm run preview  # Preview production build
```

## Architecture

### State Management (Zustand Slices)

The app uses Zustand with a slice-based architecture in `src/stores/`:

- **project.slice.ts** - Project CRUD operations
- **document.slice.ts** - Document content management
- **editor.slice.ts** - Editor UI state (focus mode, sidebar visibility)
- **outline.slice.ts** - Hierarchical story structure (acts, chapters, scenes, beats)
- **character.slice.ts** - Character profiles with relationships and arcs
- **ai-context.slice.ts** - AI context snapshots with staleness tracking

All slices compose into a single `AppStore` in `stores/index.ts`. Use exported selector hooks (`useActiveProject()`, `useDocuments()`, etc.) for component access.

### Editor (ProseMirror)

- **schema.ts** - Document schema: paragraph, heading (1-4), blockquote, scene_break; marks: strong, em, underline, strikethrough
- **plugins.ts** - Word count tracking, auto-save with debounce, markdown input rules (# for headings, > for blockquote, *** for scene break)
- **keymap.ts** - Standard shortcuts (Cmd+B bold, Cmd+Z undo, Ctrl+Shift+1-4 headings)

The Editor component (`components/editor/Editor.tsx`) handles ProseMirror state, content serialization to JSON, cursor position restoration, and auto-save.

### AI Integration

- **ai/service.ts** - Singleton `AIService` wrapping Anthropic SDK with streaming support
- **ai/prompts.ts** - Context builders for project, characters, outline, recent edits
- **ai/types.ts** - Quick actions (grammar, style, pacing, dialogue, voice checks)

Two AI modes:
- **Editor mode** - Grammar, style, consistency checks on selected text
- **Coach mode** - Big-picture guidance on plot, character development

The `AIPanel` component manages conversation history, settings (API key stored locally), and streaming response display.

### Data Models

Key types in `src/types/`:
- **Document** - ProseMirror JSON content, word count, cursor position
- **Character** - Role (protagonist/antagonist/supporting/minor), attributes, relationships, arc
- **OutlineNode** - Tree structure with types (act/chapter/scene/beat/note), status (planned→complete), metadata (POV, location, tension)
- **AIContextSnapshot** - Versioned project state for AI with staleness tracking

### Database

`src/db/` contains wa-sqlite setup for browser-based SQLite with IndexedDB persistence. Schema defined in `schema.sql`. Database integration hooks are present but store operations currently use in-memory state.

## Key Patterns

- All IDs generated via nanoid (`utils/id.ts`)
- Editor content stored as ProseMirror JSON
- AI responses parsed for citations: `[doc:ID]`, `[char:ID]`, `[outline:ID]`
- Auto-save uses debounced updates with dirty flag tracking
