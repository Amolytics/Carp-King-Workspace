import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlValue } from 'sql.js';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '../../data');
export const DATA_FILE = path.join(DATA_DIR, 'app.sqlite');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function locateSqlWasm(file: string) {
  return path.resolve(__dirname, '../node_modules/sql.js/dist', file);
}

async function initDb(): Promise<Database> {
  ensureDataDir();
  const SQL = await initSqlJs({ locateFile: locateSqlWasm });
  const fileExists = fs.existsSync(DATA_FILE);
  const db = fileExists
    ? new SQL.Database(new Uint8Array(fs.readFileSync(DATA_FILE)))
    : new SQL.Database();
  return db as Database;
}

const dbPromise = initDb();

export async function withDb<T>(fn: (db: Database) => T | Promise<T>) {
  const db = await dbPromise;
  return Promise.resolve(fn(db));
}

export function saveDb(db: Database) {
  ensureDataDir();
  const data = db.export();
  fs.writeFileSync(DATA_FILE, Buffer.from(data));
}

export function queryRows<T>(db: Database, sql: string, params: SqlValue[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T>(db: Database, sql: string, params: SqlValue[] = []): T | null {
  const rows = queryRows<T>(db, sql, params);
  return rows.length ? rows[0] : null;
}
