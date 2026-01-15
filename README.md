# Blue Pencil

A fiction writing assistant with AI-powered editing and coaching. Blue Pencil combines a distraction-free rich text editor with Claude AI integration to help authors write, revise, and develop their stories.

## Features

- **Rich Text Editor** - ProseMirror-based editor with markdown shortcuts, auto-save, and word count tracking
- **AI Writing Assistant** - Two modes powered by Claude:
  - *Editor mode* - Grammar, style, and consistency checks
  - *Coach mode* - Big-picture guidance on plot, pacing, and character development
- **Story Structure** - Hierarchical outline management (acts, chapters, scenes, beats)
- **Character Management** - Track characters with attributes, relationships, and arcs
- **Offline-First** - Browser-based SQLite storage via wa-sqlite

## Tech Stack

- React 18 + TypeScript
- Vite for development and builds
- Zustand for state management
- ProseMirror for rich text editing
- Anthropic SDK for Claude AI integration
- wa-sqlite for browser-based persistence

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/johnfmorton/blue-pencil.git
cd blue-pencil
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
npm run preview  # Preview production build
```

## Project Structure

```
src/
├── ai/           # AI service layer and prompts
├── components/   # React components
│   ├── ai/       # AI chat panel
│   ├── characters/
│   ├── documents/
│   ├── editor/   # ProseMirror editor wrapper
│   ├── layout/   # Main layout, sidebar, status bar
│   └── outline/
├── editor/       # ProseMirror schema, plugins, keymap
├── stores/       # Zustand state management
│   └── slices/   # Feature-based store slices
├── styles/       # CSS
├── types/        # TypeScript type definitions
└── utils/        # Utilities (ID generation)
```

## Configuration

The AI assistant requires an Anthropic API key. Enter your key in the AI panel settings (stored locally in your browser).

## License

MIT
