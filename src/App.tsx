import { useEffect, useState } from 'react';
import { useStore } from './stores';
import { initDatabase } from './db';
import { MainLayout } from './components/layout/MainLayout';
import { WelcomeScreen } from './components/WelcomeScreen';

export function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeProject = useStore((state) => state.activeProject);

  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
    init();
  }, []);

  if (error) {
    return (
      <div className="app-error">
        <h1>Failed to Initialize</h1>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Loading Blue Pencil...</p>
      </div>
    );
  }

  if (!activeProject) {
    return <WelcomeScreen />;
  }

  return <MainLayout />;
}
