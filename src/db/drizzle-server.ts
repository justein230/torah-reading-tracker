import { drizzle } from 'drizzle-orm/better-sqlite3';
import type Database from 'better-sqlite3';
import * as schema from './schema.js';

export function createDb(sqlite: InstanceType<typeof Database>) {
  return drizzle(sqlite, { schema });
}

export type AppDb = ReturnType<typeof createDb>;
