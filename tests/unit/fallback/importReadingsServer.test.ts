// @vitest-environment node
// importReadingsOnly as `npm run db:rollback` uses it: torah.db ran an experimental migration
// that has since been dropped from drizzle/.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs   from 'node:fs';
import path from 'node:path';
import os   from 'node:os';
import Database from 'better-sqlite3';
import { initDb } from '../../../src/db/init';
import { importReadingsOnly } from '../../../src/fallback/import-readings-server';
import { COPY_READINGS_SQL } from '../../../src/fallback/importReadings';
import { MIGRATIONS_DIR, STEPS, migrationsWithExtraStep, schemaOf } from '../../helpers/migrations';

let tmpDir: string;
beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'torah-rollback-test-')); });
afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

// torah.db after running drizzle/ plus `extraSql` as one more step, with a row in every reading
// table and a login.
function experimentedDb(extraSql: string) {
  const dbPath = path.join(tmpDir, 'torah.db');
  const rawDb  = new Database(dbPath);
  rawDb.pragma('foreign_keys = OFF');
  initDb(rawDb, migrationsWithExtraStep(path.join(tmpDir, 'drizzle-experiment'), extraSql));
  rawDb.pragma('foreign_keys = ON');
  rawDb.exec(`
    INSERT INTO readings (aliyah_id, date_read) SELECT id, '2020-01-01' FROM aliyot LIMIT 1;
    INSERT INTO special_readings (occasion_aliyah_id, date_read) SELECT id, '2020-01-02' FROM occasion_aliyot LIMIT 1;
    INSERT INTO weekday_readings (weekday_aliyah_id, date_read) SELECT id, '2020-01-03' FROM weekday_aliyot LIMIT 1;
    INSERT INTO hosafot_readings (sefer, parsha_id_1, chapter_start, verse_start, chapter_end, verse_end, pseukim, date_read)
      SELECT 'Bereshit', id, 1, 1, 1, 5, 5, '2020-01-04' FROM parshiot LIMIT 1;
    INSERT INTO admin_password (id, password_hash) VALUES (1, 'current-hash');
  `);
  return { dbPath, rawDb };
}

// Every reading row minus its id, in the columns drizzle/ itself defines.
function readingRows(rawDb: InstanceType<typeof Database>) {
  return Object.keys(COPY_READINGS_SQL).map(table =>
    (rawDb.prepare(`SELECT * FROM ${table} ORDER BY id`).all() as Record<string, unknown>[])
      .map(({ id: _id, experiment: _experiment, ...row }) => row));
}

const readingColumns = (rawDb: InstanceType<typeof Database>) =>
  (rawDb.prepare("SELECT name FROM pragma_table_info('readings')").all() as { name: string }[]).map(r => r.name);

describe('importReadingsOnly as a rollback', () => {
  it('rebuilds a db that is a step ahead of drizzle/, keeping readings and login', () => {
    const { dbPath, rawDb: current } = experimentedDb(`
      ALTER TABLE readings ADD COLUMN experiment TEXT;
      --> statement-breakpoint
      INSERT INTO occasions (name, name_en, category, sort_order) VALUES ('ניסוי', 'Experiment', 'holiday', 999);
      --> statement-breakpoint
      INSERT INTO occasion_aliyot (occasion_id, parsha_id, aliyah_key, pseukim) SELECT id, 1, '1', 3 FROM occasions WHERE name_en = 'Experiment';
    `);
    const before = readingRows(current);
    // A reading on the experiment's own occasion can't come back: drizzle/ has no such occasion.
    current.exec(`INSERT INTO special_readings (occasion_aliyah_id, date_read)
      SELECT oa.id, '2020-02-01' FROM occasion_aliyot oa JOIN occasions o ON o.id = oa.occasion_id WHERE o.name_en = 'Experiment'`);

    const { rawDb, summary } = importReadingsOnly(fs.readFileSync(dbPath), current, dbPath, MIGRATIONS_DIR);

    const fresh = new Database(':memory:');
    fresh.pragma('foreign_keys = OFF');
    initDb(fresh, MIGRATIONS_DIR);
    expect(rawDb.pragma('user_version', { simple: true })).toBe(STEPS.length);
    expect(schemaOf(rawDb)).toEqual(schemaOf(fresh));
    expect(readingRows(rawDb)).toEqual(before);
    expect(summary).toEqual({ imported: 4, skipped: { special_readings: 1 }, droppedColumns: ['readings.experiment'] });
    expect(rawDb.prepare('SELECT password_hash FROM admin_password').get()).toEqual({ password_hash: 'current-hash' });
    expect(fs.readdirSync(path.join(tmpDir, 'backups'))).toHaveLength(1);
    fresh.close();
    rawDb.close();
  });

  it('applies a new step that took a dropped step\'s number', () => {
    const { dbPath, rawDb: current } = experimentedDb('ALTER TABLE readings ADD COLUMN experiment_a TEXT;');
    const before   = readingRows(current);
    const codeDir  = migrationsWithExtraStep(path.join(tmpDir, 'drizzle-new'), 'ALTER TABLE readings ADD COLUMN experiment_b TEXT;');

    const { rawDb } = importReadingsOnly(fs.readFileSync(dbPath), current, dbPath, codeDir);

    expect(readingColumns(rawDb)).toContain('experiment_b');
    expect(readingColumns(rawDb)).not.toContain('experiment_a');
    expect(readingRows(rawDb).map(rows => rows.map(({ experiment_a: _a, experiment_b: _b, ...row }) => row)))
      .toEqual(before.map(rows => rows.map(({ experiment_a: _a, ...row }) => row)));
    rawDb.close();
  });
});
