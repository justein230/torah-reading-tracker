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
      statements: splitStatements(fs.readFileSync(path.join(drizzleDir, `${entry.tag}.sql`), 'utf8')),
    }));
}

// Brings `rawDb` up to the latest step; throws NewerSchemaError (changing nothing) for a database
// from a newer app version. Each step commits together with its user_version bump, so a failing
// step leaves the database at the previous step, as the native plugin does. Callers must set
// `foreign_keys = OFF` first (table recreations need it).
export function migrateDatabase(rawDb: InstanceType<typeof Database>, steps: readonly MigrationStep[]): void {
  const hasDrizzleTable = rawDb.prepare("SELECT 1 FROM sqlite_master WHERE name = '__drizzle_migrations'").get();
  const drizzleRows     = hasDrizzleTable ? (rawDb.prepare('SELECT COUNT(*) AS n FROM __drizzle_migrations').get() as { n: number }).n : 0;
  const version         = switchOverVersion(rawDb.pragma('user_version', { simple: true }) as number, drizzleRows);
  const latest          = steps.length;
  if (version > latest) throw new NewerSchemaError(version, latest);

  rawDb.pragma(`user_version = ${version}`);
  for (const step of steps.slice(version)) {
    rawDb.transaction(() => {
      for (const statement of step.statements) rawDb.exec(statement);
      rawDb.pragma(`user_version = ${step.toVersion}`);
    })();
  }
}
