// @vitest-environment node

import { afterAll, afterEach, describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import Database from 'better-sqlite3';
import request from 'supertest';
import { logFilePath } from '../../src/utils/logger-server.ts';

const TEMP_DB = path.join(os.tmpdir(), `torah-test-${process.pid}.db`);
const TEST_PASSWORD = 'correct horse battery staple';

process.env.TORAH_DB_PATH        = TEMP_DB;
process.env.TORAH_ADMIN_PASSWORD = TEST_PASSWORD;

// server.ts calls initDb on import: migrate + seed are applied automatically
const { app } = await import('../../server.ts');
// Own connection to the same file server.ts opened, used only for direct SQL cleanup
// between tests — server.ts no longer exports its internal db handle (see server.ts).
const db = new Database(TEMP_DB);

// This suite checks the HTTP layer: routing, status codes, the RepoError → response mapping and
// the error handler. The validation, reading-type and duplicate rules themselves are tested once,
// against the repository, in tests/unit/repository.test.ts. Logging in once up front via a
// cookie-persisting agent keeps every request below authenticated.
const agent = request.agent(app);
await agent.post('/api/auth/login').send({ password: TEST_PASSWORD });

afterEach(() => {
  for (const table of ['readings', 'special_readings', 'weekday_readings', 'hosafot_readings']) {
    db.prepare(`DELETE FROM ${table}`).run();
  }
});

afterAll(() => {
  try { fs.unlinkSync(TEMP_DB); } catch {}
});

const firstId = async (url: string): Promise<number> => (await agent.get(url)).body[0].id;

const STANDARD = { parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' };
const HOSAFAH = {
  sefer: 'בְּרֵאשִׁית', chapter_start: 1, verse_start: 1, chapter_end: 1, verse_end: 5,
  pseukim: 5, date_read: '2024-01-01',
};

// ── GETs ──────────────────────────────────────────────────────────────────────

describe('GET /api/can-write', () => {
  it('returns canWrite: true when logged in', async () => {
    const res = await agent.get('/api/can-write');
    expect(res.status).toBe(200);
    expect(res.body.canWrite).toBe(true);
  });
});

describe('read-only endpoints', () => {
  it.each([
    ['/api/aliyot',          ['sefer', 'parsha', 'aliyah', 'pseukim', 'orig', 'fut']],
    ['/api/occasions',       ['id', 'name', 'nameEn', 'category']],
    ['/api/occasion-aliyot', ['id', 'occasion_id', 'aliyah_key', 'orig', 'all_dates']],
    ['/api/weekday-aliyot',  ['id', 'parsha_id', 'aliyah_num', 'all_dates']],
  ])('%s returns a non-empty array of rows with the expected keys', async (url, keys) => {
    const res = await agent.get(url);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const key of keys) expect(res.body[0]).toHaveProperty(key);
  });

  it.each(['/api/readings', '/api/readings/special', '/api/readings/hosafot', '/api/stats/location'])(
    '%s returns an empty array when nothing has been read', async url => {
      const res = await agent.get(url);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

  it('/api/meta returns sefarim, parshiot and pairs', async () => {
    const res = await agent.get('/api/meta');
    expect(res.status).toBe(200);
    for (const key of ['sefarim', 'parshiot', 'pairs']) expect(res.body[key].length).toBeGreaterThan(0);
  });

  it('/api/hebcal returns a schedule populated from the baked cache', async () => {
    const res = await agent.get('/api/hebcal');
    expect(res.status).toBe(200);
    // The cache runs through 2050, so every standard parsha resolves to a future date.
    expect(Object.keys(res.body.schedule).length).toBeGreaterThan(50);
    expect(res.body.schedule['Bereshit']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('/api/calendar.ics returns an ICS feed with the expected headers and content', async () => {
    const res = await agent.get('/api/calendar.ics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.headers['content-disposition']).toContain('torah-readings.ics');
    expect(res.text).toContain('BEGIN:VCALENDAR');
    expect(res.text).toContain('END:VCALENDAR');
  });
});

// ── create / update / delete, one round trip per reading type ─────────────────

describe('standard readings', () => {
  it('POST → 201, PUT → 200, DELETE → 204, and the aliyot feed follows along', async () => {
    const post = await agent.post('/api/readings').send({ ...STANDARD, occasion: 'Old', location: 'Home' });
    expect(post.status).toBe(201);
    expect(post.body.reading_type).toBe('standard');

    const put = await agent.put(`/api/readings/${post.body.id}`).send({ occasion: 'New', location: 'Shul' });
    expect(put.status).toBe(200);
    expect(put.body.id).toBe(post.body.id);

    const read = (await agent.get('/api/aliyot')).body.find((r: { aliyah: number }) => r.aliyah === 1);
    expect(read).toMatchObject({ orig: '2024-01-01', occasion: 'New', location: 'Shul' });

    expect((await agent.delete(`/api/readings/${post.body.id}`)).status).toBe(204);
    const unread = (await agent.get('/api/aliyot')).body.find((r: { aliyah: number }) => r.aliyah === 1);
    expect(unread.orig).toBe('');
  });

  it('feeds the location stats', async () => {
    await agent.post('/api/readings').send({ ...STANDARD, location: 'Shul' });
    const res = await agent.get('/api/stats/location');
    expect(res.body).toEqual([{ location: 'Shul', count: 1, past_count: 1, upcoming_count: 0 }]);
  });
});

describe('special readings', () => {
  it('POST → 201, listed, DELETE → 204', async () => {
    const occasion_aliyah_id = await firstId('/api/occasion-aliyot');
    const post = await agent.post('/api/readings/special').send({ occasion_aliyah_id, date_read: '2024-01-01' });
    expect(post.status).toBe(201);
    expect((await agent.get('/api/readings/special')).body).toHaveLength(1);
    expect((await agent.delete(`/api/readings/special/${post.body.id}`)).status).toBe(204);
    expect((await agent.get('/api/readings/special')).body).toEqual([]);
  });
});

describe('weekday readings', () => {
  it('POST → 201, PUT → 200, DELETE → 204', async () => {
    const weekday_aliyah_id = await firstId('/api/weekday-aliyot');
    const post = await agent.post('/api/readings/weekday').send({ weekday_aliyah_id, date_read: '2024-01-01' });
    expect(post.status).toBe(201);

    const put = await agent.put(`/api/readings/weekday/${post.body.id}`).send({ date_read: '2024-02-01', location: 'Shul' });
    expect(put.status).toBe(200);
    const row = (await agent.get('/api/weekday-aliyot')).body.find((r: { id: number }) => r.id === weekday_aliyah_id);
    expect(row.all_dates).toContain('2024-02-01');

    expect((await agent.delete(`/api/readings/weekday/${post.body.id}`)).status).toBe(204);
  });
});

describe('hosafot readings', () => {
  it('POST → 201, listed, PUT → 200, DELETE → 204', async () => {
    const post = await agent.post('/api/readings/hosafot').send(HOSAFAH);
    expect(post.status).toBe(201);
    expect((await agent.get('/api/readings/hosafot')).body[0].sefer).toBe(HOSAFAH.sefer);

    const put = await agent.put(`/api/readings/hosafot/${post.body.id}`).send({ date_read: '2024-03-01' });
    expect(put.status).toBe(200);
    expect((await agent.get('/api/readings/hosafot')).body[0].date_read).toBe('2024-03-01');

    expect((await agent.delete(`/api/readings/hosafot/${post.body.id}`)).status).toBe(204);
    expect((await agent.get('/api/readings/hosafot')).body).toEqual([]);
  });
});

// ── error mapping ─────────────────────────────────────────────────────────────

describe('RepoError → HTTP response', () => {
  it('400s with the detail, 404s a missing id, and 409s a duplicate', async () => {
    const bad = await agent.post('/api/readings').send({ aliyah: 1, date_read: '2024-01-01' });
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ detail: 'parsha is required' });

    const missing = await agent.delete('/api/readings/99999');
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ detail: 'Reading not found' });

    await agent.post('/api/readings').send(STANDARD);
    const dup = await agent.post('/api/readings').send(STANDARD);
    expect(dup.status).toBe(409);
    expect(dup.body.detail).toMatch(/already recorded/);
  });
});

// Express 5 leaves req.body undefined (Express 4 made it {}) when nothing was parsed, so every
// handler that destructures it must be reached with a defined body.
describe('requests with no body', () => {
  it.each([
    ['POST', '/api/readings', 400],
    ['POST', '/api/readings/special', 400],
    ['POST', '/api/readings/weekday', 400],
    ['POST', '/api/readings/hosafot', 400],
    ['PUT',  '/api/readings/weekday/1', 400],
    ['PUT',  '/api/readings/hosafot/1', 400],
    ['POST', '/api/auth/login', 401],
    ['POST', '/api/auth/change-password', 401],
  ] as const)('%s %s answers %i, not a 500', async (method, url, status) => {
    const res = await (method === 'PUT' ? agent.put(url) : agent.post(url));
    expect(res.status).toBe(status);
  });
});

describe('unhandled route errors', () => {
  it('responds with a generic 500 and no stack trace', async () => {
    // date_read is not a type better-sqlite3 can bind (string/number/bigint/buffer/null),
    // so the insert throws a non-unique-constraint error that reaches the error middleware.
    const res = await agent.post('/api/readings').send({ ...STANDARD, date_read: { not: 'a string' } });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ detail: 'Internal error' });
    expect(res.text).not.toMatch(/at .*\(.*:\d+:\d+\)/); // no stack frame leaked
  });
});

// ── mutation logging ─────────────────────────────────────────────────────────

describe('mutation logging', () => {
  const loggedLines = () => fs.readFileSync(logFilePath(TEMP_DB), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));

  it('logs a warn-level line for a failed mutation, without the request body at the default (info) level', async () => {
    const res = await agent.delete('/api/readings/999999');
    expect(res.status).toBe(404);

    const entry = loggedLines().find(l => l.msg === 'request completed' && l.req?.url === '/api/readings/999999');
    expect(entry).toBeDefined();
    expect(entry.level).toBe(40); // pino 'warn'
    expect(entry.res.statusCode).toBe(404);
    expect(entry.body).toBeUndefined();
  });

  it('never logs a line for a GET request', async () => {
    await agent.get('/api/readings');
    expect(loggedLines().some(l => l.req?.method === 'GET')).toBe(false);
  });
});
