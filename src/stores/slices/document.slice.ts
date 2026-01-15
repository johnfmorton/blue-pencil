import type { StateCreator } from 'zustand';
import type { Document, DocumentContent } from '../../types';
import { generateId } from '../../utils/id';

export interface DocumentSlice {
  documents: Document[];
  activeDocument: Document | null;
  isLoadingDocuments: boolean;

  loadDocuments: (projectId: string) => Promise<void>;
  createDocument: (projectId: string, title: string) => Promise<Document>;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => Promise<void>;
  setActiveDocument: (id: string | null) => void;
  reorderDocuments: (projectId: string, orderedIds: string[]) => void;
}

const emptyContent: DocumentContent = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export const createDocumentSlice: StateCreator<
  DocumentSlice,
  [],
  [],
  DocumentSlice
> = (set, get) => ({
  documents: [],
  activeDocument: null,
  isLoadingDocuments: false,

  loadDocuments: async (projectId) => {
    set({ isLoadingDocuments: true });
    // TODO: Load from database
    set({ isLoadingDocuments: false });
  },

  createDocument: async (projectId, title) => {
    const now = new Date();
    const { documents } = get();
    const projectDocs = documents.filter((d) => d.projectId === projectId);

    const document: Document = {
      id: generateId(),
      projectId,
      title,
      content: emptyContent,
      sortOrder: projectDocs.length,
      parentId: null,
      createdAt: now,
      updatedAt: now,
      wordCount: 0,
      lastCursorPosition: null,
    };

    set((state) => ({
      documents: [...state.documents, document],
      activeDocument: document,
    }));

    return document;
  },

  updateDocument: (id, updates) => {
    set((state) => {
      const updatedDoc = state.documents.find((d) => d.id === id);
      if (!updatedDoc) return state;

      const merged = { ...updatedDoc, ...updates, updatedAt: new Date() };

      // Calculate word count if content changed
      if (updates.content) {
        const text = extractText(updates.content);
        merged.wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      }

      return {
        documents: state.documents.map((d) => (d.id === id ? merged : d)),
        activeDocument:
          state.activeDocument?.id === id ? merged : state.activeDocument,
      };
    });
  },

  deleteDocument: async (id) => {
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      activeDocument:
        state.activeDocument?.id === id ? null : state.activeDocument,
    }));
  },

  setActiveDocument: (id) => {
    set((state) => ({
      activeDocument: id
        ? state.documents.find((d) => d.id === id) ?? null
        : null,
    }));
  },

  reorderDocuments: (projectId, orderedIds) => {
    set((state) => ({
      documents: state.documents.map((d) => {
        if (d.projectId !== projectId) return d;
        const newOrder = orderedIds.indexOf(d.id);
        return newOrder >= 0 ? { ...d, sortOrder: newOrder } : d;
      }),
    }));
  },
});

function extractText(content: DocumentContent): string {
  const texts: string[] = [];

  function walk(nodes: DocumentContent['content']) {
    for (const node of nodes) {
      if (node.text) {
        texts.push(node.text);
      }
      if (node.content) {
        walk(node.content);
      }
    }
  }

  walk(content.content);
  return texts.join(' ');
}
