import fs   from 'node:fs';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { NewerSchemaError, splitStatements, switchOverVersion, type MigrationStep } from './schemaVersion.js';

// Applies drizzle-kit's generated SQL files ourselves instead of through Drizzle's migrate(), so the
// server tracks the schema version the same way the native app's Capacitor plugin does (PRAGMA
// user_version). Don't run `drizzle-kit migrate`/`push` against torah.db — they track migrations
// in their own table, which no longer matches.

// Shared with scripts/build-native-migrations.ts, so both platforms run exactly the same steps.
export function readMigrationSteps(drizzleDir: string): MigrationStep[] {
  const journal: { entries: { idx: number; tag: string }[] } = JSON.parse(
    fs.readFileSync(path.join(drizzleDir, 'meta/_journal.json'), 'utf8'),
  );
  return [...journal.entries]
    .sort((a, b) => a.idx - b.idx)
    .map((entry, i) => ({
      toVersion:  i + 1,
      name:       entry.tag,
      statements: splitStatements(fs.readFileSync(path.join(drizzleDir, `${entry.tag}.sql`), 'utf8')),
    }));
}

// The number of steps `rawDb` has applied: its user_version, raised to the row count of the old
// __drizzle_migrations table for a database from before the switch (see switchOverVersion).
export function effectiveSchemaVersion(rawDb: InstanceType<typeof Database>): number {
  const hasDrizzleTable = rawDb.prepare("SELECT 1 FROM sqlite_master WHERE name = '__drizzle_migrations'").get();
  const drizzleRows     = hasDrizzleTable ? (rawDb.prepare('SELECT COUNT(*) AS n FROM __drizzle_migrations').get() as { n: number }).n : 0;
  const userVersion     = rawDb.pragma('user_version', { simple: true }) as number;
  return switchOverVersion(userVersion, drizzleRows);
}

// Brings `rawDb` up to the latest step; throws NewerSchemaError (changing nothing) for a database
// from a newer app version. Each step commits together with its user_version bump, so a failing
// step leaves the database at the previous step, as the native plugin does. Callers must set
// `foreign_keys = OFF` first (table recreations need it). `log` hears what it did, step by step.
export function migrateDatabase(
  rawDb: InstanceType<typeof Database>,
  steps: readonly MigrationStep[],
  log: (message: string) => void = () => {},
): void {
  const userVersion = rawDb.pragma('user_version', { simple: true }) as number;
  const version     = effectiveSchemaVersion(rawDb);
  const latest      = steps.length;
  if (version > latest) throw new NewerSchemaError(version, latest);

  if (version !== userVersion) {
    log(`Database schema: version ${userVersion} -> ${version}, read from the old __drizzle_migrations table`);
  }
  rawDb.pragma(`user_version = ${version}`);
  const pending = steps.slice(version);
  log(pending.length
    ? `Database schema: at version ${version}, applying ${pending.length} migration(s) to reach ${latest}`
    : `Database schema: at version ${version}, up to date`);

  for (const step of pending) {
    const started = Date.now();
    try {
      rawDb.transaction(() => {
        for (const statement of step.statements) rawDb.exec(statement);
        rawDb.pragma(`user_version = ${step.toVersion}`);
      })();
    } catch (err) {
      log(`Database schema: migration ${step.toVersion} (${step.name}) failed and was rolled back; staying at version ${step.toVersion - 1}`);
      throw err;
    }
    log(`Database schema: applied migration ${step.toVersion} (${step.name}), ${step.statements.length} statement(s) in ${Date.now() - started} ms`);
  }
}
