import { useState } from 'react';
import { useStore } from '../../stores';
import type { OutlineNode, OutlineNodeType, OutlineStatus } from '../../types';

export function OutlinePanel() {
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeType, setNewNodeType] = useState<OutlineNodeType>('scene');

  const activeProject = useStore((state) => state.activeProject);
  const outlineNodes = useStore((state) => state.outlineNodes);
  const createOutlineNode = useStore((state) => state.createOutlineNode);
  const updateOutlineNode = useStore((state) => state.updateOutlineNode);
  const deleteOutlineNode = useStore((state) => state.deleteOutlineNode);

  const projectNodes = outlineNodes
    .filter((n) => n.projectId === activeProject?.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Build tree structure
  const rootNodes = projectNodes.filter((n) => !n.parentId);

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim() || !activeProject) return;

    await createOutlineNode(activeProject.id, {
      title: newNodeTitle.trim(),
      type: newNodeType,
    });
    setNewNodeTitle('');
  };

  const handleStatusChange = (nodeId: string, status: OutlineStatus) => {
    updateOutlineNode(nodeId, { status });
  };

  const renderNode = (node: OutlineNode, depth: number = 0) => {
    const children = projectNodes.filter((n) => n.parentId === node.id);

    return (
      <li key={node.id} className="outline-node" style={{ marginLeft: depth * 16 }}>
        <div className="node-content">
          <span className={`node-type node-type-${node.type}`}>{node.type[0].toUpperCase()}</span>
          <span className="node-title">{node.title}</span>
          <select
            className="node-status"
            value={node.status}
            onChange={(e) => handleStatusChange(node.id, e.target.value as OutlineStatus)}
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="draft">Draft</option>
            <option value="revised">Revised</option>
            <option value="complete">Complete</option>
          </select>
          <button
            className="delete-node"
            onClick={() => deleteOutlineNode(node.id)}
            title="Delete node"
          >
            &times;
          </button>
        </div>
        {children.length > 0 && (
          <ul className="node-children">
            {children.map((child) => renderNode(child, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="outline-panel">
      <h4 className="panel-title">Outline</h4>

      <ul className="outline-tree">
        {rootNodes.length === 0 ? (
          <li className="empty-state">No outline nodes yet. Add one below.</li>
        ) : (
          rootNodes.map((node) => renderNode(node))
        )}
      </ul>

      <form onSubmit={handleCreateNode} className="new-node-form">
        <select
          value={newNodeType}
          onChange={(e) => setNewNodeType(e.target.value as OutlineNodeType)}
          className="node-type-select"
        >
          <option value="act">Act</option>
          <option value="chapter">Chapter</option>
          <option value="scene">Scene</option>
          <option value="beat">Beat</option>
          <option value="note">Note</option>
        </select>
        <input
          type="text"
          value={newNodeTitle}
          onChange={(e) => setNewNodeTitle(e.target.value)}
          placeholder="New node title..."
          className="new-node-input"
        />
        <button type="submit" disabled={!newNodeTitle.trim()} className="new-node-button">
          +
        </button>
      </form>
    </div>
  );
}
