import { nanoid } from 'nanoid';

export function generateId(): string {
  return nanoid();
}

export function generateShortId(): string {
  return nanoid(10);
}
