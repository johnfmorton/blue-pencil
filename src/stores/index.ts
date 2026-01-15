import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { createProjectSlice, type ProjectSlice } from './slices/project.slice';
import { createDocumentSlice, type DocumentSlice } from './slices/document.slice';
import { createEditorSlice, type EditorSlice } from './slices/editor.slice';
import { createOutlineSlice, type OutlineSlice } from './slices/outline.slice';
import { createCharacterSlice, type CharacterSlice } from './slices/character.slice';
import { createAIContextSlice, type AIContextSlice } from './slices/ai-context.slice';

export type AppStore = ProjectSlice &
  DocumentSlice &
  EditorSlice &
  OutlineSlice &
  CharacterSlice &
  AIContextSlice;

export const useStore = create<AppStore>()(
  subscribeWithSelector((...args) => ({
    ...createProjectSlice(...args),
    ...createDocumentSlice(...args),
    ...createEditorSlice(...args),
    ...createOutlineSlice(...args),
    ...createCharacterSlice(...args),
    ...createAIContextSlice(...args),
  }))
);

// Selector hooks for optimized re-renders
export const useActiveProject = () => useStore((state) => state.activeProject);
export const useActiveDocument = () => useStore((state) => state.activeDocument);
export const useDocuments = () => useStore((state) => state.documents);
export const useOutlineNodes = () => useStore((state) => state.outlineNodes);
export const useCharacters = () => useStore((state) => state.characters);
export const useAIContext = () => useStore((state) => state.aiContext);
export const useEditorUI = () => useStore((state) => state.editorUI);
export const useEditorConfig = () => useStore((state) => state.editorConfig);

// Export slice types
export type {
  ProjectSlice,
  DocumentSlice,
  EditorSlice,
  OutlineSlice,
  CharacterSlice,
  AIContextSlice,
};
