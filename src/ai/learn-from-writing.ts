import type { CharacterRole, OutlineNodeType } from '../types';

export interface PendingCharacter {
  name: string;
  role: CharacterRole;
  description: string;
}

export interface PendingOutlineNode {
  title: string;
  type: OutlineNodeType;
  description: string;
}

export interface PendingContext {
  premise?: string;
  genre?: string;
  tone?: string;
  setting?: string;
  themes?: string;
  targetFormat?: string;
  characters: PendingCharacter[];
  outlineNodes: PendingOutlineNode[];
}

export const LEARN_FROM_WRITING_PROMPT = `You are analyzing a fiction manuscript to extract structured project context. Read the provided text carefully and return a JSON object with the following fields. Only include fields where you can reasonably infer the answer from the text. Do not guess or fabricate details.

Return ONLY a JSON object (no markdown fences, no explanation) with these fields:

{
  "premise": "A 1-3 sentence summary of what the story is about",
  "genre": "The primary genre (e.g. Literary Fiction, Fantasy, Sci-Fi, Mystery, Romance, Thriller)",
  "tone": "The overall tone (e.g. Dark, Humorous, Lyrical, Gritty, Whimsical)",
  "setting": "Description of the world, time period, and key locations",
  "themes": "Key themes explored in the text",
  "targetFormat": "novel, novella, short-story, or flash-fiction based on apparent scope",
  "characters": [
    {
      "name": "Character name",
      "role": "protagonist | antagonist | supporting | minor",
      "description": "Brief character description"
    }
  ],
  "outlineNodes": [
    {
      "title": "Section/chapter title or summary",
      "type": "act | chapter | scene",
      "description": "What happens in this section"
    }
  ]
}

Only return the JSON. If a field cannot be determined, omit it entirely.`;

export function parseLearnResponse(content: string): PendingContext {
  const empty: PendingContext = { characters: [], outlineNodes: [] };

  // Strip markdown code fences if present
  let jsonStr = content.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);

    const result: PendingContext = {
      characters: [],
      outlineNodes: [],
    };

    if (typeof parsed.premise === 'string') result.premise = parsed.premise;
    if (typeof parsed.genre === 'string') result.genre = parsed.genre;
    if (typeof parsed.tone === 'string') result.tone = parsed.tone;
    if (typeof parsed.setting === 'string') result.setting = parsed.setting;
    if (typeof parsed.themes === 'string') result.themes = parsed.themes;
    if (typeof parsed.targetFormat === 'string') result.targetFormat = parsed.targetFormat;

    if (Array.isArray(parsed.characters)) {
      const validRoles: CharacterRole[] = ['protagonist', 'antagonist', 'supporting', 'minor', 'mentioned'];
      result.characters = parsed.characters
        .filter(
          (c: unknown): c is { name: string; role: string; description?: string } =>
            typeof c === 'object' && c !== null && typeof (c as Record<string, unknown>).name === 'string'
        )
        .map((c: { name: string; role: string; description?: string }) => ({
          name: c.name,
          role: validRoles.includes(c.role as CharacterRole) ? (c.role as CharacterRole) : 'supporting',
          description: typeof c.description === 'string' ? c.description : '',
        }));
    }

    if (Array.isArray(parsed.outlineNodes)) {
      const validTypes: OutlineNodeType[] = ['act', 'chapter', 'scene', 'beat', 'note'];
      result.outlineNodes = parsed.outlineNodes
        .filter(
          (n: unknown): n is { title: string; type: string; description?: string } =>
            typeof n === 'object' && n !== null && typeof (n as Record<string, unknown>).title === 'string'
        )
        .map((n: { title: string; type: string; description?: string }) => ({
          title: n.title,
          type: validTypes.includes(n.type as OutlineNodeType) ? (n.type as OutlineNodeType) : 'chapter',
          description: typeof n.description === 'string' ? n.description : '',
        }));
    }

    return result;
  } catch {
    return empty;
  }
}
