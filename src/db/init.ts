import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import type Database from 'better-sqlite3';
import type { AppDb } from './drizzle-server.js';

export function initDb(
  rawDb: InstanceType<typeof Database>,
  db: AppDb,
  migrationsFolder: string
): void {
  migrate(db, { migrationsFolder });
}
