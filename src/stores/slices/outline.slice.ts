import type { StateCreator } from 'zustand';
import type { OutlineNode, OutlineNodeType, OutlineNodeStatus } from '../../types';
import { generateId } from '../../utils/id';

export interface CreateOutlineNodeOptions {
  title: string;
  type: OutlineNodeType;
  parentId?: string | null;
  description?: string;
}

export interface OutlineSlice {
  outlineNodes: OutlineNode[];
  isLoadingOutline: boolean;

  loadOutline: (projectId: string) => Promise<void>;
  createOutlineNode: (
    projectId: string,
    options: CreateOutlineNodeOptions
  ) => Promise<OutlineNode>;
  updateOutlineNode: (id: string, updates: Partial<OutlineNode>) => void;
  deleteOutlineNode: (id: string) => Promise<void>;
  moveOutlineNode: (id: string, newParentId: string | null, newIndex: number) => void;
  linkOutlineToDocument: (outlineId: string, documentId: string, sectionId?: string) => void;
  unlinkOutlineFromDocument: (outlineId: string, documentId: string) => void;
}

export const createOutlineSlice: StateCreator<
  OutlineSlice,
  [],
  [],
  OutlineSlice
> = (set, get) => ({
  outlineNodes: [],
  isLoadingOutline: false,

  loadOutline: async (projectId) => {
    set({ isLoadingOutline: true });
    // TODO: Load from database
    set({ isLoadingOutline: false });
  },

  createOutlineNode: async (projectId, options) => {
    const { title, type, parentId = null, description = '' } = options;
    const now = new Date();
    const { outlineNodes } = get();
    const siblings = outlineNodes.filter(
      (n) => n.projectId === projectId && n.parentId === parentId
    );

    const node: OutlineNode = {
      id: generateId(),
      projectId,
      parentId,
      type,
      title,
      description,
      sortOrder: siblings.length,
      linkedDocumentIds: [],
      linkedSectionIds: [],
      color: null,
      status: 'planned',
      metadata: {},
      createdAt: now,
      updatedAt: now,
    };

    set((state) => ({
      outlineNodes: [...state.outlineNodes, node],
    }));

    return node;
  },

  updateOutlineNode: (id, updates) => {
    set((state) => ({
      outlineNodes: state.outlineNodes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
      ),
    }));
  },

  deleteOutlineNode: async (id) => {
    // Also delete all children
    const deleteRecursively = (nodeId: string, nodes: OutlineNode[]): string[] => {
      const children = nodes.filter((n) => n.parentId === nodeId);
      return [nodeId, ...children.flatMap((c) => deleteRecursively(c.id, nodes))];
    };

    set((state) => {
      const idsToDelete = new Set(deleteRecursively(id, state.outlineNodes));
      return {
        outlineNodes: state.outlineNodes.filter((n) => !idsToDelete.has(n.id)),
      };
    });
  },

  moveOutlineNode: (id, newParentId, newIndex) => {
    set((state) => {
      const node = state.outlineNodes.find((n) => n.id === id);
      if (!node) return state;

      // Get new siblings
      const newSiblings = state.outlineNodes
        .filter((n) => n.parentId === newParentId && n.id !== id)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      // Insert at new position
      newSiblings.splice(newIndex, 0, { ...node, parentId: newParentId });

      // Update sort orders
      const updatedNodes = state.outlineNodes.map((n) => {
        if (n.id === id) {
          return { ...n, parentId: newParentId, sortOrder: newIndex };
        }
        const siblingIndex = newSiblings.findIndex((s) => s.id === n.id);
        if (siblingIndex >= 0) {
          return { ...n, sortOrder: siblingIndex };
        }
        return n;
      });

      return { outlineNodes: updatedNodes };
    });
  },

  linkOutlineToDocument: (outlineId, documentId, sectionId) => {
    set((state) => ({
      outlineNodes: state.outlineNodes.map((n) => {
        if (n.id !== outlineId) return n;
        return {
          ...n,
          linkedDocumentIds: n.linkedDocumentIds.includes(documentId)
            ? n.linkedDocumentIds
            : [...n.linkedDocumentIds, documentId],
          linkedSectionIds: sectionId
            ? n.linkedSectionIds.includes(sectionId)
              ? n.linkedSectionIds
              : [...n.linkedSectionIds, sectionId]
            : n.linkedSectionIds,
        };
      }),
    }));
  },

  unlinkOutlineFromDocument: (outlineId, documentId) => {
    set((state) => ({
      outlineNodes: state.outlineNodes.map((n) => {
        if (n.id !== outlineId) return n;
        return {
          ...n,
          linkedDocumentIds: n.linkedDocumentIds.filter((id) => id !== documentId),
        };
      }),
    }));
  },
});
