import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../stores';

export function DocumentList() {
  const [newDocTitle, setNewDocTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const activeProject = useStore((state) => state.activeProject);
  const documents = useStore((state) => state.documents);
  const activeDocument = useStore((state) => state.activeDocument);
  const createDocument = useStore((state) => state.createDocument);
  const setActiveDocument = useStore((state) => state.setActiveDocument);
  const deleteDocument = useStore((state) => state.deleteDocument);
  const updateDocument = useStore((state) => state.updateDocument);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const projectDocs = documents
    .filter((d) => d.projectId === activeProject?.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !activeProject) return;

    setIsCreating(true);
    await createDocument(activeProject.id, newDocTitle.trim());
    setNewDocTitle('');
    setIsCreating(false);
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this document? This cannot be undone.')) {
      await deleteDocument(id);
    }
  };

  const startRenaming = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameValue(currentTitle);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      updateDocument(renamingId, { title: renameValue.trim() });
    }
    setRenamingId(null);
    setRenameValue('');
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  return (
    <div className="document-list">
      <div className="document-list-header">
        <h3>Documents</h3>
      </div>

      <ul className="documents">
        {projectDocs.map((doc) => (
          <li key={doc.id} className="document-item">
            {renamingId === doc.id ? (
              <form
                className="rename-form"
                onSubmit={(e) => { e.preventDefault(); commitRename(); }}
              >
                <input
                  ref={renameInputRef}
                  className="rename-input"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Escape') cancelRename(); }}
                />
              </form>
            ) : (
              <>
                <button
                  className={`document-button ${activeDocument?.id === doc.id ? 'active' : ''}`}
                  onClick={() => setActiveDocument(doc.id)}
                  onDoubleClick={(e) => startRenaming(doc.id, doc.title, e)}
                >
                  <span className="document-title">{doc.title}</span>
                  <span className="document-words">{doc.wordCount}</span>
                </button>
                <button
                  className="delete-button"
                  onClick={(e) => handleDeleteDocument(doc.id, e)}
                  title="Delete document"
                >
                  &times;
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={handleCreateDocument} className="new-document-form">
        <input
          type="text"
          value={newDocTitle}
          onChange={(e) => setNewDocTitle(e.target.value)}
          placeholder="New document..."
          className="new-document-input"
        />
        <button
          type="submit"
          disabled={!newDocTitle.trim() || isCreating}
          className="new-document-button"
        >
          +
        </button>
      </form>
    </div>
  );
}
