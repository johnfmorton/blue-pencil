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
      } catch (err) {
        // Database init may fail (wa-sqlite API mismatch) but
        // store operations currently use in-memory state, so
        // the app can still function without it.
        console.warn('Database initialization failed, running in-memory only:', err);
      }
      setIsInitialized(true);
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
