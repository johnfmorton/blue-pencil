import { useStore } from '../../stores';
import { Sidebar } from './Sidebar';
import { EditorArea } from '../editor/EditorArea';
import { StatusBar } from './StatusBar';
import { ContextPanel } from '../context/ContextPanel';

export function MainLayout() {
  const editorUI = useStore((state) => state.editorUI);
  const toggleSidebar = useStore((state) => state.toggleSidebar);
  const closeContextPanel = useStore((state) => state.closeContextPanel);

  const showContextPinned =
    editorUI.isContextPanelOpen && editorUI.isContextPanelPinned;
  const showContextOverlay =
    editorUI.isContextPanelOpen && !editorUI.isContextPanelPinned;

  return (
    <div className={`main-layout ${editorUI.focusMode ? 'focus-mode' : ''}`}>
      <header className="app-header">
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          aria-label={editorUI.isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          <span className="hamburger-icon" />
        </button>
        <h1 className="app-title">Blue Pencil</h1>
      </header>

      <div className="main-content">
        {editorUI.isSidebarOpen && <Sidebar />}
        {showContextPinned && <ContextPanel />}
        <div className="editor-wrapper">
          {showContextOverlay && (
            <>
              <div
                className="context-panel-backdrop"
                onClick={closeContextPanel}
              />
              <div className="context-panel-overlay">
                <ContextPanel />
              </div>
            </>
          )}
          <EditorArea />
        </div>
      </div>

      <StatusBar />
    </div>
  );
}
