import type { StateCreator } from 'zustand';
import type { Character, CharacterRole, CharacterAttributes, CharacterPresence } from '../../types';
import { generateId } from '../../utils/id';

export interface CharacterSlice {
  characters: Character[];
  characterPresences: CharacterPresence[];
  isLoadingCharacters: boolean;

  loadCharacters: (projectId: string) => Promise<void>;
  createCharacter: (projectId: string, name: string, role?: CharacterRole) => Promise<Character>;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => Promise<void>;
  addCharacterAlias: (id: string, alias: string) => void;
  removeCharacterAlias: (id: string, alias: string) => void;
  updateCharacterPresence: (presence: CharacterPresence) => void;
}

export const createCharacterSlice: StateCreator<
  CharacterSlice,
  [],
  [],
  CharacterSlice
> = (set, get) => ({
  characters: [],
  characterPresences: [],
  isLoadingCharacters: false,

  loadCharacters: async (projectId) => {
    set({ isLoadingCharacters: true });
    // TODO: Load from database
    set({ isLoadingCharacters: false });
  },

  createCharacter: async (projectId, name, role = 'supporting') => {
    const now = new Date();
    const character: Character = {
      id: generateId(),
      projectId,
      name,
      aliases: [],
      role,
      description: '',
      attributes: {},
      relationships: [],
      arc: null,
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      characters: [...state.characters, character],
    }));

    return character;
  },

  updateCharacter: (id, updates) => {
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
      ),
    }));
  },

  deleteCharacter: async (id) => {
    set((state) => ({
      characters: state.characters.filter((c) => c.id !== id),
      characterPresences: state.characterPresences.filter(
        (p) => p.characterId !== id
      ),
    }));
  },

  addCharacterAlias: (id, alias) => {
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id && !c.aliases.includes(alias)
          ? { ...c, aliases: [...c.aliases, alias], updatedAt: new Date() }
          : c
      ),
    }));
  },

  removeCharacterAlias: (id, alias) => {
    set((state) => ({
      characters: state.characters.map((c) =>
        c.id === id
          ? { ...c, aliases: c.aliases.filter((a) => a !== alias), updatedAt: new Date() }
          : c
      ),
    }));
  },

  updateCharacterPresence: (presence) => {
    set((state) => {
      const existingIndex = state.characterPresences.findIndex(
        (p) =>
          p.characterId === presence.characterId &&
          p.documentId === presence.documentId &&
          p.sectionId === presence.sectionId
      );

      if (existingIndex >= 0) {
        const updated = [...state.characterPresences];
        updated[existingIndex] = presence;
        return { characterPresences: updated };
      }

      return { characterPresences: [...state.characterPresences, presence] };
    });
  },
});
