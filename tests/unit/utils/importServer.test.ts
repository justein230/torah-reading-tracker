// @vitest-environment node
import { describe, it, expect, afterEach } from 'vitest';
import fs   from 'node:fs';
import path from 'node:path';
import os   from 'node:os';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createDb } from '../../../src/db/drizzle-server';
import { importDatabase, ImportValidationError } from '../../../src/utils/import-server';

const MIGRATIONS_DIR = path.join(process.cwd(), 'drizzle');

function migratedDb(filePath: string): InstanceType<typeof Database> {
  const rawDb = new Database(filePath);
  rawDb.pragma('foreign_keys = OFF');
  migrate(createDb(rawDb), { migrationsFolder: MIGRATIONS_DIR });
  rawDb.pragma('foreign_keys = ON');
  return rawDb;
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
