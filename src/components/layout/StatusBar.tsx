import { useStore } from '../../stores';

export function StatusBar() {
  const activeDocument = useStore((state) => state.activeDocument);
  const editorUI = useStore((state) => state.editorUI);
  const aiContext = useStore((state) => state.aiContext);

  const stalenessColor = {
    fresh: 'var(--color-success)',
    recent: 'var(--color-success)',
    stale: 'var(--color-warning)',
    outdated: 'var(--color-error)',
  };

  return (
    <footer className="status-bar">
      <div className="status-left">
        {activeDocument && (
          <>
            <span className="word-count">
              {activeDocument.wordCount.toLocaleString()} words
            </span>
            <span className="separator">|</span>
            <span className="document-title">{activeDocument.title}</span>
          </>
        )}
      </div>

      <div className="status-right">
        {aiContext && (
          <span
            className="context-status"
            style={{ color: stalenessColor[aiContext.staleness] }}
          >
            Context: {aiContext.staleness}
          </span>
        )}
        {editorUI.focusMode && (
          <span className="focus-indicator">Focus Mode</span>
        )}
      </div>
    </footer>
  );
}
