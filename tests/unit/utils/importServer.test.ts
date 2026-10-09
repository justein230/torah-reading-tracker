// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import fs   from 'node:fs';
import path from 'node:path';
import os   from 'node:os';
import Database from 'better-sqlite3';
import { initDb } from '../../../src/db/init';
import { importDatabase, ImportValidationError } from '../../../src/utils/import-server';
import { MIGRATIONS_DIR, STEPS, drizzleMigratedDb, migrationsWithExtraStep } from '../../helpers/migrations';

function migratedDb(filePath: string): InstanceType<typeof Database> {
  const rawDb = new Database(filePath);
  rawDb.pragma('foreign_keys = OFF');
  initDb(rawDb, MIGRATIONS_DIR);
  rawDb.pragma('foreign_keys = ON');
  return rawDb;
}

function addReading(rawDb: InstanceType<typeof Database>): void {
  const aliyah = rawDb.prepare('SELECT id FROM aliyot LIMIT 1').get() as { id: number };
  rawDb.prepare("INSERT INTO readings (aliyah_id, date_read, reading_type) VALUES (?, '2020-01-01', 'standard')").run(aliyah.id);
}

let tmpDir: string;

function setup() {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'torah-import-test-'));
  const currentPath = path.join(tmpDir, 'torah.db');
  const currentRawDb = migratedDb(currentPath);
  currentRawDb.prepare("INSERT INTO admin_password (id, password_hash) VALUES (1, 'current-hash')").run();
  currentRawDb.prepare("INSERT INTO auth_sessions (token_hash, expires_at) VALUES ('current-token', '2099-01-01T00:00:00Z')").run();
  return { tmpDir, currentPath, currentRawDb };
}

function buildCandidate(): { path: string; db: InstanceType<typeof Database> } {
  const candidatePath = path.join(tmpDir, `candidate-${Math.random()}.db`);
  return { path: candidatePath, db: migratedDb(candidatePath) };
}

