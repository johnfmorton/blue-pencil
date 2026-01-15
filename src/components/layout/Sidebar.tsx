import { useStore } from '../../stores';
import { DocumentList } from '../documents/DocumentList';
import { AIPanel } from '../ai/AIPanel';
import { OutlinePanel } from '../outline/OutlinePanel';
import { CharacterPanel } from '../characters/CharacterPanel';

type SidebarTab = 'documents' | 'ai-editor' | 'ai-coach' | 'outline' | 'characters';

export function Sidebar() {
  const editorUI = useStore((state) => state.editorUI);
  const setEditorUI = useStore((state) => state.setEditorUI);

  const setActiveTab = (tab: SidebarTab) => {
    if (tab === 'documents') {
      // Documents tab doesn't use activeSidebarTab
      return;
    }
    setEditorUI({ activeSidebarTab: tab as typeof editorUI.activeSidebarTab });
  };

  const tabs: { id: SidebarTab; label: string }[] = [
    { id: 'documents', label: 'Docs' },
    { id: 'outline', label: 'Outline' },
    { id: 'characters', label: 'Characters' },
    { id: 'ai-editor', label: 'AI Editor' },
    { id: 'ai-coach', label: 'AI Coach' },
  ];

  // Show documents list in top half, tabs in bottom half
  return (
    <aside className="sidebar">
      <div className="sidebar-documents">
        <DocumentList />
      </div>

      <div className="sidebar-tabs">
        <nav className="tab-nav">
          {tabs.filter(t => t.id !== 'documents').map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${editorUI.activeSidebarTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="tab-content">
          {editorUI.activeSidebarTab === 'outline' && <OutlinePanel />}
          {editorUI.activeSidebarTab === 'characters' && <CharacterPanel />}
          {editorUI.activeSidebarTab === 'ai-editor' && <AIPanel mode="editor" />}
          {editorUI.activeSidebarTab === 'ai-coach' && <AIPanel mode="coach" />}
        </div>
      </div>
    </aside>
  );
}
