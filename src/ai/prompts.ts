import type { AIMode, AIRequest } from './types';
import type { AIContextSnapshot, Character, OutlineNode } from '../types';

// System prompts for different AI modes
export const SYSTEM_PROMPTS: Record<AIMode, string> = {
  editor: `You are an expert fiction editor working with an author on their manuscript. Your role is to provide:
- Grammar, spelling, and punctuation corrections
- Style and prose quality improvements
- Consistency checks against the project context
- Line-level feedback with specific, actionable suggestions

When suggesting edits, always explain WHY the change improves the writing. Be encouraging but honest.

When referencing project elements, use citations in this format:
- [doc:ID] for documents
- [char:ID] for characters
- [outline:ID] for outline nodes

Keep responses focused and practical. Prioritize the most impactful suggestions.`,

  coach: `You are a writing coach and story consultant helping an author develop their craft. Your role is to provide:
- Big-picture story guidance (structure, pacing, arc)
- Character development advice
- Theme and subtext analysis
- Craft techniques and suggestions

Focus on the WHY behind storytelling choices. Help the author understand the principles so they can apply them independently.

When referencing project elements, use citations in this format:
- [doc:ID] for documents
- [char:ID] for characters
- [outline:ID] for outline nodes

Be supportive but challenge the author to grow. Ask thought-provoking questions when appropriate.`,
};

// Build context section for prompts
export function buildContextSection(context: AIContextSnapshot): string {
  const sections: string[] = [];

  // Project summary
  if (context.projectSummary) {
    sections.push(`## Project Overview\n${context.projectSummary}`);
  }

  // Current document summary
  if (context.documentSummary) {
    sections.push(`## Current Document\n${context.documentSummary}`);
  }

  // Active characters
  if (context.activeCharacterIds.length > 0) {
    sections.push(`## Relevant Characters\nCharacter IDs in scene: ${context.activeCharacterIds.join(', ')}`);
  }

  // Active outline nodes
  if (context.activeOutlineNodeIds.length > 0) {
    sections.push(`## Relevant Outline Nodes\nOutline node IDs: ${context.activeOutlineNodeIds.join(', ')}`);
  }

  // Recent edits
  if (context.recentEdits.length > 0) {
    const recentChanges = context.recentEdits
      .slice(0, 5)
      .map((edit) => `- ${edit.changeType}: "${edit.textSnippet.substring(0, 50)}..."`)
      .join('\n');
    sections.push(`## Recent Changes\n${recentChanges}`);
  }

  // Context freshness warning
  if (context.staleness === 'stale' || context.staleness === 'outdated') {
    sections.push(`\n⚠️ Note: Project context may be ${context.staleness}. Some details might not reflect the latest changes.`);
  }

  return sections.join('\n\n');
}

// Build character context
export function buildCharacterContext(characters: Character[]): string {
  if (characters.length === 0) return '';

  const characterDescriptions = characters.map((char) => {
    const parts = [`### ${char.name} [char:${char.id}]`];
    parts.push(`- Role: ${char.role}`);
    if (char.aliases.length > 0) {
      parts.push(`- Also known as: ${char.aliases.join(', ')}`);
    }
    if (char.description) {
      parts.push(`- Description: ${char.description}`);
    }
    if (char.attributes.personality) {
      parts.push(`- Personality: ${char.attributes.personality}`);
    }
    if (char.attributes.speech) {
      parts.push(`- Speech pattern: ${char.attributes.speech}`);
    }
    return parts.join('\n');
  });

  return `## Characters\n${characterDescriptions.join('\n\n')}`;
}

// Build outline context
export function buildOutlineContext(nodes: OutlineNode[]): string {
  if (nodes.length === 0) return '';

  const nodeDescriptions = nodes.map((node) => {
    const parts = [`### ${node.type.toUpperCase()}: ${node.title} [outline:${node.id}]`];
    parts.push(`- Status: ${node.status}`);
    if (node.description) {
      parts.push(`- Description: ${node.description}`);
    }
    if (node.metadata.pov) {
      parts.push(`- POV: ${node.metadata.pov}`);
    }
    if (node.metadata.location) {
      parts.push(`- Location: ${node.metadata.location}`);
    }
    if (node.metadata.tension) {
      parts.push(`- Tension level: ${node.metadata.tension}/10`);
    }
    return parts.join('\n');
  });

  return `## Story Structure\n${nodeDescriptions.join('\n\n')}`;
}

// Build the full prompt for an AI request
export function buildPrompt(
  request: AIRequest,
  characters: Character[] = [],
  outlineNodes: OutlineNode[] = []
): string {
  const parts: string[] = [];

  // Context section
  parts.push('# Project Context');
  parts.push(buildContextSection(request.context));

  // Character context
  const charContext = buildCharacterContext(characters);
  if (charContext) {
    parts.push(charContext);
  }

  // Outline context
  const outlineContext = buildOutlineContext(outlineNodes);
  if (outlineContext) {
    parts.push(outlineContext);
  }

  // Selected text
  if (request.selectedText) {
    parts.push('# Selected Text for Review');
    parts.push('```');
    parts.push(request.selectedText);
    parts.push('```');
  }

  // User's specific request
  parts.push('# Author\'s Request');
  parts.push(request.userMessage);

  return parts.join('\n\n');
}

// Build messages array for API call
export function buildMessages(
  request: AIRequest,
  characters: Character[] = [],
  outlineNodes: OutlineNode[] = []
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

  // System prompt
  messages.push({
    role: 'system',
    content: SYSTEM_PROMPTS[request.mode],
  });

  // Include conversation history if present
  if (request.conversationHistory && request.conversationHistory.length > 0) {
    for (const msg of request.conversationHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }
  }

  // Current user message with context
  messages.push({
    role: 'user',
    content: buildPrompt(request, characters, outlineNodes),
  });

  return messages;
}
