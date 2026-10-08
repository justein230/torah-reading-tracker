// @vitest-environment node
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { NATIVE_DB_VERSION, NATIVE_UPGRADE_STATEMENTS } from '../../src/db/nativeMigrations.generated.js';
import { initDb } from '../../src/db/init.js';
import { readMigrationSteps } from '../../src/utils/migrationSteps.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_FOLDER = path.join(__dirname, '../../drizzle');

function tableNames(db: InstanceType<typeof Database>): string[] {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name != 'sqlite_sequence' ORDER BY name")
    .all()
    .map((r: unknown) => (r as { name: string }).name);
}

describe('nativeMigrations.generated.ts', () => {
  it('has sequential toVersion steps with no gaps or duplicates, ending at NATIVE_DB_VERSION', () => {
    const versions = NATIVE_UPGRADE_STATEMENTS.map(s => s.toVersion);
    expect(versions).toEqual(Array.from({ length: versions.length }, (_, i) => i + 1));
    expect(NATIVE_DB_VERSION).toBe(versions[versions.length - 1]);
  });

  it('every step has at least one statement', () => {
    for (const step of NATIVE_UPGRADE_STATEMENTS) {
      expect(step.statements.length).toBeGreaterThan(0);
    }
  });

  it('is up to date with drizzle/ (re-run `npm run build:native-migrations` if this fails)', () => {
    expect(NATIVE_UPGRADE_STATEMENTS).toEqual(readMigrationSteps(MIGRATIONS_FOLDER));
  });

  it('replaying all upgrade-statement steps in order reproduces the same tables as the server runner', () => {
    const upgraded = new Database(':memory:');
    upgraded.pragma('foreign_keys = OFF');
    for (const step of NATIVE_UPGRADE_STATEMENTS) {
      for (const statement of step.statements) {
        upgraded.exec(statement);
      }
    }
    upgraded.pragma('foreign_keys = ON');

    const migrated = new Database(':memory:');
    migrated.pragma('foreign_keys = OFF');
    initDb(migrated, MIGRATIONS_FOLDER);
    migrated.pragma('foreign_keys = ON');

    expect(tableNames(upgraded)).toEqual(tableNames(migrated));
  });
});
