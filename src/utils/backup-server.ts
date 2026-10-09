import fs   from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { effectiveSchemaVersion } from './migrationSteps.js';
import { APP_VERSION_KEY, UNKNOWN_APP_VERSION, backupsToPrune, formatBackupName } from './dbBackupName.js';
import { APP_META_GET_SQL, APP_META_UPSERT_SQL } from '../db/queries.js';

// The app version that last ran against `rawDb`, or undefined for a file from before app_meta.
export function readAppVersion(rawDb: InstanceType<typeof Database>): string | undefined {
  const hasTable = rawDb.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'app_meta'").get();
  if (!hasTable) return undefined;
  return (rawDb.prepare(APP_META_GET_SQL).get(APP_VERSION_KEY) as { value: string } | undefined)?.value;
}

export function stampAppVersion(rawDb: InstanceType<typeof Database>, appVersion: string): void {
  rawDb.prepare(APP_META_UPSERT_SQL).run(APP_VERSION_KEY, appVersion);
}

// Copies the db at `dbPath` into its own directory if migrations are about to run on it, so a
// migration that succeeds but mangles data can still be undone. Skips a fresh, empty db (nothing
// to protect), one that's up to date, and one from a newer app (migrateDatabase refuses those).
// Keeps the newest MAX_MIGRATION_BACKUPS. Throws if the copy fails, so nothing migrates without
// one. Returns the backup's path, or null if none was needed.
//
// A plain file copy is safe here: the server runs with journal_mode = DELETE, so the main file
// holds everything committed, and no transaction is open before migrating.
export function backupBeforeMigrating(
  rawDb: InstanceType<typeof Database>,
  dbPath: string,
  latestVersion: number,
  log: (message: string) => void = () => {},
  now: Date = new Date(),
): string | null {
  const schemaVersion = effectiveSchemaVersion(rawDb);
  if (schemaVersion === 0 || schemaVersion >= latestVersion) return null;

  const dir    = path.dirname(dbPath);
  const dbBase = path.parse(dbPath).name;
  const dest   = path.join(dir, formatBackupName({
    dbBase,
    date:       now,
    schemaVersion,
    appVersion: readAppVersion(rawDb) ?? UNKNOWN_APP_VERSION,
  }));
  fs.copyFileSync(dbPath, dest, fs.constants.COPYFILE_EXCL);
  log(`Database schema: backed up version ${schemaVersion} to ${dest} before migrating`);

  for (const old of backupsToPrune(fs.readdirSync(dir), dbBase)) {
    fs.rmSync(path.join(dir, old), { force: true });
    log(`Database schema: removed old backup ${old}`);
  }
  return dest;
}
