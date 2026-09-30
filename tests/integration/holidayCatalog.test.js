// @vitest-environment node

import { afterAll, describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import Database from 'better-sqlite3';

const TEMP_DB = path.join(os.tmpdir(), `torah-holiday-catalog-${process.pid}.db`);
process.env.TORAH_DB_PATH        = TEMP_DB;
process.env.TORAH_ADMIN_PASSWORD = 'unused';

// server.ts runs initDb on import, applying every migration to the temp file
await import('../../server.ts');
const db = new Database(TEMP_DB, { readonly: true });

afterAll(() => {
  db.close();
  try { fs.unlinkSync(TEMP_DB); } catch {}
});

// Invariants that hold for any correct occasion catalog, so they also guard future seed migrations.
// Against the pre-0005 catalog these fail on Purim, Simchat Torah, Sukkot Day 1 (Shabbat), Chanukah and Pesach Day 1 (Shabbat).
describe('occasion catalog integrity', () => {
  it('no occasion range starts or ends past its chapter length', () => {
    const bad = db.prepare(`
      SELECT o.name_en, oa.aliyah_key, oa.chapter_start, oa.verse_start, oa.chapter_end, oa.verse_end
      FROM occasion_aliyot oa
      JOIN occasions o ON o.id = oa.occasion_id
      JOIN parshiot p  ON p.id = oa.parsha_id
      LEFT JOIN torah_chapters cs ON cs.sefer_id = p.sefer_id AND cs.chapter = oa.chapter_start
      LEFT JOIN torah_chapters ce ON ce.sefer_id = p.sefer_id AND ce.chapter = oa.chapter_end
      WHERE oa.chapter_start > 0 AND (
        cs.verse_count IS NULL OR ce.verse_count IS NULL
        OR oa.verse_start > cs.verse_count OR oa.verse_end > ce.verse_count
      )`).all();
    expect(bad).toEqual([]);
  });

  it('every range is ordered and pseukim equals the verse count for single-chapter ranges', () => {
    const rows = db.prepare(`SELECT * FROM occasion_aliyot WHERE chapter_start > 0`).all();
    for (const r of rows) {
      expect(r.chapter_end * 1000 + r.verse_end).toBeGreaterThanOrEqual(r.chapter_start * 1000 + r.verse_start);
      if (r.chapter_start === r.chapter_end) expect(r.pseukim).toBe(r.verse_end - r.verse_start + 1);
    }
  });

  it('covers_aliyah_id only points at an aliyah with the identical range', () => {
    const bad = db.prepare(`
      SELECT oa.id FROM occasion_aliyot oa JOIN aliyot a ON a.id = oa.covers_aliyah_id
      WHERE a.parsha_id != oa.parsha_id OR a.chapter_start != oa.chapter_start OR a.verse_start != oa.verse_start
         OR a.chapter_end != oa.chapter_end OR a.verse_end != oa.verse_end`).all();
    expect(bad).toEqual([]);
  });
});
