import type { AIContextSnapshot } from '../types';

export type AIProvider = 'anthropic' | 'openai';

export type AIMode = 'editor' | 'coach';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  mode: AIMode;
  userMessage: string;
  selectedText?: string;
  context: AIContextSnapshot;
  conversationHistory?: AIMessage[];
}

export interface AICitation {
  type: 'document' | 'character' | 'outline';
  id: string;
  name: string;
  excerpt?: string;
}

export interface AIResponse {
  content: string;
  citations: AICitation[];
  suggestedEdit?: {
    originalText: string;
    suggestedText: string;
    explanation: string;
  };
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface AIStreamCallbacks {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onComplete?: (response: AIResponse) => void;
  onError?: (error: Error) => void;
}

// Quick action types for common editing tasks
export type QuickActionType =
  | 'grammar_check'
  | 'style_improve'
  | 'consistency_check'
  | 'pacing_analysis'
  | 'dialogue_review'
  | 'character_voice';

export interface QuickAction {
  type: QuickActionType;
  label: string;
  description: string;
  prompt: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  {
    type: 'grammar_check',
    label: 'Grammar',
    description: 'Check for grammar and spelling issues',
    prompt: 'Review the following text for grammar, spelling, and punctuation errors. Suggest corrections with explanations.',
  },
  {
    type: 'style_improve',
    label: 'Style',
    description: 'Improve prose style and flow',
    prompt: 'Analyze the following text for style improvements. Suggest ways to make the prose more engaging, varied, and polished while maintaining the author\'s voice.',
  },
  {
    type: 'consistency_check',
    label: 'Consistency',
    description: 'Check for inconsistencies',
    prompt: 'Review the text for consistency issues: character behavior, timeline, world details, and narrative voice. Flag any inconsistencies with the project context provided.',
  },
  {
    type: 'pacing_analysis',
    label: 'Pacing',
    description: 'Analyze scene pacing',
    prompt: 'Analyze the pacing of this text. Is it moving too fast or too slow? Are there areas that drag or feel rushed? Provide specific suggestions.',
  },
  {
    type: 'dialogue_review',
    label: 'Dialogue',
    description: 'Review dialogue quality',
    prompt: 'Review the dialogue in this text. Is it natural? Does each character have a distinct voice? Are there any talking head issues? Suggest improvements.',
  },
  {
    type: 'character_voice',
    label: 'Voice',
    description: 'Check character voice consistency',
    prompt: 'Analyze the character voices in this text against their profiles. Are they consistent with their established personalities, speech patterns, and backgrounds?',
  },
];
