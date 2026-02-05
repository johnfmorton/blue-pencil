import { useStore, useHasHydrated } from './stores';
import { MainLayout } from './components/layout/MainLayout';
import { WelcomeScreen } from './components/WelcomeScreen';

export function App() {
  const hasHydrated = useHasHydrated();
  const activeProject = useStore((state) => state.activeProject);

  if (!hasHydrated) {
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
