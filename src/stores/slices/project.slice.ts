import type { StateCreator } from 'zustand';
import type { Project, ProjectSettings } from '../../types';
import { generateId } from '../../utils/id';

export interface ProjectSlice {
  projects: Project[];
  activeProject: Project | null;
  isLoadingProjects: boolean;

  loadProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (id: string | null) => void;
}

const defaultSettings: ProjectSettings = {
  defaultAIModel: 'claude-opus-4-5-20251101',
  autoSaveInterval: 5000,
  contextUpdateDebounce: 500,
};

export const createProjectSlice: StateCreator<
  ProjectSlice,
  [],
  [],
  ProjectSlice
> = (set, get) => ({
  projects: [],
  activeProject: null,
  isLoadingProjects: false,

  loadProjects: async () => {
    set({ isLoadingProjects: true });
    // TODO: Load from database
    set({ isLoadingProjects: false });
  },

  createProject: async (name, description = '') => {
    const now = new Date();
    const project: Project = {
      id: generateId(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      settings: { ...defaultSettings },
    };

    set((state) => ({
      projects: [...state.projects, project],
      activeProject: project,
    }));

    return project;
  },

  updateProject: (id, updates) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ),
      activeProject:
        state.activeProject?.id === id
          ? { ...state.activeProject, ...updates, updatedAt: new Date() }
          : state.activeProject,
    }));
  },

  deleteProject: async (id) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProject:
        state.activeProject?.id === id ? null : state.activeProject,
    }));
  },

  setActiveProject: (id) => {
    set((state) => ({
      activeProject: id ? state.projects.find((p) => p.id === id) ?? null : null,
    }));
  },
});
