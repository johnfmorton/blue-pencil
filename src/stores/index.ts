import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector, persist, createJSONStorage } from 'zustand/middleware';
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

/** Fields that get written to localStorage */
interface PersistedState {
  projects: AppStore['projects'];
  activeProject: AppStore['activeProject'];
  documents: AppStore['documents'];
  activeDocument: AppStore['activeDocument'];
  editorConfig: AppStore['editorConfig'];
  outlineNodes: AppStore['outlineNodes'];
  characters: AppStore['characters'];
}

/** ISO 8601 date pattern — used by the JSON reviver to restore Date objects */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const storage = createJSONStorage<PersistedState>(() => localStorage, {
  reviver: (_key: string, value: unknown) => {
    if (typeof value === 'string' && ISO_DATE_RE.test(value)) {
      return new Date(value);
    }
    return value;
  },
  replacer: (_key: string, value: unknown) => value,
});

export const useStore = create<AppStore>()(
  persist(
    subscribeWithSelector((...args) => ({
      ...createProjectSlice(...args),
      ...createDocumentSlice(...args),
      ...createEditorSlice(...args),
      ...createOutlineSlice(...args),
      ...createCharacterSlice(...args),
      ...createAIContextSlice(...args),
    })),
    {
      name: 'blue-pencil-store',
      version: 1,
      storage,
      partialize: (state): PersistedState => ({
        projects: state.projects,
        activeProject: state.activeProject,
        documents: state.documents,
        activeDocument: state.activeDocument,
        editorConfig: state.editorConfig,
        outlineNodes: state.outlineNodes,
        characters: state.characters,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AppStore>),
      }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.error('Failed to rehydrate store from localStorage:', error);
          }
        };
      },
    }
  )
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
export const useContextPanelState = () =>
  useStore((state) => ({
    isOpen: state.editorUI.isContextPanelOpen,
    isPinned: state.editorUI.isContextPanelPinned,
  }));
export const useProjectSettings = () =>
  useStore((state) => state.activeProject?.settings ?? null);

/** Hook that returns true once the store has been rehydrated from localStorage */
export const useHasHydrated = () => {
  // Direct subscription to the persist API
  const [hydrated, setHydrated] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    return unsub;
  }, []);
  return hydrated;
};

// Export slice types
export type {
  ProjectSlice,
  DocumentSlice,
  EditorSlice,
  OutlineSlice,
  CharacterSlice,
  AIContextSlice,
};
