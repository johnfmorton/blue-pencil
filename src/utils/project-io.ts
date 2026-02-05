import type { Project, Document, OutlineNode, Character } from '../types';
import type { AppStore } from '../stores';
import { generateId } from './id';

export interface ProjectExport {
  version: 1;
  exportedAt: string;
  project: Project;
  documents: Document[];
  outlineNodes: OutlineNode[];
  characters: Character[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function exportProject(projectId: string, state: AppStore): void {
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) return;

  const documents = state.documents.filter((d) => d.projectId === projectId);
  const outlineNodes = state.outlineNodes.filter((n) => n.projectId === projectId);
  const characters = state.characters.filter((c) => c.projectId === projectId);

  const data: ProjectExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    project,
    documents,
    outlineNodes,
    characters,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(project.name)}.blue-pencil.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseProjectFile(file: File): Promise<ProjectExport> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);

        if (!data.version || !data.project || !Array.isArray(data.documents) ||
            !Array.isArray(data.outlineNodes) || !Array.isArray(data.characters)) {
          reject(new Error('Invalid project file format.'));
          return;
        }

        resolve(data as ProjectExport);
      } catch {
        reject(new Error('Failed to parse project file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

/** ISO 8601 date pattern */
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function reviveDates<T>(obj: T): T {
  if (typeof obj === 'string' && ISO_DATE_RE.test(obj)) {
    return new Date(obj) as unknown as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(reviveDates) as unknown as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = reviveDates(value);
    }
    return result as T;
  }
  return obj;
}

/**
 * Remaps all IDs in the export to new unique IDs, preserving cross-references.
 * Call this when importing a project whose ID already exists in the store.
 */
export function remapIds(data: ProjectExport): ProjectExport {
  const idMap = new Map<string, string>();

  const remap = (oldId: string): string => {
    if (!idMap.has(oldId)) {
      idMap.set(oldId, generateId());
    }
    return idMap.get(oldId)!;
  };

  // Pre-generate all new IDs
  remap(data.project.id);
  data.documents.forEach((d) => remap(d.id));
  data.outlineNodes.forEach((n) => remap(n.id));
  data.characters.forEach((c) => remap(c.id));

  const newProjectId = remap(data.project.id);

  const project: Project = {
    ...data.project,
    id: newProjectId,
  };

  const documents: Document[] = data.documents.map((d) => ({
    ...d,
    id: remap(d.id),
    projectId: newProjectId,
    parentId: d.parentId ? (idMap.get(d.parentId) ?? d.parentId) : null,
  }));

  const outlineNodes: OutlineNode[] = data.outlineNodes.map((n) => ({
    ...n,
    id: remap(n.id),
    projectId: newProjectId,
    parentId: n.parentId ? (idMap.get(n.parentId) ?? n.parentId) : null,
    linkedDocumentIds: n.linkedDocumentIds.map((lid) => idMap.get(lid) ?? lid),
    linkedSectionIds: n.linkedSectionIds,
  }));

  const characters: Character[] = data.characters.map((c) => ({
    ...c,
    id: remap(c.id),
    projectId: newProjectId,
    relationships: c.relationships.map((r) => ({
      ...r,
      characterId: idMap.get(r.characterId) ?? r.characterId,
    })),
  }));

  return {
    ...data,
    project,
    documents,
    outlineNodes,
    characters,
  };
}

/**
 * Prepares a ProjectExport for import: revives Date strings and remaps IDs if needed.
 */
export function prepareImport(
  data: ProjectExport,
  existingProjectIds: string[]
): ProjectExport {
  let prepared = reviveDates(data);

  if (existingProjectIds.includes(prepared.project.id)) {
    prepared = remapIds(prepared);
  }

  return prepared;
}
