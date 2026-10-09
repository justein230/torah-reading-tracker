// @vitest-environment node
import fs   from 'node:fs';
import os   from 'node:os';
import path from 'node:path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { backupBeforeMigrating, readAppVersion, stampAppVersion } from '../../../src/utils/backup-server';
import { effectiveSchemaVersion, migrateDatabase } from '../../../src/utils/migrationSteps';
import { NewerSchemaError } from '../../../src/utils/schemaVersion';
import { formatBackupName, parseBackupName } from '../../../src/utils/dbBackupName';
import { initDb } from '../../../src/db/init';
import { MIGRATIONS_DIR, STEPS, drizzleMigratedDb } from '../../helpers/migrations';

const LATEST = STEPS.length;
const NOW    = new Date('2026-10-08T14:03:22Z');

let dir: string;
let dbPath: string;

beforeEach(() => {
  dir    = fs.mkdtempSync(path.join(os.tmpdir(), 'torah-backup-'));
  dbPath = path.join(dir, 'torah.db');
});
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

function openDb(): InstanceType<typeof Database> {
  const rawDb = new Database(dbPath);
  rawDb.pragma('journal_mode = DELETE');
  rawDb.pragma('foreign_keys = OFF');
  return rawDb;
}

// A db as an older app left it: `steps` applied, optionally with app_meta stamped.
function dbAtStep(steps: number): InstanceType<typeof Database> {
  const rawDb = openDb();
  migrateDatabase(rawDb, STEPS.slice(0, steps));
  return rawDb;
}

const backupFiles = () => fs.readdirSync(dir).filter(f => parseBackupName(f));

describe('backupBeforeMigrating', () => {
  it('copies an out-of-date db beside itself, named after its schema version', () => {
    const rawDb = dbAtStep(LATEST - 1);
    const dest  = backupBeforeMigrating(rawDb, dbPath, LATEST, undefined, NOW);

    expect(dest).toBe(path.join(dir, formatBackupName({ dbBase: 'torah', date: NOW, schemaVersion: LATEST - 1, appVersion: 'unknown' })));
    const copy = new Database(dest!, { readonly: true });
    expect(effectiveSchemaVersion(copy)).toBe(LATEST - 1);
    copy.close();
  });

  it('names the app version that last used the db, once app_meta exists', () => {
    const rawDb = dbAtStep(LATEST);
    stampAppVersion(rawDb, '1.0.9-dev.3');
    rawDb.pragma(`user_version = ${LATEST - 1}`); // pretend one more step is pending
    const dest = backupBeforeMigrating(rawDb, dbPath, LATEST, undefined, NOW);
    expect(parseBackupName(path.basename(dest!))?.appVersion).toBe('1.0.9-dev.3');
  });

  it('picks up an old-setup db by its Drizzle row count', () => {
    const rawDb = drizzleMigratedDb(dbPath, 3);
    const dest  = backupBeforeMigrating(rawDb, dbPath, LATEST, undefined, NOW);
    expect(parseBackupName(path.basename(dest!))?.schemaVersion).toBe(3);
  });

  it('does nothing for a fresh empty db, an up-to-date db, or one from a newer app', () => {
    const fresh = openDb();
    expect(backupBeforeMigrating(fresh, dbPath, LATEST)).toBeNull();
    migrateDatabase(fresh, STEPS);
    expect(backupBeforeMigrating(fresh, dbPath, LATEST)).toBeNull();
    fresh.pragma(`user_version = ${LATEST + 1}`);
    expect(backupBeforeMigrating(fresh, dbPath, LATEST)).toBeNull();
    expect(backupFiles()).toEqual([]);
  });

  it('keeps only the newest 5 and leaves unrelated files alone', () => {
    const rawDb = dbAtStep(LATEST - 1);
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'keep me');
    fs.writeFileSync(path.join(dir, 'torah.db.bak'), 'keep me');
    for (let day = 1; day <= 7; day++) backupBeforeMigrating(rawDb, dbPath, LATEST, undefined, new Date(`2026-10-0${day}T00:00:00Z`));

    expect(backupFiles().map(f => parseBackupName(f)!.date.getUTCDate()).sort()).toEqual([3, 4, 5, 6, 7]);
    expect(fs.existsSync(path.join(dir, 'notes.txt'))).toBe(true);
    expect(fs.existsSync(path.join(dir, 'torah.db.bak'))).toBe(true);
  });

  it('logs the backup it made', () => {
    const messages: string[] = [];
    backupBeforeMigrating(dbAtStep(LATEST - 1), dbPath, LATEST, m => messages.push(m), NOW);
    expect(messages.join('\n')).toMatch(/backed up version \d+ to .*torah-backup-/);
  });
});

describe('readAppVersion / stampAppVersion', () => {
  it('is undefined before app_meta exists and reads back what was stamped', () => {
    const rawDb = dbAtStep(LATEST - 1);
    expect(readAppVersion(rawDb)).toBeUndefined();
    migrateDatabase(rawDb, STEPS);
    expect(readAppVersion(rawDb)).toBeUndefined();
    stampAppVersion(rawDb, '1.0.8');
    stampAppVersion(rawDb, '1.0.9');
    expect(readAppVersion(rawDb)).toBe('1.0.9');
  });
});

describe('initDb with backup options', () => {
  it('backs up before migrating, then stamps the running app version', () => {
    const rawDb = dbAtStep(LATEST - 1);
    initDb(rawDb, MIGRATIONS_DIR, undefined, { appVersion: '1.0.9', backupDbPath: dbPath });

    expect(effectiveSchemaVersion(rawDb)).toBe(LATEST);
    expect(readAppVersion(rawDb)).toBe('1.0.9');
    const [backup] = backupFiles();
    expect(parseBackupName(backup!)).toMatchObject({ schemaVersion: LATEST - 1, appVersion: 'unknown' });
  });

  it('makes no backup on a restart with nothing to migrate', () => {
    const rawDb = dbAtStep(LATEST);
    initDb(rawDb, MIGRATIONS_DIR, undefined, { appVersion: '1.0.9', backupDbPath: dbPath });
    expect(backupFiles()).toEqual([]);
    expect(readAppVersion(rawDb)).toBe('1.0.9');
  });

  it('does not migrate when the backup cannot be written', () => {
    const rawDb = dbAtStep(LATEST - 1);
    if (process.getuid?.() === 0) return; // root ignores directory permissions
    fs.chmodSync(dir, 0o500); // read-only directory: the copy fails
    try {
      expect(() => initDb(rawDb, MIGRATIONS_DIR, undefined, { appVersion: '1.0.9', backupDbPath: dbPath })).toThrow();
      expect(effectiveSchemaVersion(rawDb)).toBe(LATEST - 1);
    } finally {
      fs.chmodSync(dir, 0o700);
    }
  });

  it('still refuses a db from a newer app, without backing it up', () => {
    const rawDb = dbAtStep(LATEST);
    rawDb.pragma(`user_version = ${LATEST + 1}`);
    expect(() => initDb(rawDb, MIGRATIONS_DIR, undefined, { appVersion: '1.0.9', backupDbPath: dbPath })).toThrow(NewerSchemaError);
    expect(backupFiles()).toEqual([]);
  });
});
