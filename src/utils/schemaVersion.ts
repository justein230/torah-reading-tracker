// Schema versioning shared by the server and the native (Capacitor) app. Both track the schema
// version in SQLite's PRAGMA user_version: the number of migration steps applied, where step N is
// the Nth drizzle/*.sql file in journal order. Free of Node/Capacitor imports so both can use it.

export interface MigrationStep {
  toVersion:  number;
  statements: string[];
}

export class NewerSchemaError extends Error {
  constructor(fileVersion: number, latestVersion: number) {
    super(`This database was made by a newer version of the app (schema version ${fileVersion}; this version supports up to ${latestVersion}). Update the app first.`);
  }
}

// drizzle-kit separates the statements in each migration file with this marker.
export function splitStatements(sql: string): string[] {
  return sql
    .split('--> statement-breakpoint')
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0);
}

// One-time bridge from the old setup, where the server tracked migrations only in Drizzle's
// __drizzle_migrations table (one row per migration) and left user_version at 0 or a stale stamp.
// Only ever raises user_version: native files have an accurate user_version but a stale Drizzle
// table (on-device upgrades never added rows), and must be left alone.
export function switchOverVersion(userVersion: number, drizzleRowCount: number): number {
  return Math.max(userVersion, drizzleRowCount);
}
