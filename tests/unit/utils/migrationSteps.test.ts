// @vitest-environment node
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { effectiveSchemaVersion, migrateDatabase } from '../../../src/utils/migrationSteps';
import { NewerSchemaError } from '../../../src/utils/schemaVersion';
import { STEPS, drizzleMigratedDb, schemaOf } from '../../helpers/migrations';

const LATEST = STEPS.length;

function freshDb(): InstanceType<typeof Database> {
  const rawDb = new Database(':memory:');
  rawDb.pragma('foreign_keys = OFF');
  return rawDb;
}

const userVersion = (rawDb: InstanceType<typeof Database>) => rawDb.pragma('user_version', { simple: true });

describe('migrateDatabase', () => {
  it('applies every step to a fresh database and stamps the latest version', () => {
    const rawDb = freshDb();
    migrateDatabase(rawDb, STEPS);
    expect(userVersion(rawDb)).toBe(LATEST);
  });

  it('produces the same schema and reference data as Drizzle’s migrate()', () => {
    const ours   = freshDb();
    migrateDatabase(ours, STEPS);
    const theirs = drizzleMigratedDb(':memory:');
    expect(schemaOf(ours)).toEqual(schemaOf(theirs));
    for (const { name } of ours.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]) {
      expect(ours.prepare(`SELECT * FROM "${name}"`).all(), name).toEqual(theirs.prepare(`SELECT * FROM "${name}"`).all());
    }
  });

  it('runs only the remaining steps on a partly migrated database', () => {
    const rawDb = freshDb();
    migrateDatabase(rawDb, STEPS.slice(0, 3));
    // Re-running step 1's CREATE TABLEs would throw, so success shows they were skipped.
    migrateDatabase(rawDb, STEPS);
    expect(userVersion(rawDb)).toBe(LATEST);
  });

  it('picks up an old-setup server database at its Drizzle row count', () => {
    const rawDb = drizzleMigratedDb(':memory:', 3);
    expect(userVersion(rawDb)).toBe(0);
    migrateDatabase(rawDb, STEPS);
    expect(userVersion(rawDb)).toBe(LATEST);
  });

  it('leaves a native database that upgraded on-device (stale Drizzle table) as is', () => {
    const rawDb = drizzleMigratedDb(':memory:', 3);
    migrateDatabase(rawDb, STEPS); // stands in for the plugin running steps 4..N
    rawDb.prepare('DELETE FROM __drizzle_migrations WHERE id > 3').run();
    const before = schemaOf(rawDb);
    migrateDatabase(rawDb, STEPS);
    expect(schemaOf(rawDb)).toEqual(before);
    expect(userVersion(rawDb)).toBe(LATEST);
  });

  it('refuses a database from a newer app version and changes nothing', () => {
    const byVersion = freshDb();
    byVersion.pragma(`user_version = ${LATEST + 1}`);
    expect(() => migrateDatabase(byVersion, STEPS)).toThrow(NewerSchemaError);
    expect(schemaOf(byVersion)).toEqual([]);

    // An old-setup file from a newer version has an extra Drizzle row instead.
    const byDrizzle = drizzleMigratedDb(':memory:');
    byDrizzle.prepare("INSERT INTO __drizzle_migrations (hash, created_at) VALUES ('future', 9999999999999)").run();
    expect(() => migrateDatabase(byDrizzle, STEPS)).toThrow(NewerSchemaError);
    expect(userVersion(byDrizzle)).toBe(0);
  });

  it('logs the switch-over and each step it applies', () => {
    const rawDb    = drizzleMigratedDb(':memory:', 3);
    const messages: string[] = [];
    migrateDatabase(rawDb, STEPS, message => messages.push(message));
    expect(messages).toEqual([
      'Database schema: version 0 -> 3, read from the old __drizzle_migrations table',
      `Database schema: at version 3, applying ${LATEST - 3} migration(s) to reach ${LATEST}`,
      ...STEPS.slice(3).map(step => expect.stringMatching(
        new RegExp(`^Database schema: applied migration ${step.toVersion} \\(${step.name}\\), ${step.statements.length} statement\\(s\\) in \\d+ ms$`))),
    ]);

    const again: string[] = [];
    migrateDatabase(rawDb, STEPS, message => again.push(message));
    expect(again).toEqual([`Database schema: at version ${LATEST}, up to date`]);
  });

  it('rolls back a failing step and stays at the previous version', () => {
    const rawDb    = freshDb();
    const broken   = { toVersion: LATEST + 1, name: '9999_broken', statements: ['CREATE TABLE half_done (x)', 'SELECT * FROM no_such_table'] };
    const messages: string[] = [];
    expect(() => migrateDatabase(rawDb, [...STEPS, broken], message => messages.push(message))).toThrow();
    expect(messages.at(-1)).toBe(`Database schema: migration ${LATEST + 1} (9999_broken) failed and was rolled back; staying at version ${LATEST}`);
    expect(userVersion(rawDb)).toBe(LATEST);
    expect(rawDb.prepare("SELECT 1 FROM sqlite_master WHERE name = 'half_done'").get()).toBeUndefined();
  });
});

describe('effectiveSchemaVersion', () => {
  it('is 0 for a fresh, empty database', () => {
    expect(effectiveSchemaVersion(freshDb())).toBe(0);
  });

  it('is user_version for a database our runner migrated', () => {
    const rawDb = freshDb();
    migrateDatabase(rawDb, STEPS.slice(0, 3));
    expect(effectiveSchemaVersion(rawDb)).toBe(3);
  });

  it('is the Drizzle row count for an old-setup database with user_version 0', () => {
    expect(effectiveSchemaVersion(drizzleMigratedDb(':memory:', 3))).toBe(3);
  });

  it('never lowers user_version to a stale Drizzle row count', () => {
    const rawDb = drizzleMigratedDb(':memory:', 3);
    rawDb.pragma(`user_version = ${LATEST}`);
    expect(effectiveSchemaVersion(rawDb)).toBe(LATEST);
  });
});
