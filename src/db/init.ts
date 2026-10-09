import type Database from 'better-sqlite3';
import { migrateDatabase, readMigrationSteps } from '../utils/migrationSteps.js';
import { backupBeforeMigrating, stampAppVersion } from '../utils/backup-server.js';

export interface InitDbOptions {
  appVersion:    string; // stamped into app_meta once the schema is current
  backupDbPath?: string; // the live db's path: back it up beside itself before migrating
}

// Throws NewerSchemaError for a database made by a newer app version, so the server refuses to
// run against a schema it doesn't know rather than silently misreading it.
export function initDb(
  rawDb: InstanceType<typeof Database>,
  migrationsFolder: string,
  log?: (message: string) => void,
  options?: InitDbOptions,
): void {
  const steps = readMigrationSteps(migrationsFolder);
  if (options?.backupDbPath) backupBeforeMigrating(rawDb, options.backupDbPath, steps.length, log);
  migrateDatabase(rawDb, steps, log);
  if (options) stampAppVersion(rawDb, options.appVersion);
}