afterEach(() => {
  if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('importDatabase', () => {
  it('replaces reading data with the contents of the uploaded file', () => {
    const { currentPath, currentRawDb } = setup();
    const candidate = buildCandidate();
    const aliyah = candidate.db.prepare('SELECT id FROM aliyot LIMIT 1').get() as { id: number };
    candidate.db.prepare("INSERT INTO readings (aliyah_id, date_read, reading_type) VALUES (?, '2020-01-01', 'standard')").run(aliyah.id);
    const uploadBuffer = fs.readFileSync(candidate.path);
    candidate.db.close();

    const { rawDb } = importDatabase(uploadBuffer, currentRawDb, currentPath, MIGRATIONS_DIR);
    const count = rawDb.prepare('SELECT COUNT(*) as n FROM readings').get() as { n: number };
    expect(count.n).toBe(1);
    rawDb.close();
  });

  it("preserves the running instance's admin_password and auth_sessions rows", () => {
    const { currentPath, currentRawDb } = setup();
    const candidate = buildCandidate();
    candidate.db.prepare("INSERT INTO admin_password (id, password_hash) VALUES (1, 'imported-hash')").run();
    candidate.db.prepare("INSERT INTO auth_sessions (token_hash, expires_at) VALUES ('imported-token', '2099-01-01T00:00:00Z')").run();
    const uploadBuffer = fs.readFileSync(candidate.path);
    candidate.db.close();

    const { rawDb } = importDatabase(uploadBuffer, currentRawDb, currentPath, MIGRATIONS_DIR);
    const pw = rawDb.prepare('SELECT password_hash FROM admin_password WHERE id = 1').get() as { password_hash: string };
    const session = rawDb.prepare('SELECT token_hash FROM auth_sessions').get() as { token_hash: string };
    expect(pw.password_hash).toBe('current-hash');
    expect(session.token_hash).toBe('current-token');
    rawDb.close();
  });

  it('rejects a file missing required tables and leaves the original db untouched', () => {
    const { currentPath, currentRawDb } = setup();
    const garbagePath = path.join(tmpDir, 'garbage.db');
    const garbageDb = new Database(garbagePath);
    garbageDb.exec('CREATE TABLE foo (id INTEGER)');
    garbageDb.close();
    const uploadBuffer = fs.readFileSync(garbagePath);

    expect(() => importDatabase(uploadBuffer, currentRawDb, currentPath, MIGRATIONS_DIR))
      .toThrow(ImportValidationError);

    const pw = currentRawDb.prepare('SELECT password_hash FROM admin_password WHERE id = 1').get() as { password_hash: string };
    expect(pw.password_hash).toBe('current-hash');
    currentRawDb.close();
  });

  it('rejects a non-SQLite file', () => {
    const { currentPath, currentRawDb } = setup();
    const uploadBuffer = Buffer.from('not a database');

    expect(() => importDatabase(uploadBuffer, currentRawDb, currentPath, MIGRATIONS_DIR))
      .toThrow(ImportValidationError);
    currentRawDb.close();
  });

  it('keeps only the newest 3 backups after repeated imports', () => {
    const { currentPath, currentRawDb } = setup();
    let rawDb = currentRawDb;
    for (let i = 0; i < 4; i++) {
      const candidate = buildCandidate();
      candidate.db.close();
      const buf = fs.readFileSync(candidate.path);
      ({ rawDb } = importDatabase(buf, rawDb, currentPath, MIGRATIONS_DIR));
    }
    rawDb.close();

    const backupDir = path.join(tmpDir, 'backups');
    const files = fs.readdirSync(backupDir);
    expect(files).toHaveLength(3);
  });
});

describe('importDatabase across schema versions', () => {
  // Imports the file `build` creates and checks its reading came through at the latest version.
  function expectImported(build: (uploadPath: string) => InstanceType<typeof Database>) {
    const { currentPath, currentRawDb } = setup();
    const uploadPath = path.join(tmpDir, 'upload.db');
    const upload = build(uploadPath);
    addReading(upload);
    upload.close();
    const { rawDb } = importDatabase(fs.readFileSync(uploadPath), currentRawDb, currentPath, MIGRATIONS_DIR);
    expect((rawDb.prepare('SELECT COUNT(*) AS n FROM readings').get() as { n: number }).n).toBe(1);
    expect(rawDb.pragma('user_version', { simple: true })).toBe(STEPS.length);
    rawDb.close();
  }

  // Runs `attempt` and checks the live db's file and open handle came through untouched.
  function expectLiveDbUntouched(attempt: (currentRawDb: InstanceType<typeof Database>, currentPath: string) => void) {
    const { currentPath, currentRawDb } = setup();
    const before = fs.readFileSync(currentPath);
    attempt(currentRawDb, currentPath);
    expect(fs.readFileSync(currentPath).equals(before)).toBe(true);
    expect(fs.existsSync(`${currentPath}.import-tmp`)).toBe(false);
    expect(currentRawDb.prepare('SELECT COUNT(*) AS n FROM aliyot').get()).toBeTruthy();
    currentRawDb.close();
  }

  it('upgrades an older export made by the old Drizzle setup (user_version 0)', () => {
    expectImported(uploadPath => drizzleMigratedDb(uploadPath, 3));
  });

  it('accepts a native file whose device ran upgrades (stale Drizzle table)', () => {
    expectImported(uploadPath => {
      const upload = drizzleMigratedDb(uploadPath, 3);
      initDb(upload, MIGRATIONS_DIR); // stands in for the plugin running steps 4..N
      upload.prepare('DELETE FROM __drizzle_migrations WHERE id > 3').run();
      return upload;
    });
  });

  it('rejects a file from a newer app version without touching the live db', () => {
    expectLiveDbUntouched((currentRawDb, currentPath) => {
      const candidate = buildCandidate();
      candidate.db.pragma(`user_version = ${STEPS.length + 1}`);
      candidate.db.close();
      expect(() => importDatabase(fs.readFileSync(candidate.path), currentRawDb, currentPath, MIGRATIONS_DIR))
        .toThrow(/newer version of the app/);
    });
  });

  it('leaves the live db untouched when a migration step fails', () => {
    expectLiveDbUntouched((currentRawDb, currentPath) => {
      const brokenDir = migrationsWithExtraStep(path.join(tmpDir, 'drizzle-broken'), 'SELECT * FROM no_such_table;');
      const candidate = buildCandidate();
      candidate.db.close();
      expect(() => importDatabase(fs.readFileSync(candidate.path), currentRawDb, currentPath, brokenDir))
        .toThrow(/no such table/);
    });
  });
});
