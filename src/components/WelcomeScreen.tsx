import { useState, useRef } from 'react';
import { useStore } from '../stores';
import { parseProjectFile, prepareImport } from '../utils/project-io';

export function WelcomeScreen() {
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createProject = useStore((state) => state.createProject);
  const createDocument = useStore((state) => state.createDocument);
  const openContextPanel = useStore((state) => state.openContextPanel);
  const projects = useStore((state) => state.projects);
  const setActiveProject = useStore((state) => state.setActiveProject);
  const importProjectData = useStore((state) => state.importProjectData);

  const handleStartWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setIsCreating(true);
    const project = await createProject(projectName.trim());
    await createDocument(project.id, 'Untitled');
    setIsCreating(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    try {
      const raw = await parseProjectFile(file);
      const existingIds = projects.map((p) => p.id);
      const prepared = prepareImport(raw, existingIds);
      importProjectData(prepared);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import project.');
    }

    // Reset the input so the same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSetUpProject = async () => {
    if (!projectName.trim()) return;

    setIsCreating(true);
    await createProject(projectName.trim());
    openContextPanel();
    setIsCreating(false);
  };

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <h1 className="welcome-title">Blue Pencil</h1>
        <p className="welcome-subtitle">
          A writing app for fiction and nonfiction authors with AI-powered editorial assistance.
        </p>

        <div className="welcome-actions">
          <form onSubmit={handleStartWriting} className="create-project-form">
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name..."
              className="project-name-input"
              autoFocus
            />
          </form>
          <div className="create-project-actions">
            <button
              type="button"
              disabled={!projectName.trim() || isCreating}
              className="create-button"
              onClick={handleStartWriting as unknown as React.MouseEventHandler}
            >
              {isCreating ? 'Creating...' : 'Start Writing'}
            </button>
            <button
              type="button"
              disabled={!projectName.trim() || isCreating}
              className="create-button-secondary"
              onClick={handleSetUpProject}
            >
              Set Up Project First
            </button>
          </div>

          <div className="import-project-section">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="import-file-input"
            />
            <button
              type="button"
              className="import-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Import Project
            </button>
            {importError && (
              <p className="import-error">{importError}</p>
            )}
          </div>

          {projects.length > 0 && (
            <div className="recent-projects">
              <h3>Recent Projects</h3>
              <ul className="project-list">
                {projects.map((project) => (
                  <li key={project.id}>
                    <button
                      onClick={() => setActiveProject(project.id)}
                      className="project-item"
                    >
                      <span className="project-name">{project.name}</span>
                      <span className="project-date">
                        {project.updatedAt.toLocaleDateString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
