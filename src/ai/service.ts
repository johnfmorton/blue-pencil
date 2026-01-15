import Anthropic from '@anthropic-ai/sdk';
import type {
  AISettings,
  AIRequest,
  AIResponse,
  AICitation,
  AIStreamCallbacks,
} from './types';
import { buildMessages } from './prompts';
import type { Character, OutlineNode } from '../types';

// Default settings
const DEFAULT_SETTINGS: AISettings = {
  provider: 'anthropic',
  apiKey: '',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
  temperature: 0.7,
};

// Citation regex patterns
const CITATION_PATTERNS = {
  document: /\[doc:([a-zA-Z0-9_-]+)\]/g,
  character: /\[char:([a-zA-Z0-9_-]+)\]/g,
  outline: /\[outline:([a-zA-Z0-9_-]+)\]/g,
};

// Parse citations from AI response
function parseCitations(
  content: string,
  characters: Character[],
  outlineNodes: OutlineNode[],
  documentTitles: Record<string, string>
): AICitation[] {
  const citations: AICitation[] = [];
  const seen = new Set<string>();

  // Parse document citations
  let match;
  while ((match = CITATION_PATTERNS.document.exec(content)) !== null) {
    const id = match[1];
    const key = `doc:${id}`;
    if (!seen.has(key)) {
      seen.add(key);
      citations.push({
        type: 'document',
        id,
        name: documentTitles[id] || `Document ${id}`,
      });
    }
  }

  // Parse character citations
  CITATION_PATTERNS.character.lastIndex = 0;
  while ((match = CITATION_PATTERNS.character.exec(content)) !== null) {
    const id = match[1];
    const key = `char:${id}`;
    if (!seen.has(key)) {
      seen.add(key);
      const character = characters.find((c) => c.id === id);
      citations.push({
        type: 'character',
        id,
        name: character?.name || `Character ${id}`,
      });
    }
  }

  // Parse outline citations
  CITATION_PATTERNS.outline.lastIndex = 0;
  while ((match = CITATION_PATTERNS.outline.exec(content)) !== null) {
    const id = match[1];
    const key = `outline:${id}`;
    if (!seen.has(key)) {
      seen.add(key);
      const node = outlineNodes.find((n) => n.id === id);
      citations.push({
        type: 'outline',
        id,
        name: node?.title || `Outline ${id}`,
      });
    }
  }

  return citations;
}

// Parse suggested edit from response
function parseSuggestedEdit(content: string): AIResponse['suggestedEdit'] | undefined {
  // Look for structured edit suggestions in the response
  const editMatch = content.match(
    /```suggested-edit\s*\nOriginal:\s*(.+?)\s*\nSuggested:\s*(.+?)\s*\nExplanation:\s*(.+?)\s*```/s
  );

  if (editMatch) {
    return {
      originalText: editMatch[1].trim(),
      suggestedText: editMatch[2].trim(),
      explanation: editMatch[3].trim(),
    };
  }

  return undefined;
}

export class AIService {
  private settings: AISettings;
  private anthropicClient: Anthropic | null = null;

  constructor(settings: Partial<AISettings> = {}) {
    this.settings = { ...DEFAULT_SETTINGS, ...settings };
  }

  updateSettings(settings: Partial<AISettings>): void {
    this.settings = { ...this.settings, ...settings };
    // Reset clients when settings change
    this.anthropicClient = null;
  }

  getSettings(): AISettings {
    return { ...this.settings };
  }

  isConfigured(): boolean {
    return Boolean(this.settings.apiKey);
  }

  private getAnthropicClient(): Anthropic {
    if (!this.anthropicClient) {
      this.anthropicClient = new Anthropic({
        apiKey: this.settings.apiKey,
        dangerouslyAllowBrowser: true, // Required for browser usage
      });
    }
    return this.anthropicClient;
  }

  async sendRequest(
    request: AIRequest,
    characters: Character[] = [],
    outlineNodes: OutlineNode[] = [],
    documentTitles: Record<string, string> = {}
  ): Promise<AIResponse> {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured. Please provide an API key.');
    }

    const messages = buildMessages(request, characters, outlineNodes);

    if (this.settings.provider === 'anthropic') {
      return this.sendAnthropicRequest(
        messages,
        characters,
        outlineNodes,
        documentTitles
      );
    }

    throw new Error(`Provider ${this.settings.provider} not yet implemented`);
  }

  async sendRequestWithStream(
    request: AIRequest,
    callbacks: AIStreamCallbacks,
    characters: Character[] = [],
    outlineNodes: OutlineNode[] = [],
    documentTitles: Record<string, string> = {}
  ): Promise<void> {
    if (!this.isConfigured()) {
      callbacks.onError?.(new Error('AI service not configured. Please provide an API key.'));
      return;
    }

    const messages = buildMessages(request, characters, outlineNodes);

    if (this.settings.provider === 'anthropic') {
      return this.sendAnthropicStreamRequest(
        messages,
        callbacks,
        characters,
        outlineNodes,
        documentTitles
      );
    }

    callbacks.onError?.(new Error(`Provider ${this.settings.provider} not yet implemented`));
  }

  private async sendAnthropicRequest(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    characters: Character[],
    outlineNodes: OutlineNode[],
    documentTitles: Record<string, string>
  ): Promise<AIResponse> {
    const client = this.getAnthropicClient();

    // Extract system message
    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await client.messages.create({
      model: this.settings.model,
      max_tokens: this.settings.maxTokens,
      system: systemMessage,
      messages: conversationMessages,
    });

    const content = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    return {
      content,
      citations: parseCitations(content, characters, outlineNodes, documentTitles),
      suggestedEdit: parseSuggestedEdit(content),
      tokenUsage: {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
        total: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  private async sendAnthropicStreamRequest(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    callbacks: AIStreamCallbacks,
    characters: Character[],
    outlineNodes: OutlineNode[],
    documentTitles: Record<string, string>
  ): Promise<void> {
    const client = this.getAnthropicClient();

    // Extract system message
    const systemMessage = messages.find((m) => m.role === 'system')?.content || '';
    const conversationMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    callbacks.onStart?.();

    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    try {
      const stream = client.messages.stream({
        model: this.settings.model,
        max_tokens: this.settings.maxTokens,
        system: systemMessage,
        messages: conversationMessages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          const delta = event.delta;
          if ('text' in delta) {
            fullContent += delta.text;
            callbacks.onToken?.(delta.text);
          }
        } else if (event.type === 'message_delta') {
          if (event.usage) {
            outputTokens = event.usage.output_tokens;
          }
        } else if (event.type === 'message_start') {
          if (event.message.usage) {
            inputTokens = event.message.usage.input_tokens;
          }
        }
      }

      callbacks.onComplete?.({
        content: fullContent,
        citations: parseCitations(fullContent, characters, outlineNodes, documentTitles),
        suggestedEdit: parseSuggestedEdit(fullContent),
        tokenUsage: {
          prompt: inputTokens,
          completion: outputTokens,
          total: inputTokens + outputTokens,
        },
      });
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

// Singleton instance for the application
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}

export function configureAIService(settings: Partial<AISettings>): void {
  getAIService().updateSettings(settings);
}
