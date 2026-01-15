import { Plugin, PluginKey, EditorState, Transaction } from 'prosemirror-state';
import { history } from 'prosemirror-history';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { inputRules, wrappingInputRule, textblockTypeInputRule, InputRule } from 'prosemirror-inputrules';
import type { Schema, NodeType } from 'prosemirror-model';
import { buildKeymap, buildBaseKeymap } from './keymap';
import { countWords } from './schema';

// Word count tracking plugin
export const wordCountKey = new PluginKey('wordCount');

interface WordCountState {
  wordCount: number;
  sessionStartCount: number;
}

export function wordCountPlugin(initialCount: number = 0) {
  return new Plugin<WordCountState>({
    key: wordCountKey,
    state: {
      init(_, state) {
        const count = countWords(state.doc);
        return {
          wordCount: count,
          sessionStartCount: initialCount,
        };
      },
      apply(tr, value, _, newState) {
        if (tr.docChanged) {
          return {
            ...value,
            wordCount: countWords(newState.doc),
          };
        }
        return value;
      },
    },
  });
}

export function getWordCount(state: EditorState): WordCountState | undefined {
  return wordCountKey.getState(state);
}

// Auto-save tracking plugin
export const autoSaveKey = new PluginKey('autoSave');

interface AutoSaveState {
  isDirty: boolean;
  lastEditTime: number;
}

export function autoSavePlugin(onSave: (state: EditorState) => void, delay: number = 5000) {
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;

  return new Plugin<AutoSaveState>({
    key: autoSaveKey,
    state: {
      init() {
        return { isDirty: false, lastEditTime: 0 };
      },
      apply(tr, value) {
        if (tr.docChanged) {
          return { isDirty: true, lastEditTime: Date.now() };
        }
        if (tr.getMeta('saved')) {
          return { isDirty: false, lastEditTime: value.lastEditTime };
        }
        return value;
      },
    },
    view(editorView) {
      return {
        update(view, prevState) {
          const state = autoSaveKey.getState(view.state);
          if (state?.isDirty) {
            if (saveTimeout) {
              clearTimeout(saveTimeout);
            }
            saveTimeout = setTimeout(() => {
              onSave(view.state);
            }, delay);
          }
        },
        destroy() {
          if (saveTimeout) {
            clearTimeout(saveTimeout);
          }
        },
      };
    },
  });
}

// Input rules for markdown-like shortcuts
function headingRule(nodeType: NodeType, level: number) {
  return textblockTypeInputRule(
    new RegExp(`^(#{1,${level}})\\s$`),
    nodeType,
    (match) => ({ level: match[1].length })
  );
}

function blockQuoteRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*>\s$/, nodeType);
}

function sceneBreakRule(nodeType: NodeType) {
  return new InputRule(/^(\*\*\*|---|___)\s$/, (state, match, start, end) => {
    return state.tr.replaceWith(start - 1, end, nodeType.create());
  });
}

export function buildInputRules(schema: Schema) {
  const rules: InputRule[] = [];

  if (schema.nodes.blockquote) {
    rules.push(blockQuoteRule(schema.nodes.blockquote));
  }

  if (schema.nodes.heading) {
    for (let i = 1; i <= 4; i++) {
      rules.push(headingRule(schema.nodes.heading, i));
    }
  }

  if (schema.nodes.scene_break) {
    rules.push(sceneBreakRule(schema.nodes.scene_break));
  }

  return inputRules({ rules });
}

// Build all plugins for the editor
export function buildPlugins(
  schema: Schema,
  options: {
    onSave?: (state: EditorState) => void;
    autoSaveDelay?: number;
    initialWordCount?: number;
  } = {}
) {
  const plugins = [
    buildInputRules(schema),
    buildKeymap(schema),
    buildBaseKeymap(schema),
    dropCursor(),
    gapCursor(),
    history(),
    wordCountPlugin(options.initialWordCount ?? 0),
  ];

  if (options.onSave) {
    plugins.push(autoSavePlugin(options.onSave, options.autoSaveDelay ?? 5000));
  }

  return plugins;
}
