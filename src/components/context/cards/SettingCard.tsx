import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../../stores';
import { ContextCard } from '../ContextCard';

export function SettingCard() {
  const activeProject = useStore((state) => state.activeProject);
  const updateProjectSettings = useStore((state) => state.updateProjectSettings);
  const [value, setValue] = useState(activeProject?.settings.setting ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(activeProject?.settings.setting ?? '');
  }, [activeProject?.id, activeProject?.settings.setting]);

  const save = useCallback(
    (text: string) => {
      if (!activeProject) return;
      updateProjectSettings(activeProject.id, { setting: text });
    },
    [activeProject, updateProjectSettings]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(text), 500);
  };

  const handleBlur = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    save(value);
  };

  return (
    <ContextCard
      title="Setting"
      hint="Describe the world, time period, and key locations."
      hasContent={value.length > 0}
    >
      <textarea
        className="context-input context-textarea"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Describe your story's setting..."
        rows={3}
      />
    </ContextCard>
  );
}
