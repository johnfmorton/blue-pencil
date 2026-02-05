import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '../../../stores';
import { ContextCard } from '../ContextCard';

export function GenreToneCard() {
  const activeProject = useStore((state) => state.activeProject);
  const updateProjectSettings = useStore((state) => state.updateProjectSettings);

  const [genre, setGenre] = useState(activeProject?.settings.genre ?? '');
  const [tone, setTone] = useState(activeProject?.settings.tone ?? '');
  const genreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setGenre(activeProject?.settings.genre ?? '');
    setTone(activeProject?.settings.tone ?? '');
  }, [activeProject?.id, activeProject?.settings.genre, activeProject?.settings.tone]);

  const saveGenre = useCallback(
    (val: string) => {
      if (!activeProject) return;
      updateProjectSettings(activeProject.id, { genre: val });
    },
    [activeProject, updateProjectSettings]
  );

  const saveTone = useCallback(
    (val: string) => {
      if (!activeProject) return;
      updateProjectSettings(activeProject.id, { tone: val });
    },
    [activeProject, updateProjectSettings]
  );

  const handleGenreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGenre(val);
    if (genreTimerRef.current) clearTimeout(genreTimerRef.current);
    genreTimerRef.current = setTimeout(() => saveGenre(val), 500);
  };

  const handleToneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTone(val);
    if (toneTimerRef.current) clearTimeout(toneTimerRef.current);
    toneTimerRef.current = setTimeout(() => saveTone(val), 500);
  };

  return (
    <ContextCard
      title="Genre & Tone"
      hint="Help AI match your style by specifying genre and tone."
      hasContent={genre.length > 0 || tone.length > 0}
    >
      <div className="context-field-group">
        <label className="context-label">Genre</label>
        <input
          type="text"
          className="context-input"
          value={genre}
          onChange={handleGenreChange}
          onBlur={() => {
            if (genreTimerRef.current) clearTimeout(genreTimerRef.current);
            saveGenre(genre);
          }}
          placeholder="e.g. Literary fiction, Sci-fi, Fantasy..."
        />
      </div>
      <div className="context-field-group">
        <label className="context-label">Tone</label>
        <input
          type="text"
          className="context-input"
          value={tone}
          onChange={handleToneChange}
          onBlur={() => {
            if (toneTimerRef.current) clearTimeout(toneTimerRef.current);
            saveTone(tone);
          }}
          placeholder="e.g. Dark, Humorous, Lyrical..."
        />
      </div>
    </ContextCard>
  );
}
