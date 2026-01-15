import { useState, useRef, useEffect } from 'react';
import { useStore } from '../../stores';
import { getAIService, QUICK_ACTIONS } from '../../ai';
import type { AIMessage, AIMode, AICitation } from '../../ai';

interface AIPanelProps {
  mode: AIMode;
}

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: AICitation[];
}

export function AIPanel({ mode }: AIPanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiContext = useStore((state) => state.aiContext);
  const activeDocument = useStore((state) => state.activeDocument);
  const characters = useStore((state) => state.characters);
  const outlineNodes = useStore((state) => state.outlineNodes);
  const documents = useStore((state) => state.documents);
  const activeProject = useStore((state) => state.activeProject);

  const aiService = getAIService();
  const isConfigured = aiService.isConfigured();

  const title = mode === 'editor' ? 'AI Editor' : 'AI Coach';
  const placeholder =
    mode === 'editor'
      ? 'Ask for grammar, style, or consistency feedback...'
      : 'Ask for craft guidance, plot advice, or character development help...';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      aiService.updateSettings({ apiKey: apiKeyInput.trim() });
      setApiKeyInput('');
      setShowSettings(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!isConfigured) {
      setShowSettings(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setStreamingContent('');

    // Get selected text from active document if available
    const selectedText = activeDocument?.content?.content
      ? JSON.stringify(activeDocument.content.content).substring(0, 2000)
      : undefined;

    // Build document titles map
    const documentTitles: Record<string, string> = {};
    documents.forEach((doc) => {
      documentTitles[doc.id] = doc.title;
    });

    // Filter to project's characters and outline nodes
    const projectCharacters = characters.filter(
      (c) => c.projectId === activeProject?.id
    );
    const projectOutlineNodes = outlineNodes.filter(
      (n) => n.projectId === activeProject?.id
    );

    // Build conversation history
    const conversationHistory: AIMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      await aiService.sendRequestWithStream(
        {
          mode,
          userMessage,
          selectedText,
          context: aiContext || createEmptyContext(),
          conversationHistory,
        },
        {
          onStart: () => {
            setStreamingContent('');
          },
          onToken: (token) => {
            setStreamingContent((prev) => prev + token);
          },
          onComplete: (response) => {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: response.content,
                citations: response.citations,
              },
            ]);
            setStreamingContent('');
            setIsLoading(false);
          },
          onError: (error) => {
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant',
                content: `Error: ${error.message}`,
              },
            ]);
            setStreamingContent('');
            setIsLoading(false);
          },
        },
        projectCharacters,
        projectOutlineNodes,
        documentTitles
      );
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  // Get relevant quick actions for the current mode
  const relevantQuickActions = QUICK_ACTIONS.filter((action) => {
    if (mode === 'editor') {
      return ['grammar_check', 'style_improve', 'consistency_check'].includes(action.type);
    } else {
      return ['pacing_analysis', 'dialogue_review', 'character_voice'].includes(action.type);
    }
  });

  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <h4 className="panel-title">{title}</h4>
        <button
          className="settings-button"
          onClick={() => setShowSettings(!showSettings)}
          title="AI Settings"
        >
          ⚙
        </button>
      </div>

      {showSettings && (
        <div className="ai-settings">
          <div className="form-group">
            <label>API Key (Anthropic)</label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={isConfigured ? '••••••••' : 'Enter your API key'}
              className="api-key-input"
            />
            <button onClick={handleSaveApiKey} className="save-api-key-button">
              Save
            </button>
          </div>
          <p className="settings-note">
            Your API key is stored locally and never sent to our servers.
          </p>
        </div>
      )}

      {!showSettings && (
        <>
          <div className="quick-actions">
            {relevantQuickActions.map((action) => (
              <button
                key={action.type}
                className="quick-action-button"
                onClick={() => handleQuickAction(action.prompt)}
                title={action.description}
              >
                {action.label}
              </button>
            ))}
          </div>

          <div className="messages">
            {messages.length === 0 && !streamingContent && (
              <p className="empty-message">
                {!isConfigured ? (
                  <>Click the ⚙ button to configure your API key.</>
                ) : mode === 'editor' ? (
                  'Get feedback on your writing with grammar, style, and consistency checks.'
                ) : (
                  'Get guidance on craft, plot structure, and character development.'
                )}
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.role}`}>
                <div className="message-content">
                  {msg.content}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="citations">
                      <span className="citations-label">References: </span>
                      {msg.citations.map((citation, ci) => (
                        <span key={ci} className={`citation citation-${citation.type}`}>
                          {citation.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {streamingContent && (
              <div className="message assistant streaming">
                <div className="message-content">{streamingContent}</div>
              </div>
            )}
            {isLoading && !streamingContent && (
              <div className="message assistant loading">
                <div className="message-content">Thinking...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="ai-input-form">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="ai-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button type="submit" disabled={!input.trim() || isLoading} className="ai-submit">
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}

// Helper to create empty context when none exists
function createEmptyContext() {
  return {
    id: '',
    projectId: '',
    documentId: null,
    version: 0,
    createdAt: new Date(),
    lastUpdatedAt: new Date(),
    staleness: 'fresh' as const,
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
    compressionLevel: 'standard' as const,
  };
}
