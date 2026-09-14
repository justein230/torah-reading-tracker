// @vitest-environment node
/**
 * Covers the failure contract of GET /api/hebcal.
 *
 * This lives in its own file (and on its own DB) because server.ts memoises the schedule
 * in a module-level `_schedule`: the first successful request would make every later one
 * a cache hit, so the error path is only reachable on a freshly-imported module.
 */

import { afterAll, describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import Database from 'better-sqlite3';
import request from 'supertest';

const TEMP_DB = path.join(os.tmpdir(), `torah-hebcal-test-${process.pid}.db`);

process.env.TORAH_DB_PATH     = TEMP_DB;

const { app } = await import('../../server.ts');
// Own connection to the same file server.ts opened, used only for direct SQL manipulation
// in this test — server.ts no longer exports its internal db handle (see server.ts).
const db = new Database(TEMP_DB);

afterAll(() => {
  try { fs.unlinkSync(TEMP_DB); } catch {}
});

describe('GET /api/hebcal — failure fallback', () => {
  it('serves an empty schedule with status 200 when the schedule cannot be built', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    // Pull the parshiot table out from under getSchedule. The frontend treats a missing
    // schedule as "no upcoming dates known" and still renders; a 500 would break the load.
    db.prepare('ALTER TABLE parshiot RENAME TO parshiot_hidden').run();

    try {
      const res = await request(app).get('/api/hebcal');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ schedule: {}, datesByParsha: {}, cacheYears: [1990, 2050] });
      expect(error).toHaveBeenCalledWith('Hebcal error:', expect.any(String));
    } finally {
      db.prepare('ALTER TABLE parshiot_hidden RENAME TO parshiot').run();
      error.mockRestore();
    }
  });

  it('recovers on the next request once the failure clears', async () => {
    const res = await request(app).get('/api/hebcal');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.schedule).length).toBeGreaterThan(0);
  });
});

describe('GET /api/hebcal/lookup', () => {
  it('returns the parshiot found for a date, from a live fetch', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        items: [{ title: 'Parashat Ki Teitzei', date: '2026-08-22T00:00:00', category: 'parashat' }],
      }),
    });

    try {
      const res = await request(app).get('/api/hebcal/lookup?date=2026-08-22');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ parshiot: ['Ki Teitzei'] });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('400s on a malformed date', async () => {
    const res = await request(app).get('/api/hebcal/lookup?date=not-a-date');
    expect(res.status).toBe(400);
  });

  it('400s when the date param is missing', async () => {
    const res = await request(app).get('/api/hebcal/lookup');
    expect(res.status).toBe(400);
  });

  it('never 500s when the live fetch fails — degrades to an empty result', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network down'));

    try {
      const res = await request(app).get('/api/hebcal/lookup?date=2026-08-22');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ parshiot: [] });
    } finally {
      globalThis.fetch = originalFetch;
      error.mockRestore();
    }
  });
});
