import { useStore } from '../../stores';
import { Editor } from './Editor';

export function EditorArea() {
  const activeDocument = useStore((state) => state.activeDocument);
  const toggleContextPanel = useStore((state) => state.toggleContextPanel);
  const focusMode = useStore((state) => state.editorUI.focusMode);

  if (!activeDocument) {
    return (
      <main className="editor-area empty">
        {!focusMode && (
          <button
            className="context-panel-tab"
            onClick={toggleContextPanel}
            title="Project Context"
          >
            Context
          </button>
        )}
        <div className="empty-state">
          <p>Select a document to start writing, or create a new one.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="editor-area">
      {!focusMode && (
        <button
          className="context-panel-tab"
          onClick={toggleContextPanel}
          title="Project Context"
        >
          Context
        </button>
      )}
      <Editor document={activeDocument} />
    </main>
  );
}
