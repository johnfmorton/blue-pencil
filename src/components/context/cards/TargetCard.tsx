import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../../stores';
import { ContextCard } from '../ContextCard';

export function TargetCard() {
  const activeProject = useStore((state) => state.activeProject);
  const updateProjectSettings = useStore((state) => state.updateProjectSettings);

  const [targetLength, setTargetLength] = useState<string>(
    activeProject?.settings.targetLength?.toString() ?? ''
  );
  const [targetFormat, setTargetFormat] = useState(
    activeProject?.settings.targetFormat ?? ''
  );
  const lengthTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setTargetLength(activeProject?.settings.targetLength?.toString() ?? '');
    setTargetFormat(activeProject?.settings.targetFormat ?? '');
  }, [activeProject?.id, activeProject?.settings.targetLength, activeProject?.settings.targetFormat]);

  const saveLength = useCallback(
    (val: string) => {
      if (!activeProject) return;
      const num = parseInt(val, 10);
      updateProjectSettings(activeProject.id, {
        targetLength: isNaN(num) ? undefined : num,
      });
    },
    [activeProject, updateProjectSettings]
  );

  const saveFormat = useCallback(
    (val: string) => {
      if (!activeProject) return;
      updateProjectSettings(activeProject.id, { targetFormat: val || undefined });
    },
    [activeProject, updateProjectSettings]
  );

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTargetLength(val);
    if (lengthTimerRef.current) clearTimeout(lengthTimerRef.current);
    lengthTimerRef.current = setTimeout(() => saveLength(val), 500);
  };

  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setTargetFormat(val);
    saveFormat(val);
  };

  const hasContent = targetLength.length > 0 || targetFormat.length > 0;

  return (
    <ContextCard
      title="Target"
      hint="Set goals for your project length and format."
      hasContent={hasContent}
      defaultExpanded={false}
    >
      <div className="context-field-group">
        <label className="context-label">Format</label>
        <select
          className="context-select context-select-full"
          value={targetFormat}
          onChange={handleFormatChange}
        >
          <option value="">Select format...</option>
          <option value="novel">Novel</option>
          <option value="novella">Novella</option>
          <option value="short-story">Short Story</option>
          <option value="flash-fiction">Flash Fiction</option>
          <option value="screenplay">Screenplay</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="context-field-group">
        <label className="context-label">Target word count</label>
        <input
          type="number"
          className="context-input"
          value={targetLength}
          onChange={handleLengthChange}
          onBlur={() => {
            if (lengthTimerRef.current) clearTimeout(lengthTimerRef.current);
            saveLength(targetLength);
          }}
          placeholder="e.g. 80000"
          min={0}
        />
      </div>
    </ContextCard>
  );
}
