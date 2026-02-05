import type { StateCreator } from 'zustand';
import type { EditorUIState, EditorConfig } from '../../types';

export interface EditorSlice {
  editorUI: EditorUIState;
  editorConfig: EditorConfig;

  setEditorUI: (updates: Partial<EditorUIState>) => void;
  setEditorConfig: (updates: Partial<EditorConfig>) => void;
  toggleSidebar: () => void;
  toggleFocusMode: () => void;
  toggleContextPanel: () => void;
  openContextPanel: () => void;
  closeContextPanel: () => void;
  setContextPanelPinned: (pinned: boolean) => void;
}

const defaultUIState: EditorUIState = {
  activeDocumentId: null,
  isSidebarOpen: true,
  activeSidebarTab: 'ai-editor',
  isFullscreen: false,
  zoom: 100,
  showWordCount: true,
  focusMode: false,
  isContextPanelOpen: false,
  isContextPanelPinned: false,
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
      editorUI: {
        ...state.editorUI,
        isSidebarOpen: !state.editorUI.isSidebarOpen,
        // Close context panel when opening sidebar
        isContextPanelOpen: !state.editorUI.isSidebarOpen ? false : state.editorUI.isContextPanelOpen,
      },
    }));
  },

  toggleFocusMode: () => {
    set((state) => ({
      editorUI: {
        ...state.editorUI,
        focusMode: !state.editorUI.focusMode,
        isSidebarOpen: state.editorUI.focusMode ? true : false,
        // Close context panel when entering focus mode
        isContextPanelOpen: state.editorUI.focusMode ? state.editorUI.isContextPanelOpen : false,
      },
    }));
  },

  toggleContextPanel: () => {
    set((state) => ({
      editorUI: {
        ...state.editorUI,
        isContextPanelOpen: !state.editorUI.isContextPanelOpen,
        // Close sidebar when opening context panel
        isSidebarOpen: !state.editorUI.isContextPanelOpen ? false : state.editorUI.isSidebarOpen,
      },
    }));
  },

  openContextPanel: () => {
    set((state) => ({
      editorUI: {
        ...state.editorUI,
        isContextPanelOpen: true,
        isSidebarOpen: false,
      },
    }));
  },

  closeContextPanel: () => {
    set((state) => ({
      editorUI: { ...state.editorUI, isContextPanelOpen: false },
    }));
  },

  setContextPanelPinned: (pinned) => {
    set((state) => ({
      editorUI: { ...state.editorUI, isContextPanelPinned: pinned },
    }));
  },
});
