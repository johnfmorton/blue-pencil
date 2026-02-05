import { useStore } from '../../stores';
import { PremiseCard } from './cards/PremiseCard';
import { GenreToneCard } from './cards/GenreToneCard';
import { CharactersCard } from './cards/CharactersCard';
import { OutlineCard } from './cards/OutlineCard';
import { SettingCard } from './cards/SettingCard';
import { ThemesCard } from './cards/ThemesCard';
import { TargetCard } from './cards/TargetCard';
import { LearnFromWritingButton } from './LearnFromWritingButton';

export function ContextPanel() {
  const closeContextPanel = useStore((state) => state.closeContextPanel);
  const setContextPanelPinned = useStore((state) => state.setContextPanelPinned);
  const isPinned = useStore((state) => state.editorUI.isContextPanelPinned);

  return (
    <div className="context-panel">
      <div className="context-panel-header">
        <h2 className="context-panel-title">Project Context</h2>
        <div className="context-panel-actions">
          <button
            className={`context-pin-button ${isPinned ? 'pinned' : ''}`}
            onClick={() => setContextPanelPinned(!isPinned)}
            aria-label={isPinned ? 'Unpin panel' : 'Pin panel'}
            title={isPinned ? 'Unpin (overlay mode)' : 'Pin (split view)'}
          >
            &#9745;
          </button>
          <button
            className="context-close-button"
            onClick={closeContextPanel}
            aria-label="Close context panel"
          >
            &times;
          </button>
        </div>
      </div>
      <div className="context-panel-body">
        <PremiseCard />
        <GenreToneCard />
        <CharactersCard />
        <OutlineCard />
        <SettingCard />
        <ThemesCard />
        <TargetCard />
        <LearnFromWritingButton />
      </div>
    </div>
  );
}
