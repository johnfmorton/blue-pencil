import { useState } from 'react';
import { useStore } from '../../stores';
import type { Character, CharacterRole } from '../../types';

export function CharacterPanel() {
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState<CharacterRole>('supporting');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const activeProject = useStore((state) => state.activeProject);
  const characters = useStore((state) => state.characters);
  const createCharacter = useStore((state) => state.createCharacter);
  const updateCharacter = useStore((state) => state.updateCharacter);
  const deleteCharacter = useStore((state) => state.deleteCharacter);

  const projectCharacters = characters.filter((c) => c.projectId === activeProject?.id);

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim() || !activeProject) return;

    await createCharacter(activeProject.id, {
      name: newCharName.trim(),
      role: newCharRole,
    });
    setNewCharName('');
  };

  const roleColors: Record<CharacterRole, string> = {
    protagonist: '#4CAF50',
    antagonist: '#f44336',
    supporting: '#2196F3',
    minor: '#9E9E9E',
    mentioned: '#BDBDBD',
  };

  return (
    <div className="character-panel">
      <h4 className="panel-title">Characters</h4>

      {selectedCharacter ? (
        <CharacterDetail
          character={selectedCharacter}
          onBack={() => setSelectedCharacter(null)}
          onUpdate={(updates) => updateCharacter(selectedCharacter.id, updates)}
          onDelete={() => {
            deleteCharacter(selectedCharacter.id);
            setSelectedCharacter(null);
          }}
        />
      ) : (
        <>
          <ul className="character-list">
            {projectCharacters.length === 0 ? (
              <li className="empty-state">No characters yet. Add one below.</li>
            ) : (
              projectCharacters.map((char) => (
                <li key={char.id} className="character-item">
                  <button
                    className="character-button"
                    onClick={() => setSelectedCharacter(char)}
                  >
                    <span
                      className="character-role-dot"
                      style={{ backgroundColor: roleColors[char.role] }}
                    />
                    <span className="character-name">{char.name}</span>
                    <span className="character-role">{char.role}</span>
                  </button>
                </li>
              ))
            )}
          </ul>

          <form onSubmit={handleCreateCharacter} className="new-character-form">
            <input
              type="text"
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              placeholder="Character name..."
              className="new-character-input"
            />
            <select
              value={newCharRole}
              onChange={(e) => setNewCharRole(e.target.value as CharacterRole)}
              className="character-role-select"
            >
              <option value="protagonist">Protagonist</option>
              <option value="antagonist">Antagonist</option>
              <option value="supporting">Supporting</option>
              <option value="minor">Minor</option>
              <option value="mentioned">Mentioned</option>
            </select>
            <button type="submit" disabled={!newCharName.trim()} className="new-character-button">
              +
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function CharacterDetail({
  character,
  onBack,
  onUpdate,
  onDelete,
}: {
  character: Character;
  onBack: () => void;
  onUpdate: (updates: Partial<Character>) => void;
  onDelete: () => void;
}) {
  const [description, setDescription] = useState(character.description);
  const [aliases, setAliases] = useState(character.aliases.join(', '));

  const handleSave = () => {
    onUpdate({
      description,
      aliases: aliases.split(',').map((a) => a.trim()).filter(Boolean),
    });
  };

  return (
    <div className="character-detail">
      <button className="back-button" onClick={onBack}>
        &larr; Back to list
      </button>

      <h5 className="character-name">{character.name}</h5>
      <span className="character-role-badge">{character.role}</span>

      <div className="form-group">
        <label>Aliases (comma-separated)</label>
        <input
          type="text"
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
          placeholder="Nicknames, titles..."
          className="alias-input"
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Character description..."
          rows={4}
          className="description-input"
        />
      </div>

      <div className="character-actions">
        <button onClick={handleSave} className="save-button">
          Save Changes
        </button>
        <button onClick={onDelete} className="delete-button">
          Delete Character
        </button>
      </div>
    </div>
  );
}
