import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../../stores';
import { ContextCard } from '../ContextCard';

export function ThemesCard() {
  const activeProject = useStore((state) => state.activeProject);
  const updateProjectSettings = useStore((state) => state.updateProjectSettings);
  const [value, setValue] = useState(activeProject?.settings.themes ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(activeProject?.settings.themes ?? '');
  }, [activeProject?.id, activeProject?.settings.themes]);

  const save = useCallback(
    (text: string) => {
      if (!activeProject) return;
      updateProjectSettings(activeProject.id, { themes: text });
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
      title="Themes"
      hint="What themes does your story explore?"
      hasContent={value.length > 0}
    >
      <textarea
        className="context-input context-textarea"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="e.g. Identity, power, redemption..."
        rows={2}
      />
    </ContextCard>
  );
}
