import { useState } from 'react';
import { useStore } from '../../stores';
import { getAIService } from '../../ai/service';
import {
  LEARN_FROM_WRITING_PROMPT,
  parseLearnResponse,
  type PendingContext,
} from '../../ai/learn-from-writing';

type LearnState = 'idle' | 'analyzing' | 'review';

export function LearnFromWritingButton() {
  const [state, setState] = useState<LearnState>('idle');
  const [pending, setPending] = useState<PendingContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeProject = useStore((s) => s.activeProject);
  const documents = useStore((s) => s.documents);
  const updateProject = useStore((s) => s.updateProject);
  const updateProjectSettings = useStore((s) => s.updateProjectSettings);
  const createCharacter = useStore((s) => s.createCharacter);
  const createOutlineNode = useStore((s) => s.createOutlineNode);

  const projectDocs = documents.filter((d) => d.projectId === activeProject?.id);

  const extractText = (content: { content?: Array<{ text?: string; content?: unknown[] }> }): string => {
    const texts: string[] = [];
    const walk = (nodes: unknown[]) => {
      for (const node of nodes) {
        const n = node as Record<string, unknown>;
        if (typeof n.text === 'string') texts.push(n.text);
        if (Array.isArray(n.content)) walk(n.content);
      }
    };
    if (Array.isArray(content.content)) walk(content.content);
    return texts.join(' ');
  };

  const hasContent = projectDocs.some((d) => {
    const text = extractText(d.content);
    return text.trim().length > 0;
  });

  const handleAnalyze = async () => {
    if (!activeProject) return;
    setError(null);
    setState('analyzing');

    const allText = projectDocs
      .map((d) => extractText(d.content))
      .filter((t) => t.trim().length > 0)
      .join('\n\n---\n\n');

    if (!allText.trim()) {
      setError('No document content to analyze.');
      setState('idle');
      return;
    }

    const ai = getAIService();
    if (!ai.isConfigured()) {
      setError('Please configure your API key in the AI panel first.');
      setState('idle');
      return;
    }

    try {
      const response = await ai.sendRequest({
        mode: 'editor',
        userMessage: `${LEARN_FROM_WRITING_PROMPT}\n\n--- MANUSCRIPT ---\n\n${allText.substring(0, 50000)}`,
        context: {
          id: '',
          projectId: activeProject.id,
          documentId: null,
          version: 0,
          createdAt: new Date(),
          lastUpdatedAt: new Date(),
          staleness: 'fresh',
          activeOutlineNodeIds: [],
          activeCharacterIds: [],
          projectSummary: null,
          documentSummary: null,
          sectionSummaries: [],
          characterPresenceMap: {},
          outlineAlignmentMap: {},
          recentEdits: [],
          narrativeProgression: [],
          tokenEstimate: 0,
          compressionLevel: 'full',
        },
      });

      const result = parseLearnResponse(response.content);
      setPending(result);
      setState('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
      setState('idle');
    }
  };

  const handleAccept = async (category: string) => {
    if (!activeProject || !pending) return;

    switch (category) {
      case 'premise':
        if (pending.premise) updateProject(activeProject.id, { description: pending.premise });
        setPending((p) => p ? { ...p, premise: undefined } : p);
        break;
      case 'genre':
        if (pending.genre) updateProjectSettings(activeProject.id, { genre: pending.genre });
        setPending((p) => p ? { ...p, genre: undefined } : p);
        break;
      case 'tone':
        if (pending.tone) updateProjectSettings(activeProject.id, { tone: pending.tone });
        setPending((p) => p ? { ...p, tone: undefined } : p);
        break;
      case 'setting':
        if (pending.setting) updateProjectSettings(activeProject.id, { setting: pending.setting });
        setPending((p) => p ? { ...p, setting: undefined } : p);
        break;
      case 'themes':
        if (pending.themes) updateProjectSettings(activeProject.id, { themes: pending.themes });
        setPending((p) => p ? { ...p, themes: undefined } : p);
        break;
      case 'targetFormat':
        if (pending.targetFormat) updateProjectSettings(activeProject.id, { targetFormat: pending.targetFormat });
        setPending((p) => p ? { ...p, targetFormat: undefined } : p);
        break;
      case 'characters':
        for (const char of pending.characters) {
          await createCharacter(activeProject.id, {
            name: char.name,
            role: char.role,
            description: char.description,
          });
        }
        setPending((p) => p ? { ...p, characters: [] } : p);
        break;
      case 'outlineNodes':
        for (const node of pending.outlineNodes) {
          await createOutlineNode(activeProject.id, {
            title: node.title,
            type: node.type,
            description: node.description,
          });
        }
        setPending((p) => p ? { ...p, outlineNodes: [] } : p);
        break;
    }
  };

  const handleDiscard = (category: string) => {
    if (!pending) return;
    switch (category) {
      case 'premise':
        setPending((p) => p ? { ...p, premise: undefined } : p);
        break;
      case 'genre':
        setPending((p) => p ? { ...p, genre: undefined } : p);
        break;
      case 'tone':
        setPending((p) => p ? { ...p, tone: undefined } : p);
        break;
      case 'setting':
        setPending((p) => p ? { ...p, setting: undefined } : p);
        break;
      case 'themes':
        setPending((p) => p ? { ...p, themes: undefined } : p);
        break;
      case 'targetFormat':
        setPending((p) => p ? { ...p, targetFormat: undefined } : p);
        break;
      case 'characters':
        setPending((p) => p ? { ...p, characters: [] } : p);
        break;
      case 'outlineNodes':
        setPending((p) => p ? { ...p, outlineNodes: [] } : p);
        break;
    }
  };

  const hasPendingItems =
    pending &&
    (pending.premise ||
      pending.genre ||
      pending.tone ||
      pending.setting ||
      pending.themes ||
      pending.targetFormat ||
      pending.characters.length > 0 ||
      pending.outlineNodes.length > 0);

  if (state === 'idle') {
    return (
      <div className="learn-from-writing">
        <button
          className="learn-button"
          onClick={handleAnalyze}
          disabled={!hasContent}
          title={!hasContent ? 'Write some content first' : 'Analyze your manuscript with AI'}
        >
          Learn from my writing
        </button>
        {error && <p className="learn-error">{error}</p>}
      </div>
    );
  }

  if (state === 'analyzing') {
    return (
      <div className="learn-from-writing">
        <div className="learn-analyzing">
          <div className="spinner learn-spinner" />
          <span>Analyzing your manuscript...</span>
        </div>
      </div>
    );
  }

  // Review state
  return (
    <div className="learn-from-writing">
      <h4 className="learn-review-title">AI suggestions</h4>
      {!hasPendingItems && (
        <p className="learn-done">All items reviewed.</p>
      )}

      {pending?.premise && (
        <div className="learn-item">
          <div className="learn-item-label">Premise</div>
          <div className="learn-item-value">{pending.premise}</div>
          <div className="learn-item-actions">
            <button className="learn-accept" onClick={() => handleAccept('premise')}>Accept</button>
            <button className="learn-discard" onClick={() => handleDiscard('premise')}>Discard</button>
          </div>
        </div>
      )}

      {pending?.genre && (
        <div className="learn-item">
          <div className="learn-item-label">Genre</div>
          <div className="learn-item-value">{pending.genre}</div>
          <div className="learn-item-actions">
            <button className="learn-accept" onClick={() => handleAccept('genre')}>Accept</button>
            <button className="learn-discard" onClick={() => handleDiscard('genre')}>Discard</button>
          </div>
        </div>
      )}

      {pending?.tone && (
        <div className="learn-item">
          <div className="learn-item-label">Tone</div>
          <div className="learn-item-value">{pending.tone}</div>
          <div className="learn-item-actions">
            <button className="learn-accept" onClick={() => handleAccept('tone')}>Accept</button>
            <button className="learn-discard" onClick={() => handleDiscard('tone')}>Discard</button>
          </div>
        </div>
      )}

      {pending?.setting && (
        <div className="learn-item">
          <div className="learn-item-label">Setting</div>
          <div className="learn-item-value">{pending.setting}</div>
          <div className="learn-item-actions">
            <button className="learn-accept" onClick={() => handleAccept('setting')}>Accept</button>
            <button className="learn-discard" onClick={() => handleDiscard('setting')}>Discard</button>
          </div>
        </div>
      )}

      {pending?.themes && (
        <div className="learn-item">
          <div className="learn-item-label">Themes</div>
          <div className="learn-item-value">{pending.themes}</div>
          <div className="learn-item-actions">
            <button className="learn-accept" onClick={() => handleAccept('themes')}>Accept</button>
            <button className="learn-discard" onClick={() => handleDiscard('themes')}>Discard</button>
          </div>
        </div>
      )}

      {pending?.targetFormat && (
        <div className="learn-item">
          <div className="learn-item-label">Format</div>
          <div className="learn-item-value">{pending.targetFormat}</div>
          <div className="learn-item-actions">
            <button className="learn-accept" onClick={() => handleAccept('targetFormat')}>Accept</button>
            <button className="learn-discard" onClick={() => handleDiscard('targetFormat')}>Discard</button>
          </div>
        </div>
      )}

      {pending && pending.characters.length > 0 && (
        <div className="learn-item">
          <div className="learn-item-label">Characters ({pending.characters.length})</div>
          <div className="learn-item-value">
            {pending.characters.map((c, i) => (
              <div key={i} className="learn-character">
                <strong>{c.name}</strong> ({c.role}) — {c.description}
              </div>
            ))}
          </div>
          <div className="learn-item-actions">
            <button className="learn-accept" onClick={() => handleAccept('characters')}>Accept all</button>
            <button className="learn-discard" onClick={() => handleDiscard('characters')}>Discard</button>
          </div>
        </div>
      )}

      {pending && pending.outlineNodes.length > 0 && (
        <div className="learn-item">
          <div className="learn-item-label">Outline ({pending.outlineNodes.length})</div>
          <div className="learn-item-value">
            {pending.outlineNodes.map((n, i) => (
              <div key={i} className="learn-outline-node">
                <strong>{n.type}: {n.title}</strong> — {n.description}
              </div>
            ))}
          </div>
          <div className="learn-item-actions">
            <button className="learn-accept" onClick={() => handleAccept('outlineNodes')}>Accept all</button>
            <button className="learn-discard" onClick={() => handleDiscard('outlineNodes')}>Discard</button>
          </div>
        </div>
      )}

      <button
        className="learn-button"
        onClick={() => {
          setPending(null);
          setState('idle');
          handleAnalyze();
        }}
      >
        Re-analyze
      </button>
    </div>
  );
}
