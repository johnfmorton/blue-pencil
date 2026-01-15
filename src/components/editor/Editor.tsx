import { useEffect, useRef, useCallback } from 'react';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser } from 'prosemirror-model';
import { schema as basicSchema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { history, undo, redo } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, toggleMark, setBlockType } from 'prosemirror-commands';
import { useStore } from '../../stores';
import type { Document, DocumentContent } from '../../types';

// Create extended schema with list support
const schema = new Schema({
  nodes: addListNodes(basicSchema.spec.nodes, 'paragraph block*', 'block'),
  marks: basicSchema.spec.marks,
});

interface EditorProps {
  document: Document;
}

export function Editor({ document }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const updateDocument = useStore((state) => state.updateDocument);
  const editorConfig = useStore((state) => state.editorConfig);

  // Auto-save debounce timer ref
  const saveTimerRef = useRef<number | null>(null);

  // Create editor state from document content
  const createState = useCallback((content: DocumentContent): EditorState => {
    // Convert stored JSON back to ProseMirror doc
    const doc = content.content.length > 0
      ? schema.nodeFromJSON({ type: 'doc', content: content.content })
      : schema.nodeFromJSON({ type: 'doc', content: [{ type: 'paragraph' }] });

    return EditorState.create({
      doc,
      plugins: [
        history(),
        keymap({
          'Mod-z': undo,
          'Mod-Shift-z': redo,
          'Mod-y': redo,
          'Mod-b': toggleMark(schema.marks.strong),
          'Mod-i': toggleMark(schema.marks.em),
          'Mod-`': toggleMark(schema.marks.code),
          'Ctrl-Shift-1': setBlockType(schema.nodes.heading, { level: 1 }),
          'Ctrl-Shift-2': setBlockType(schema.nodes.heading, { level: 2 }),
          'Ctrl-Shift-3': setBlockType(schema.nodes.heading, { level: 3 }),
          'Ctrl-Shift-0': setBlockType(schema.nodes.paragraph),
        }),
        keymap(baseKeymap),
      ],
    });
  }, []);

  // Handle content changes with auto-save
  const handleDispatch = useCallback(
    (tr: Transaction) => {
      if (!viewRef.current) return;

      const newState = viewRef.current.state.apply(tr);
      viewRef.current.updateState(newState);

      // If document content changed, queue auto-save
      if (tr.docChanged && editorConfig.autoSave) {
        // Clear existing timer
        if (saveTimerRef.current) {
          window.clearTimeout(saveTimerRef.current);
        }

        // Queue new save
        saveTimerRef.current = window.setTimeout(() => {
          const content: DocumentContent = {
            type: 'doc',
            content: newState.doc.content.toJSON(),
          };
          updateDocument(document.id, {
            content,
            lastCursorPosition: {
              anchor: newState.selection.anchor,
              head: newState.selection.head,
              documentId: document.id,
              timestamp: new Date(),
            },
          });
        }, editorConfig.autoSaveDelay);
      }
    },
    [document.id, updateDocument, editorConfig.autoSave, editorConfig.autoSaveDelay]
  );

  // Initialize editor view
  useEffect(() => {
    if (!editorRef.current) return;

    const state = createState(document.content);

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction: handleDispatch,
      attributes: {
        class: 'prosemirror-editor',
        spellcheck: editorConfig.spellCheck ? 'true' : 'false',
      },
    });

    viewRef.current = view;

    // Restore cursor position if available
    if (document.lastCursorPosition) {
      const { anchor, head } = document.lastCursorPosition;
      try {
        const tr = view.state.tr.setSelection(
          EditorState.create({ doc: view.state.doc }).selection.constructor.between(
            view.state.doc.resolve(Math.min(anchor, view.state.doc.content.size)),
            view.state.doc.resolve(Math.min(head, view.state.doc.content.size))
          )
        );
        view.dispatch(tr);
        view.focus();
      } catch {
        // Ignore selection restoration errors
      }
    } else {
      view.focus();
    }

    return () => {
      // Save before unmounting
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        const content: DocumentContent = {
          type: 'doc',
          content: view.state.doc.content.toJSON(),
        };
        updateDocument(document.id, {
          content,
          lastCursorPosition: {
            anchor: view.state.selection.anchor,
            head: view.state.selection.head,
            documentId: document.id,
            timestamp: new Date(),
          },
        });
      }
      view.destroy();
    };
  }, [document.id]); // Only re-create when document changes

  // Update spellcheck when config changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.setProps({
        attributes: {
          class: 'prosemirror-editor',
          spellcheck: editorConfig.spellCheck ? 'true' : 'false',
        },
      });
    }
  }, [editorConfig.spellCheck]);

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <ToolbarButton
          onClick={() => {
            if (viewRef.current) {
              toggleMark(schema.marks.strong)(viewRef.current.state, viewRef.current.dispatch);
              viewRef.current.focus();
            }
          }}
          title="Bold (Cmd+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            if (viewRef.current) {
              toggleMark(schema.marks.em)(viewRef.current.state, viewRef.current.dispatch);
              viewRef.current.focus();
            }
          }}
          title="Italic (Cmd+I)"
        >
          <em>I</em>
        </ToolbarButton>
        <span className="toolbar-separator" />
        <ToolbarButton
          onClick={() => {
            if (viewRef.current) {
              setBlockType(schema.nodes.heading, { level: 1 })(viewRef.current.state, viewRef.current.dispatch);
              viewRef.current.focus();
            }
          }}
          title="Heading 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            if (viewRef.current) {
              setBlockType(schema.nodes.heading, { level: 2 })(viewRef.current.state, viewRef.current.dispatch);
              viewRef.current.focus();
            }
          }}
          title="Heading 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => {
            if (viewRef.current) {
              setBlockType(schema.nodes.paragraph)(viewRef.current.state, viewRef.current.dispatch);
              viewRef.current.focus();
            }
          }}
          title="Paragraph"
        >
          P
        </ToolbarButton>
        <span className="toolbar-separator" />
        <ToolbarButton
          onClick={() => {
            if (viewRef.current) {
              setBlockType(schema.nodes.blockquote)(viewRef.current.state, viewRef.current.dispatch);
              viewRef.current.focus();
            }
          }}
          title="Block Quote"
        >
          " "
        </ToolbarButton>
      </div>
      <div ref={editorRef} className="editor-content" />
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="toolbar-button"
    >
      {children}
    </button>
  );
}
