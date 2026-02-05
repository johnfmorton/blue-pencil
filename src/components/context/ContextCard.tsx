import { useState } from 'react';

interface ContextCardProps {
  title: string;
  hint?: string;
  hasContent?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export function ContextCard({
  title,
  hint,
  hasContent = false,
  defaultExpanded = true,
  children,
}: ContextCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={`context-card ${hasContent ? 'has-content' : ''}`}>
      <button
        className="context-card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="context-card-title">{title}</span>
        <span className="context-card-indicator">
          {hasContent && <span className="context-card-dot" />}
          <span className={`context-card-chevron ${expanded ? 'expanded' : ''}`}>
            &#9656;
          </span>
        </span>
      </button>
      {expanded && (
        <div className="context-card-content">
          {hint && !hasContent && (
            <p className="context-card-hint">{hint}</p>
          )}
          {children}
        </div>
      )}
    </div>
  );
}
