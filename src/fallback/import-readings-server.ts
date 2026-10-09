import fs from 'node:fs';
import Database from 'better-sqlite3';
import { importDatabase, ImportValidationError } from '../utils/import-server.js';
import { migrateDatabase, readMigrationSteps } from '../utils/migrationSteps.js';
import { COPY_READINGS_SQL, columnsSql, countRowsSql, summarizeReadingsImport, type ReadingsImportSummary } from './importReadings.js';
import { errText } from '../utils/errText.js';

// BACKUP for the app — not wired in: only the dev script scripts/db-rollback.ts uses this. Kept as
// a ready-made fallback for a file the normal import can't take. To use it in the app, add a route
// in server.ts that calls importReadingsOnly() and a UI prompt in SettingsDrawer.tsx; native would
// need its own version.
//
// Builds a fresh database from the migrations, copies just the upload's readings into it (see
// importReadings.ts), then hands that fresh file to the normal importDatabase(), which validates
// it and swaps it in safely — so the normal import path itself needs no changes.
function buildFreshWithReadings(freshPath: string, uploadPath: string, migrationsFolder: string): ReadingsImportSummary {
  fs.rmSync(freshPath, { force: true });
  const fresh = new Database(freshPath);
  try {
    fresh.pragma('journal_mode = DELETE');
    fresh.pragma('foreign_keys = OFF');
    migrateDatabase(fresh, readMigrationSteps(migrationsFolder));
    fresh.prepare('ATTACH DATABASE ? AS up').run(uploadPath);

    const counts:  Parameters<typeof summarizeReadingsImport>[0] = {};
    const columns: Parameters<typeof summarizeReadingsImport>[1] = {};
    const n     = (sql: string) => (fresh.prepare(sql).get() as { n: number }).n;
    const names = (sql: string) => (fresh.prepare(sql).all() as { name: string }[]).map(r => r.name);
    fresh.transaction(() => {
      for (const [table, sql] of Object.entries(COPY_READINGS_SQL)) {
        counts[table]  = { source: n(countRowsSql(table, 'up')), copied: fresh.prepare(sql).run().changes };
        columns[table] = { source: names(columnsSql(table, 'up')), known: names(columnsSql(table, 'main')) };
      }
    })();
    fresh.prepare('DETACH DATABASE up').run();
    return summarizeReadingsImport(counts, columns);
  } finally {
    fresh.close();
  }
}

export function importReadingsOnly(
  uploadBuffer: Buffer,
  currentRawDb: InstanceType<typeof Database>,
  dbPath: string,
  migrationsFolder: string,
): ReturnType<typeof importDatabase> & { summary: ReadingsImportSummary } {
  const uploadPath = `${dbPath}.readings-upload`;
  const freshPath  = `${dbPath}.readings-fresh`;
  fs.writeFileSync(uploadPath, uploadBuffer);
  try {
    let summary: ReadingsImportSummary;
    try {
      summary = buildFreshWithReadings(freshPath, uploadPath, migrationsFolder);
    } catch (err) {
      throw new ImportValidationError(`Couldn't read readings from this file (${errText(err)}).`);
    }
    return { ...importDatabase(fs.readFileSync(freshPath), currentRawDb, dbPath, migrationsFolder), summary };
  } finally {
    fs.rmSync(uploadPath, { force: true });
    fs.rmSync(freshPath,  { force: true });
  }
}
