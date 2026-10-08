import fs   from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { createDb, type AppDb } from '../db/drizzle-server.js';
import { migrateDatabase, readMigrationSteps } from './migrationSteps.js';
import { NewerSchemaError } from './schemaVersion.js';

// Presence of these confirms the upload is a Torah Tracker database, not just any SQLite
// file. Doesn't need to be exhaustive — just enough to reject obviously-wrong uploads.
const REQUIRED_TABLES = ['sefarim', 'parshiot', 'aliyot', 'readings'];
const MAX_BACKUPS = 3;
const SQLITE_MAGIC = 'SQLite format 3\0';

export class ImportValidationError extends Error {}

function assertValidTorahDb(filePath: string): void {
  const header = Buffer.alloc(16);
  const fd = fs.openSync(filePath, 'r');
  try { fs.readSync(fd, header, 0, 16, 0); } finally { fs.closeSync(fd); }
  if (header.toString('latin1') !== SQLITE_MAGIC) {
    throw new ImportValidationError('Not a valid SQLite database file.');
  }

  let testDb: InstanceType<typeof Database>;
  try {
    testDb = new Database(filePath, { readonly: true });
  } catch {
    throw new ImportValidationError('Could not open file as a SQLite database.');
  }
  try {
    const integrity = testDb.pragma('integrity_check', { simple: true });
    if (integrity !== 'ok') throw new ImportValidationError('Database failed integrity check.');

    const tableNames = new Set(
      (testDb.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[])
        .map(r => r.name),
    );
    const missing = REQUIRED_TABLES.filter(t => !tableNames.has(t));
    if (missing.length) {
      throw new ImportValidationError(
        `Doesn't look like a Torah Tracker database (missing table${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}).`,
      );
    }
  } finally {
    testDb.close();
  }
}

// Keeps only the newest MAX_BACKUPS copies — backups are a safety net for a bad import,
// not a long-term archive (that's what Export DB is for).
function rotateBackups(dbPath: string): void {
  const dir       = path.dirname(dbPath);
  const base      = path.basename(dbPath);
  const backupDir = path.join(dir, 'backups');
  fs.mkdirSync(backupDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(dbPath, path.join(backupDir, `${base}.${stamp}.bak`));

  const existing = fs.readdirSync(backupDir)
    .filter(f => f.startsWith(`${base}.`) && f.endsWith('.bak'))
    .sort((a, b) => a.localeCompare(b)); // ISO timestamps sort chronologically as strings
  for (const f of existing.slice(0, Math.max(0, existing.length - MAX_BACKUPS))) {
    fs.unlinkSync(path.join(backupDir, f));
  }
}

// Replaces every row of `table` in `dest` with `rows`, preserving column names/values as-is.
// Column list is derived from the rows themselves so this isn't coupled to the exact schema.
function replaceTableRows(dest: InstanceType<typeof Database>, table: string, rows: Record<string, unknown>[]): void {
  dest.prepare(`DELETE FROM ${table}`).run();
  if (!rows.length) return;
  const columns      = Object.keys(rows[0]!);
  const placeholders = columns.map(c => `@${c}`).join(', ');
  const insert = dest.prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`);
  for (const row of rows) insert.run(row);
}

interface ImportResult {
  rawDb: InstanceType<typeof Database>;
  db: AppDb;
}

// Migrates the uploaded copy at `tempPath` up to the current schema (a no-op for a fresh export,
// a real upgrade for an older backup) and carries this deployment's own admin_password/
// auth_sessions rows into it — an import restores reading data, not who's allowed to write it,
// so the current login must keep working. Works on the copy only; the live db is untouched.
function prepareUpload(tempPath: string, migrationsFolder: string, authRows: Record<string, unknown>[], sessionRows: Record<string, unknown>[]): void {
  const tempDb = new Database(tempPath);
  try {
    tempDb.pragma('journal_mode = DELETE');
    tempDb.pragma('foreign_keys = OFF'); // must be off during migrations (table recreations need it)
    try {
      migrateDatabase(tempDb, readMigrationSteps(migrationsFolder));
    } catch (err) {
      if (err instanceof NewerSchemaError) throw new ImportValidationError(err.message);
      throw err;
    }
    tempDb.transaction(() => {
      replaceTableRows(tempDb, 'admin_password', authRows);
      replaceTableRows(tempDb, 'auth_sessions', sessionRows);
    })();
  } finally {
    tempDb.close();
  }
}

// Replaces the on-disk database at `dbPath` with `uploadBuffer`, after validating it looks like
// a genuine Torah Tracker database. Everything that can fail happens to a temp copy first; the
// live db is only backed up, closed and swapped once the copy is fully migrated, so a failed
// import leaves `currentRawDb` open and its file untouched.
export function importDatabase(
  uploadBuffer: Buffer,
  currentRawDb: InstanceType<typeof Database>,
  dbPath: string,
  migrationsFolder: string,
): ImportResult {
  const authRows    = currentRawDb.prepare('SELECT * FROM admin_password').all() as Record<string, unknown>[];
  const sessionRows = currentRawDb.prepare('SELECT * FROM auth_sessions').all()  as Record<string, unknown>[];

  const tempPath = `${dbPath}.import-tmp`;
  fs.writeFileSync(tempPath, uploadBuffer);
  try {
    assertValidTorahDb(tempPath);
    prepareUpload(tempPath, migrationsFolder, authRows, sessionRows);
  } catch (err) {
    fs.rmSync(tempPath, { force: true });
    throw err;
  }

  rotateBackups(dbPath);
  currentRawDb.close();
  fs.renameSync(tempPath, dbPath);

  const newRawDb = new Database(dbPath);
  newRawDb.pragma('journal_mode = DELETE');
  newRawDb.pragma('foreign_keys = ON');
  return { rawDb: newRawDb, db: createDb(newRawDb) };
}
