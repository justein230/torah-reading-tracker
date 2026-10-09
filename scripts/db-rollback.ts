// Rolls torah.db back to the schema drizzle/ describes, keeping your readings and login. For
// after `drizzle-kit drop` removes an experimental migration the db already ran: otherwise the
// server refuses to start (the db is a step ahead), or, if a new migration has since taken the
// dropped one's number, silently skips it. Builds a fresh db from drizzle/ and copies the
// readings across by name (src/fallback/importReadings.ts); the old file goes to backups/.
import fs   from 'node:fs';
import path from 'node:path';
import { execFileSync }  from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { importReadingsOnly } from '../src/fallback/import-readings-server.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.TORAH_DB_PATH ?? path.join(__dirname, '../torah.db');

// Absolute path plus a fixed PATH, so a writable directory on the caller's PATH can't substitute
// its own pgrep. /usr/bin holds pgrep on both Linux and macOS.
const PGREP = '/usr/bin/pgrep';
const SAFE_PATH = '/usr/bin:/bin';

// A running server keeps the old file open and would carry on writing to it after the swap.
function serverIsRunning(): boolean {
  try { execFileSync(PGREP, ['-f', 'tsx server.ts'], { env: { PATH: SAFE_PATH } }); return true; } catch { return false; }
}
if (serverIsRunning()) {
  console.error('Stop the dev server first: pkill -f "concurrently -n api,vite"');
  process.exit(1);
}

const currentRawDb = new Database(dbPath);
const fromVersion  = currentRawDb.pragma('user_version', { simple: true });
const { rawDb, summary } = importReadingsOnly(fs.readFileSync(dbPath), currentRawDb, dbPath, path.join(__dirname, '../drizzle'));
const toVersion = rawDb.pragma('user_version', { simple: true });
rawDb.close();

console.log(`Rebuilt ${dbPath} at schema version ${toVersion} (was ${fromVersion}); kept ${summary.imported} reading rows. Old file is in backups/.`);
for (const [table, n] of Object.entries(summary.skipped)) {
  console.warn(`Skipped ${n} ${table} row(s) that point at something drizzle/ no longer has.`);
}
if (summary.droppedColumns.length) console.log(`Dropped columns: ${summary.droppedColumns.join(', ')}`);
