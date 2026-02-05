import { useState } from 'react';
import { useStore } from '../../../stores';
import { ContextCard } from '../ContextCard';
import type { OutlineNodeType } from '../../../types';

export function OutlineCard() {
  const activeProject = useStore((state) => state.activeProject);
  const outlineNodes = useStore((state) => state.outlineNodes);
  const createOutlineNode = useStore((state) => state.createOutlineNode);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<OutlineNodeType>('chapter');
  const [description, setDescription] = useState('');

  const projectNodes = outlineNodes.filter(
    (n) => n.projectId === activeProject?.id && n.parentId === null
  );

  const handleAdd = async () => {
    if (!activeProject || !title.trim()) return;
    await createOutlineNode(activeProject.id, {
      title: title.trim(),
      type,
      description: description.trim(),
    });
    setTitle('');
    setType('chapter');
    setDescription('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAdd();
    }
  };

  const typeLabels: Record<OutlineNodeType, string> = {
    act: 'A',
    chapter: 'C',
    scene: 'S',
    beat: 'B',
    note: 'N',
  };

  return (
    <ContextCard
      title="Outline"
      hint="Sketch out your story structure to help AI understand the arc."
      hasContent={projectNodes.length > 0}
    >
      {projectNodes.length > 0 && (
        <div className="context-outline-list">
          {projectNodes.map((node) => (
            <div key={node.id} className="context-outline-item">
              <span className={`context-outline-type node-type-${node.type}`}>
                {typeLabels[node.type]}
              </span>
              <span className="context-outline-title">{node.title}</span>
            </div>
          ))}
        </div>
      )}
      <div className="context-add-row">
        <select
          className="context-select"
          value={type}
          onChange={(e) => setType(e.target.value as OutlineNodeType)}
        >
          <option value="act">Act</option>
          <option value="chapter">Chapter</option>
          <option value="scene">Scene</option>
          <option value="beat">Beat</option>
          <option value="note">Note</option>
        </select>
        <input
          type="text"
          className="context-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Title"
        />
        <input
          type="text"
          className="context-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Description"
        />
        <button
          className="context-add-button"
          onClick={handleAdd}
          disabled={!title.trim()}
        >
          +
        </button>
      </div>
    </ContextCard>
  );
}
