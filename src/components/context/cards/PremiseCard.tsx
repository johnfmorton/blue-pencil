import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../../stores';
import { ContextCard } from '../ContextCard';

export function PremiseCard() {
  const activeProject = useStore((state) => state.activeProject);
  const updateProject = useStore((state) => state.updateProject);
  const [value, setValue] = useState(activeProject?.description ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(activeProject?.description ?? '');
  }, [activeProject?.id, activeProject?.description]);

  const save = useCallback(
    (text: string) => {
      if (!activeProject) return;
      updateProject(activeProject.id, { description: text });
    },
    [activeProject, updateProject]
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
      title="Premise"
      hint="What is your story about? A brief summary helps AI understand your work."
      hasContent={value.length > 0}
    >
      <textarea
        className="context-input context-textarea"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Describe your story premise..."
        rows={3}
      />
    </ContextCard>
  );
}
