import { useState } from 'react';
import { useStore } from '../../../stores';
import { ContextCard } from '../ContextCard';
import type { CharacterRole } from '../../../types';

export function CharactersCard() {
  const activeProject = useStore((state) => state.activeProject);
  const characters = useStore((state) => state.characters);
  const createCharacter = useStore((state) => state.createCharacter);

  const [name, setName] = useState('');
  const [role, setRole] = useState<CharacterRole>('supporting');
  const [description, setDescription] = useState('');

  const projectCharacters = characters.filter(
    (c) => c.projectId === activeProject?.id
  );

  const handleAdd = async () => {
    if (!activeProject || !name.trim()) return;
    await createCharacter(activeProject.id, {
      name: name.trim(),
      role,
      description: description.trim(),
    });
    setName('');
    setRole('supporting');
    setDescription('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const roleColors: Record<CharacterRole, string> = {
    protagonist: '#28a745',
    antagonist: '#dc3545',
    supporting: '#4a90d9',
    minor: '#6c757d',
    mentioned: '#adb5bd',
  };

  return (
    <ContextCard
      title="Characters"
      hint="Add your main characters so AI can track consistency."
      hasContent={projectCharacters.length > 0}
    >
      {projectCharacters.length > 0 && (
        <div className="context-character-list">
          {projectCharacters.map((char) => (
            <div key={char.id} className="context-character-item">
              <span
                className="context-character-dot"
                style={{ background: roleColors[char.role] }}
              />
              <span className="context-character-name">{char.name}</span>
              <span className="context-character-role">{char.role}</span>
            </div>
          ))}
        </div>
      )}
      <div className="context-add-row">
        <input
          type="text"
          className="context-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Character name"
        />
        <select
          className="context-select"
          value={role}
          onChange={(e) => setRole(e.target.value as CharacterRole)}
        >
          <option value="protagonist">Protagonist</option>
          <option value="antagonist">Antagonist</option>
          <option value="supporting">Supporting</option>
          <option value="minor">Minor</option>
        </select>
        <input
          type="text"
          className="context-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Brief description"
        />
        <button
          className="context-add-button"
          onClick={handleAdd}
          disabled={!name.trim()}
        >
          +
        </button>
      </div>
    </ContextCard>
  );
}
