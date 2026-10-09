// Builds databases the way the old setup did (Drizzle's migrate(), user_version left at 0), for
// tests of the switch to our own user_version runner.
import fs   from 'node:fs';
import os   from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createDb } from '../../src/db/drizzle-server';
import { readMigrationSteps } from '../../src/utils/migrationSteps';

export const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle');
export const STEPS          = readMigrationSteps(MIGRATIONS_DIR);

// Drizzle's migrate() with only the first `count` journal entries, as an older app version ran it.
export function drizzleMigratedDb(filePath: string, count = STEPS.length): InstanceType<typeof Database> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'torah-drizzle-'));
  fs.cpSync(MIGRATIONS_DIR, dir, { recursive: true });
  const journalPath = path.join(dir, 'meta/_journal.json');
  const journal     = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  journal.entries   = journal.entries.slice(0, count);
  fs.writeFileSync(journalPath, JSON.stringify(journal));

  const rawDb = new Database(filePath);
  rawDb.pragma('foreign_keys = OFF');
  migrate(createDb(rawDb), { migrationsFolder: dir });
  fs.rmSync(dir, { recursive: true, force: true });
  return rawDb;
}

// A copy of drizzle/ in `dir` with one extra step on the end, as `drizzle-kit generate` would add it.
export function migrationsWithExtraStep(dir: string, sql: string): string {
  fs.cpSync(MIGRATIONS_DIR, dir, { recursive: true });
  const journalPath = path.join(dir, 'meta/_journal.json');
  const journal     = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  journal.entries.push({ idx: journal.entries.length, tag: '9999_extra' });
  fs.writeFileSync(journalPath, JSON.stringify(journal));
  fs.writeFileSync(path.join(dir, '9999_extra.sql'), sql);
  return dir;
}

export function schemaOf(rawDb: InstanceType<typeof Database>): unknown[] {
  return rawDb.prepare("SELECT type, name, sql FROM sqlite_master WHERE tbl_name NOT IN ('__drizzle_migrations', 'sqlite_sequence') ORDER BY type, name").all();
}
