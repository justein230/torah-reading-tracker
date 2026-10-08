import type Database from 'better-sqlite3';
import { migrateDatabase, readMigrationSteps } from '../utils/migrationSteps.js';

// Throws NewerSchemaError for a database made by a newer app version, so the server refuses to
// run against a schema it doesn't know rather than silently misreading it.
export function initDb(
  rawDb: InstanceType<typeof Database>,
  migrationsFolder: string
): void {
  migrateDatabase(rawDb, readMigrationSteps(migrationsFolder));
}
