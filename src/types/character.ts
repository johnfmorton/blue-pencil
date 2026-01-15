export type CharacterRole =
  | 'protagonist'
  | 'antagonist'
  | 'supporting'
  | 'minor'
  | 'mentioned';

export interface Character {
  id: string;
  projectId: string;
  name: string;
  aliases: string[];
  role: CharacterRole;
  description: string;
  attributes: CharacterAttributes;
  relationships: CharacterRelationship[];
  arc: CharacterArc | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CharacterAttributes {
  age?: string;
  occupation?: string;
  physicalDescription?: string;
  personality?: string;
  backstory?: string;
  goals?: string;
  fears?: string;
  strengths?: string;
  weaknesses?: string;
  speech?: string;
  customFields?: Record<string, string>;
}

export interface CharacterRelationship {
  characterId: string;
  relationshipType: string;
  description: string;
}

export interface CharacterArc {
  startingState: string;
  endingState: string;
  keyMoments: string[];
}

export interface CharacterPresence {
  characterId: string;
  documentId: string;
  sectionId: string | null;
  mentions: CharacterMention[];
}

export interface CharacterMention {
  position: number;
  length: number;
  nameUsed: string;
  context: string;
}
