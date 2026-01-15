import type { StateCreator } from 'zustand';
import type {
  AIContextSnapshot,
  ContextUpdateEvent,
  ContextStaleness,
  ContextUpdateType,
} from '../../types';

export interface AIContextSlice {
  aiContext: AIContextSnapshot | null;
  contextUpdateQueue: ContextUpdateEvent[];
  isUpdatingContext: boolean;
  lastContextError: string | null;

  setAIContext: (context: AIContextSnapshot) => void;
  queueContextUpdate: (event: ContextUpdateEvent) => void;
  processContextQueue: () => Promise<void>;
  forceContextRefresh: () => Promise<void>;
  setContextStaleness: (staleness: ContextStaleness) => void;
  clearContextError: () => void;
}

export const createAIContextSlice: StateCreator<
  AIContextSlice,
  [],
  [],
  AIContextSlice
> = (set, get) => ({
  aiContext: null,
  contextUpdateQueue: [],
  isUpdatingContext: false,
  lastContextError: null,

  setAIContext: (context) => set({ aiContext: context }),

  queueContextUpdate: (event) =>
    set((state) => ({
      contextUpdateQueue: [...state.contextUpdateQueue, event],
    })),

  processContextQueue: async () => {
    const { contextUpdateQueue, isUpdatingContext } = get();
    if (isUpdatingContext || contextUpdateQueue.length === 0) return;

    set({ isUpdatingContext: true });

    try {
      const events = [...contextUpdateQueue];
      set({ contextUpdateQueue: [] });

      // Process events through context builder
      // This will be implemented in the ai/context module
      // For now, just update staleness based on events
      const hasHighPriority = events.some((e) => e.priority === 'high');

      if (hasHighPriority) {
        // Full rebuild would happen here
      }

      // Update last updated timestamp
      set((state) => ({
        aiContext: state.aiContext
          ? {
              ...state.aiContext,
              lastUpdatedAt: new Date(),
              staleness: 'fresh' as ContextStaleness,
            }
          : null,
      }));
    } catch (error) {
      set({ lastContextError: (error as Error).message });
    } finally {
      set({ isUpdatingContext: false });
    }
  },

  forceContextRefresh: async () => {
    const event: ContextUpdateEvent = {
      type: 'force_refresh',
      payload: null,
      timestamp: new Date(),
      priority: 'high',
    };
    get().queueContextUpdate(event);
    await get().processContextQueue();
  },

  setContextStaleness: (staleness) =>
    set((state) => ({
      aiContext: state.aiContext ? { ...state.aiContext, staleness } : null,
    })),

  clearContextError: () => set({ lastContextError: null }),
});

// Helper to create context update events
export function createContextEvent(
  type: ContextUpdateType,
  payload: unknown,
  priority: 'high' | 'normal' | 'low' = 'normal'
): ContextUpdateEvent {
  return {
    type,
    payload,
    timestamp: new Date(),
    priority,
  };
}
