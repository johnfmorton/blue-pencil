import { keymap } from 'prosemirror-keymap';
import { baseKeymap, toggleMark, setBlockType, wrapIn, chainCommands, exitCode, joinUp, joinDown, lift, selectParentNode } from 'prosemirror-commands';
import { undo, redo } from 'prosemirror-history';
import { undoInputRule } from 'prosemirror-inputrules';
import type { Schema } from 'prosemirror-model';
import type { Command } from 'prosemirror-state';

// Mod key detection
const mac = typeof navigator !== 'undefined' ? /Mac|iP(hone|[oa]d)/.test(navigator.platform) : false;

export function buildKeymap(schema: Schema) {
  const keys: Record<string, Command> = {};

  // Basic formatting
  if (schema.marks.strong) {
    keys['Mod-b'] = toggleMark(schema.marks.strong);
    keys['Mod-B'] = toggleMark(schema.marks.strong);
  }

  if (schema.marks.em) {
    keys['Mod-i'] = toggleMark(schema.marks.em);
    keys['Mod-I'] = toggleMark(schema.marks.em);
  }

  if (schema.marks.underline) {
    keys['Mod-u'] = toggleMark(schema.marks.underline);
    keys['Mod-U'] = toggleMark(schema.marks.underline);
  }

  // Headings
  if (schema.nodes.heading) {
    keys['Mod-1'] = setBlockType(schema.nodes.heading, { level: 1 });
    keys['Mod-2'] = setBlockType(schema.nodes.heading, { level: 2 });
    keys['Mod-3'] = setBlockType(schema.nodes.heading, { level: 3 });
  }

  // Paragraph (reset to normal)
  if (schema.nodes.paragraph) {
    keys['Mod-0'] = setBlockType(schema.nodes.paragraph);
  }

  // Blockquote
  if (schema.nodes.blockquote) {
    keys['Mod->'] = wrapIn(schema.nodes.blockquote);
  }

  // History
  keys['Mod-z'] = undo;
  keys['Shift-Mod-z'] = redo;
  if (!mac) {
    keys['Mod-y'] = redo;
  }

  // Escape from code/heading
  keys['Backspace'] = undoInputRule;

  // Selection and movement
  keys['Alt-ArrowUp'] = joinUp;
  keys['Alt-ArrowDown'] = joinDown;
  keys['Mod-BracketLeft'] = lift;
  keys['Escape'] = selectParentNode;

  // Hard break
  if (schema.nodes.hard_break) {
    const cmd = chainCommands(exitCode, (state, dispatch) => {
      if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView());
      }
      return true;
    });
    keys['Mod-Enter'] = cmd;
    keys['Shift-Enter'] = cmd;
    if (mac) {
      keys['Ctrl-Enter'] = cmd;
    }
  }

  return keymap(keys);
}

export function buildBaseKeymap(schema: Schema) {
  return keymap(baseKeymap);
}
