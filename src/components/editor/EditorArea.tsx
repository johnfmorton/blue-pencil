import { useStore } from '../../stores';
import { Editor } from './Editor';

export function EditorArea() {
  const activeDocument = useStore((state) => state.activeDocument);

  if (!activeDocument) {
    return (
      <main className="editor-area empty">
        <div className="empty-state">
          <p>Select a document to start writing, or create a new one.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="editor-area">
      <Editor document={activeDocument} />
    </main>
  );
}
