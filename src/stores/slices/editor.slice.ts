import type { StateCreator } from 'zustand';
import type { EditorUIState, EditorConfig } from '../../types';

export interface EditorSlice {
  editorUI: EditorUIState;
  editorConfig: EditorConfig;

  setEditorUI: (updates: Partial<EditorUIState>) => void;
  setEditorConfig: (updates: Partial<EditorConfig>) => void;
  toggleSidebar: () => void;
  toggleFocusMode: () => void;
}

const defaultUIState: EditorUIState = {
  activeDocumentId: null,
  isSidebarOpen: true,
  activeSidebarTab: 'ai-editor',
  isFullscreen: false,
  zoom: 100,
  showWordCount: true,
  focusMode: false,
};

const defaultConfig: EditorConfig = {
  autoSave: true,
  autoSaveDelay: 1000,
  spellCheck: true,
  grammarCheck: false,
  typewriterMode: false,
  darkMode: false,
};

export const createEditorSlice: StateCreator<
  EditorSlice,
  [],
  [],
  EditorSlice
> = (set) => ({
  editorUI: defaultUIState,
  editorConfig: defaultConfig,

  setEditorUI: (updates) => {
    set((state) => ({
      editorUI: { ...state.editorUI, ...updates },
    }));
  },

  setEditorConfig: (updates) => {
    set((state) => ({
      editorConfig: { ...state.editorConfig, ...updates },
    }));
  },

  toggleSidebar: () => {
    set((state) => ({
      editorUI: { ...state.editorUI, isSidebarOpen: !state.editorUI.isSidebarOpen },
    }));
  },

  toggleFocusMode: () => {
    set((state) => ({
      editorUI: {
        ...state.editorUI,
        focusMode: !state.editorUI.focusMode,
        isSidebarOpen: state.editorUI.focusMode ? true : false,
      },
    }));
  },
});
