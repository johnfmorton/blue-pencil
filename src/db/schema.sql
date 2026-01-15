-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  settings TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '{"type":"doc","content":[]}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  parent_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  last_cursor_anchor INTEGER,
  last_cursor_head INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_id);
CREATE INDEX IF NOT EXISTS idx_documents_sort ON documents(project_id, sort_order);

-- Sections table
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  start_position INTEGER NOT NULL,
  end_position INTEGER NOT NULL,
  summary TEXT,
  summary_updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sections_document ON sections(document_id);

-- Outline nodes table
CREATE TABLE IF NOT EXISTS outline_nodes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES outline_nodes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('act', 'chapter', 'scene', 'beat', 'note')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'planned'
    CHECK(status IN ('planned', 'in_progress', 'draft', 'revised', 'complete')),
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_outline_project ON outline_nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_outline_parent ON outline_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_outline_sort ON outline_nodes(project_id, parent_id, sort_order);

-- Outline-Document links
CREATE TABLE IF NOT EXISTS outline_document_links (
  outline_node_id TEXT NOT NULL REFERENCES outline_nodes(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES sections(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (outline_node_id, document_id, COALESCE(section_id, ''))
);

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  aliases TEXT NOT NULL DEFAULT '[]',
  role TEXT NOT NULL DEFAULT 'supporting'
    CHECK(role IN ('protagonist', 'antagonist', 'supporting', 'minor', 'mentioned')),
  description TEXT DEFAULT '',
  attributes TEXT NOT NULL DEFAULT '{}',
  arc TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);

-- Character relationships
CREATE TABLE IF NOT EXISTS character_relationships (
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  related_character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  description TEXT DEFAULT '',
  PRIMARY KEY (character_id, related_character_id)
);

-- Character mentions
CREATE TABLE IF NOT EXISTS character_mentions (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  section_id TEXT REFERENCES sections(id) ON DELETE SET NULL,
  position INTEGER NOT NULL,
  length INTEGER NOT NULL,
  name_used TEXT NOT NULL,
  context TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mentions_character ON character_mentions(character_id);
CREATE INDEX IF NOT EXISTS idx_mentions_document ON character_mentions(document_id);

-- AI Context snapshots
CREATE TABLE IF NOT EXISTS ai_context_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  staleness TEXT NOT NULL DEFAULT 'fresh'
    CHECK(staleness IN ('fresh', 'recent', 'stale', 'outdated')),
  active_outline_node_ids TEXT NOT NULL DEFAULT '[]',
  active_character_ids TEXT NOT NULL DEFAULT '[]',
  project_summary TEXT,
  document_summary TEXT,
  section_summaries TEXT NOT NULL DEFAULT '[]',
  character_presence_map TEXT NOT NULL DEFAULT '{}',
  outline_alignment_map TEXT NOT NULL DEFAULT '{}',
  recent_edits TEXT NOT NULL DEFAULT '[]',
  narrative_progression TEXT NOT NULL DEFAULT '[]',
  token_estimate INTEGER NOT NULL DEFAULT 0,
  compression_level TEXT NOT NULL DEFAULT 'standard'
    CHECK(compression_level IN ('full', 'standard', 'compact', 'minimal')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_context_project ON ai_context_snapshots(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_context_unique ON ai_context_snapshots(project_id, COALESCE(document_id, ''));

-- Document change log
CREATE TABLE IF NOT EXISTS document_changes (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK(change_type IN ('insert', 'delete', 'replace')),
  position INTEGER NOT NULL,
  old_content TEXT,
  new_content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_changes_document ON document_changes(document_id);
CREATE INDEX IF NOT EXISTS idx_changes_time ON document_changes(created_at);

-- App settings
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  active_project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  ui_settings TEXT NOT NULL DEFAULT '{}',
  ai_settings TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO app_settings (id) VALUES (1);
