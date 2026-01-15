import { useStore } from '../../stores';
import { Sidebar } from './Sidebar';
import { EditorArea } from '../editor/EditorArea';
import { StatusBar } from './StatusBar';

export function MainLayout() {
  const editorUI = useStore((state) => state.editorUI);
  const toggleSidebar = useStore((state) => state.toggleSidebar);

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
        <EditorArea />
      </div>

      <StatusBar />
    </div>
  );
}
