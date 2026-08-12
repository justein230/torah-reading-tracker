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
import request from 'supertest';

const TEMP_DB = path.join(os.tmpdir(), `torah-hebcal-test-${process.pid}.db`);

process.env.TORAH_DB_PATH     = TEMP_DB;
process.env.TORAH_ALLOWED_IPS = '127.0.0.0/8';

const { app, rawDb: db } = await import('../../server.ts');

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
      expect(res.body).toEqual({ schedule: {} });
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
