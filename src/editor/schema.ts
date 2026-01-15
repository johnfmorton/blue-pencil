import { Schema, NodeSpec, MarkSpec } from 'prosemirror-model';

// Node types for the editor
const nodes: Record<string, NodeSpec> = {
  doc: {
    content: 'block+',
  },
  paragraph: {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
      return ['p', 0];
    },
  },
  heading: {
    attrs: { level: { default: 1, validate: 'number' } },
    content: 'inline*',
    group: 'block',
    defining: true,
    parseDOM: [
      { tag: 'h1', attrs: { level: 1 } },
      { tag: 'h2', attrs: { level: 2 } },
      { tag: 'h3', attrs: { level: 3 } },
      { tag: 'h4', attrs: { level: 4 } },
    ],
    toDOM(node) {
      return ['h' + node.attrs.level, 0];
    },
  },
  blockquote: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{ tag: 'blockquote' }],
    toDOM() {
      return ['blockquote', 0];
    },
  },
  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM() {
      return ['hr'];
    },
  },
  scene_break: {
    group: 'block',
    parseDOM: [{ tag: 'div', getAttrs: (dom) => (dom as HTMLElement).classList.contains('scene-break') ? {} : false }],
    toDOM() {
      return ['div', { class: 'scene-break' }, '* * *'];
    },
  },
  text: {
    group: 'inline',
  },
  hard_break: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() {
      return ['br'];
    },
  },
};

// Mark types (inline formatting)
const marks: Record<string, MarkSpec> = {
  strong: {
    parseDOM: [
      { tag: 'strong' },
      { tag: 'b', getAttrs: (node) => (node as HTMLElement).style.fontWeight !== 'normal' && null },
      { style: 'font-weight=bold' },
      { style: 'font-weight', getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value as string) && null },
    ],
    toDOM() {
      return ['strong', 0];
    },
  },
  em: {
    parseDOM: [
      { tag: 'i' },
      { tag: 'em' },
      { style: 'font-style=italic' },
    ],
    toDOM() {
      return ['em', 0];
    },
  },
  underline: {
    parseDOM: [
      { tag: 'u' },
      { style: 'text-decoration=underline' },
    ],
    toDOM() {
      return ['u', 0];
    },
  },
  strikethrough: {
    parseDOM: [
      { tag: 's' },
      { tag: 'strike' },
      { style: 'text-decoration=line-through' },
    ],
    toDOM() {
      return ['s', 0];
    },
  },
};

export const editorSchema = new Schema({ nodes, marks });

// Helper to count words in a document
export function countWords(doc: Node): number {
  let count = 0;
  doc.descendants((node) => {
    if (node.isText && node.text) {
      const words = node.text.trim().split(/\s+/).filter((w) => w.length > 0);
      count += words.length;
    }
    return true;
  });
  return count;
}

// Convert ProseMirror doc to plain text
export function docToPlainText(doc: Node): string {
  const blocks: string[] = [];
  doc.forEach((node) => {
    if (node.isTextblock) {
      blocks.push(node.textContent);
    }
  });
  return blocks.join('\n\n');
}
