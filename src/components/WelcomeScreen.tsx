import { useState } from 'react';
import { useStore } from '../stores';

export function WelcomeScreen() {
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const createProject = useStore((state) => state.createProject);
  const createDocument = useStore((state) => state.createDocument);
  const openContextPanel = useStore((state) => state.openContextPanel);
  const projects = useStore((state) => state.projects);
  const setActiveProject = useStore((state) => state.setActiveProject);

  const handleStartWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setIsCreating(true);
    const project = await createProject(projectName.trim());
    await createDocument(project.id, 'Untitled');
    setIsCreating(false);
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
