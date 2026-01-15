import * as SQLite from 'wa-sqlite';
import SQLiteESMFactory from 'wa-sqlite/dist/wa-sqlite.mjs';
import { IDBBatchAtomicVFS } from 'wa-sqlite/src/examples/IDBBatchAtomicVFS.js';
import schema from './schema.sql?raw';

let db: SQLiteAPI | null = null;
let sqlite3: SQLiteAPI | null = null;

type SQLiteAPI = Awaited<ReturnType<typeof SQLite.Factory>>;

export async function initDatabase(): Promise<void> {
  if (db) return;

  const module = await SQLiteESMFactory();
  sqlite3 = SQLite.Factory(module);

  sqlite3.vfs_register(new IDBBatchAtomicVFS('blue-pencil-vfs'));
  db = await sqlite3.open_v2('blue-pencil.db', undefined, 'blue-pencil-vfs');

  // Run schema
  await executeSQL(schema);
}

export async function executeSQL(sql: string): Promise<void> {
  if (!db || !sqlite3) throw new Error('Database not initialized');
  await sqlite3.exec(db, sql);
}

export async function query<T>(
  sql: string,
  params: (string | number | null)[] = []
): Promise<T[]> {
  if (!db || !sqlite3) throw new Error('Database not initialized');

  const results: T[] = [];

  await sqlite3.exec(db, sql, (row, columns) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    results.push(obj as T);
  });

  return results;
}

export async function run(
  sql: string,
  params: (string | number | null)[] = []
): Promise<{ lastInsertRowId: number; changes: number }> {
  if (!db || !sqlite3) throw new Error('Database not initialized');

  // For parameterized queries, we need to use prepare/bind/step
  const stmt = await sqlite3.prepare(db, sql);

  try {
    params.forEach((param, i) => {
      if (param === null) {
        sqlite3!.bind(stmt, i + 1, null);
      } else if (typeof param === 'number') {
        sqlite3!.bind(stmt, i + 1, param);
      } else {
        sqlite3!.bind(stmt, i + 1, param);
      }
    });

    await sqlite3.step(stmt);

    return {
      lastInsertRowId: sqlite3.last_insert_rowid(db),
      changes: sqlite3.changes(db),
    };
  } finally {
    await sqlite3.finalize(stmt);
  }
}

export function getDatabase() {
  return { db, sqlite3 };
}
