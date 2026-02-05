export { AIService, getAIService, configureAIService } from './service';
export { SYSTEM_PROMPTS, buildPrompt, buildMessages } from './prompts';
export { QUICK_ACTIONS } from './types';
export { LEARN_FROM_WRITING_PROMPT, parseLearnResponse } from './learn-from-writing';
export type {
  AISettings,
  AIRequest,
  AIResponse,
  AICitation,
  AIMessage,
  AIMode,
  AIProvider,
  AIStreamCallbacks,
  QuickAction,
  QuickActionType,
} from './types';
export type { PendingContext, PendingCharacter, PendingOutlineNode } from './learn-from-writing';
