// @vitest-environment node

import { afterAll, afterEach, describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import request from 'supertest';

const TEMP_DB = path.join(os.tmpdir(), `torah-test-${process.pid}.db`);

process.env.TORAH_DB_PATH     = TEMP_DB;
process.env.TORAH_ALLOWED_IPS = '127.0.0.0/8';

// server.ts calls initDb on import: migrate + seed are applied automatically
const { app, rawDb: db } = await import('../../server.ts');

afterEach(() => {
  db.prepare('DELETE FROM readings').run();
  db.prepare('DELETE FROM special_readings').run();
  db.prepare('DELETE FROM weekday_readings').run();
  db.prepare('DELETE FROM hosafot_readings').run();
});

afterAll(() => {
  try { fs.unlinkSync(TEMP_DB); } catch {}
});

// ── GET /api/can-write ────────────────────────────────────────────────────────

describe('GET /api/can-write', () => {
  it('returns canWrite: true for localhost', async () => {
    const res = await request(app).get('/api/can-write');
    expect(res.status).toBe(200);
    expect(res.body.canWrite).toBe(true);
  });
});

// ── GET /api/aliyot ───────────────────────────────────────────────────────────

describe('GET /api/aliyot', () => {
  it('returns aliyot with correct shape', async () => {
    const res = await request(app).get('/api/aliyot');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const first = res.body[0];
    expect(first).toHaveProperty('sefer');
    expect(first).toHaveProperty('parsha');
    expect(first).toHaveProperty('aliyah');
    expect(first).toHaveProperty('pseukim');
    expect(first).toHaveProperty('orig');
    expect(first).toHaveProperty('fut');
  });

  it('reflects a reading in orig after POST', async () => {
    await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    const res = await request(app).get('/api/aliyot');
    const row = res.body.find(r => r.aliyah === 1);
    expect(row.orig).toBe('2024-01-01');
  });

  it('sets direct_orig (equal to orig) for a directly-read aliyah, empty when unread', async () => {
    await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    const res = await request(app).get('/api/aliyot');
    const read   = res.body.find(r => r.aliyah === 1);
    const unread = res.body.find(r => r.orig === '');
    expect(read.direct_orig).toBe('2024-01-01');
    expect(unread.direct_orig).toBe('');
  });

  it('reflects a re-read in fut and reread_count after second POST', async () => {
    await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2025-06-01' });
    const res = await request(app).get('/api/aliyot');
    const row = res.body.find(r => r.aliyah === 1);
    expect(row.reread_count).toBe(1);
    expect(row.fut).toContain('2025-06-01');
  });
});

// ── POST /api/readings ────────────────────────────────────────────────────────

describe('POST /api/readings', () => {
  it('returns 201 and reading_type=standard for first reading', async () => {
    const res = await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    expect(res.status).toBe(201);
    expect(res.body.reading_type).toBe('standard');
    expect(typeof res.body.id).toBe('number');
  });

  it('returns reading_type=additional for second reading of same aliyah', async () => {
    await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    const res = await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2025-03-01' });
    expect(res.status).toBe(201);
    expect(res.body.reading_type).toBe('additional');
  });

  it('returns 400 when parsha is missing', async () => {
    const res = await request(app).post('/api/readings')
      .send({ aliyah: 1, date_read: '2024-01-01' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when aliyah is missing', async () => {
    const res = await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', date_read: '2024-01-01' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when date_read is missing', async () => {
    const res = await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1 });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent parsha', async () => {
    const res = await request(app).post('/api/readings')
      .send({ parsha: 'NonExistent', aliyah: 1, date_read: '2024-01-01' });
    expect(res.status).toBe(404);
  });

  it('returns 409 for a duplicate (same aliyah + date)', async () => {
    await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    const res = await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    expect(res.status).toBe(409);
  });

  it('stores occasion and location', async () => {
    await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01', occasion: 'Bar Mitzvah', location: 'Shul' });
    const aliyot = await request(app).get('/api/aliyot');
    const row = aliyot.body.find(r => r.aliyah === 1);
    expect(row.occasion).toBe('Bar Mitzvah');
    expect(row.location).toBe('Shul');
  });
});

// ── PUT /api/readings/:id ─────────────────────────────────────────────────────

describe('PUT /api/readings/:id', () => {
  it('updates occasion and location', async () => {
    const post = await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01', occasion: 'Old', location: 'Home' });
    const id = post.body.id;

    const res = await request(app).put(`/api/readings/${id}`)
      .send({ occasion: 'New Occasion', location: 'Shul' });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);

    const aliyot = await request(app).get('/api/aliyot');
    const row = aliyot.body.find(r => r.aliyah === 1);
    expect(row.occasion).toBe('New Occasion');
    expect(row.location).toBe('Shul');
  });

  it('returns 404 for a non-existent reading', async () => {
    const res = await request(app).put('/api/readings/99999')
      .send({ occasion: 'x' });
    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/readings/:id ──────────────────────────────────────────────────

describe('DELETE /api/readings/:id', () => {
  it('returns 204 and removes the reading', async () => {
    const post = await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    const id = post.body.id;

    const del = await request(app).delete(`/api/readings/${id}`);
    expect(del.status).toBe(204);

    const aliyot = await request(app).get('/api/aliyot');
    const row = aliyot.body.find(r => r.aliyah === 1);
    expect(row.orig).toBe('');
  });

  it('returns 404 for a non-existent reading', async () => {
    const res = await request(app).delete('/api/readings/99999');
    expect(res.status).toBe(404);
  });
});

// ── GET /api/meta ─────────────────────────────────────────────────────────────

describe('GET /api/meta', () => {
  it('returns sefarim, parshiot, and pairs arrays', async () => {
    const res = await request(app).get('/api/meta');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sefarim)).toBe(true);
    expect(Array.isArray(res.body.parshiot)).toBe(true);
    expect(Array.isArray(res.body.pairs)).toBe(true);
    expect(res.body.sefarim.length).toBeGreaterThan(0);
  });
});

// ── GET /api/stats/location ───────────────────────────────────────────────────

describe('GET /api/stats/location', () => {
  it('returns an array of location stats', async () => {
    const res = await request(app).get('/api/stats/location');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('reflects a posted reading in location stats', async () => {
    await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01', location: 'Shul' });
    const res = await request(app).get('/api/stats/location');
    const shul = res.body.find(r => r.location === 'Shul');
    expect(shul).toBeDefined();
    expect(typeof shul.count).toBe('number');
  });
});

// ── GET /api/hebcal ───────────────────────────────────────────────────────────

describe('GET /api/hebcal', () => {
  it('returns a schedule object populated from the baked cache', async () => {
    const res = await request(app).get('/api/hebcal');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('schedule');
    expect(typeof res.body.schedule).toBe('object');

    // The cache runs through 2050, so every standard parsha resolves to a future date.
    const schedule = res.body.schedule;
    expect(Object.keys(schedule).length).toBeGreaterThan(50);
    expect(schedule).toHaveProperty('Bereshit');
    expect(schedule['Bereshit']).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ── occasions / occasion-aliyot / readings/special ────────────────────────────

describe('GET /api/occasions', () => {
  it('returns occasions with the expected shape', async () => {
    const res = await request(app).get('/api/occasions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
    expect(res.body[0]).toHaveProperty('nameEn');
    expect(res.body[0]).toHaveProperty('category');
  });
});

describe('GET /api/occasion-aliyot', () => {
  it('returns occasion aliyot with the expected shape', async () => {
    const res = await request(app).get('/api/occasion-aliyot');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const first = res.body[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('occasion_id');
    expect(first).toHaveProperty('aliyah_key');
    expect(first).toHaveProperty('orig');
    expect(first).toHaveProperty('all_dates');
  });
});

describe('GET /api/readings/special', () => {
  it('returns an empty array when nothing has been read', async () => {
    const res = await request(app).get('/api/readings/special');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('reflects a posted special reading', async () => {
    const aliyot = await request(app).get('/api/occasion-aliyot');
    const occasionAliyahId = aliyot.body[0].id;
    await request(app).post('/api/readings/special')
      .send({ occasion_aliyah_id: occasionAliyahId, date_read: '2024-01-01' });
    const res = await request(app).get('/api/readings/special');
    expect(res.body.some(r => r.occasion_aliyah_id === occasionAliyahId)).toBe(true);
  });
});

describe('POST /api/readings/special', () => {
  it('returns 201 and an id on success', async () => {
    const aliyot = await request(app).get('/api/occasion-aliyot');
    const occasionAliyahId = aliyot.body[0].id;
    const res = await request(app).post('/api/readings/special')
      .send({ occasion_aliyah_id: occasionAliyahId, date_read: '2024-01-01', note: 'n', location: 'Shul' });
    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('number');
  });

  it('returns 400 when occasion_aliyah_id is missing', async () => {
    const res = await request(app).post('/api/readings/special').send({ date_read: '2024-01-01' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when date_read is missing', async () => {
    const aliyot = await request(app).get('/api/occasion-aliyot');
    const res = await request(app).post('/api/readings/special')
      .send({ occasion_aliyah_id: aliyot.body[0].id });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent occasion_aliyah_id', async () => {
    const res = await request(app).post('/api/readings/special')
      .send({ occasion_aliyah_id: 999999, date_read: '2024-01-01' });
    expect(res.status).toBe(404);
  });

  it('returns 409 for a duplicate (same occasion aliyah + date)', async () => {
    const aliyot = await request(app).get('/api/occasion-aliyot');
    const occasionAliyahId = aliyot.body[0].id;
    await request(app).post('/api/readings/special')
      .send({ occasion_aliyah_id: occasionAliyahId, date_read: '2024-01-01' });
    const res = await request(app).post('/api/readings/special')
      .send({ occasion_aliyah_id: occasionAliyahId, date_read: '2024-01-01' });
    expect(res.status).toBe(409);
  });
});

describe('DELETE /api/readings/special/:id', () => {
  it('returns 204 and removes the special reading', async () => {
    const aliyot = await request(app).get('/api/occasion-aliyot');
    const post = await request(app).post('/api/readings/special')
      .send({ occasion_aliyah_id: aliyot.body[0].id, date_read: '2024-01-01' });
    const del = await request(app).delete(`/api/readings/special/${post.body.id}`);
    expect(del.status).toBe(204);
    const res = await request(app).get('/api/readings/special');
    expect(res.body.find(r => r.id === post.body.id)).toBeUndefined();
  });

  it('returns 404 for a non-existent special reading', async () => {
    const res = await request(app).delete('/api/readings/special/999999');
    expect(res.status).toBe(404);
  });
});

// ── weekday readings ───────────────────────────────────────────────────────────

describe('GET /api/weekday-aliyot', () => {
  it('returns weekday aliyot with the expected shape', async () => {
    const res = await request(app).get('/api/weekday-aliyot');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const first = res.body[0];
    expect(first).toHaveProperty('id');
    expect(first).toHaveProperty('parsha_id');
    expect(first).toHaveProperty('aliyah_num');
    expect(first).toHaveProperty('all_dates');
  });
});

describe('POST /api/readings/weekday', () => {
  it('returns 201 and an id on success', async () => {
    const aliyot = await request(app).get('/api/weekday-aliyot');
    const weekdayAliyahId = aliyot.body[0].id;
    const res = await request(app).post('/api/readings/weekday')
      .send({ weekday_aliyah_id: weekdayAliyahId, date_read: '2024-01-01' });
    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('number');
  });

  it('returns 400 when weekday_aliyah_id is missing', async () => {
    const res = await request(app).post('/api/readings/weekday').send({ date_read: '2024-01-01' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent weekday_aliyah_id', async () => {
    const res = await request(app).post('/api/readings/weekday')
      .send({ weekday_aliyah_id: 999999, date_read: '2024-01-01' });
    expect(res.status).toBe(404);
  });

  it('returns 409 for a duplicate (weekday_aliyah_id is unique)', async () => {
    const aliyot = await request(app).get('/api/weekday-aliyot');
    const weekdayAliyahId = aliyot.body[0].id;
    await request(app).post('/api/readings/weekday')
      .send({ weekday_aliyah_id: weekdayAliyahId, date_read: '2024-01-01' });
    const res = await request(app).post('/api/readings/weekday')
      .send({ weekday_aliyah_id: weekdayAliyahId, date_read: '2024-02-01' });
    expect(res.status).toBe(409);
  });
});

describe('PUT /api/readings/weekday/:id', () => {
  it('updates date_read, note, and location', async () => {
    const aliyot = await request(app).get('/api/weekday-aliyot');
    const post = await request(app).post('/api/readings/weekday')
      .send({ weekday_aliyah_id: aliyot.body[0].id, date_read: '2024-01-01' });

    const res = await request(app).put(`/api/readings/weekday/${post.body.id}`)
      .send({ date_read: '2024-02-01', note: 'n', location: 'Shul' });
    expect(res.status).toBe(200);

    const after = await request(app).get('/api/weekday-aliyot');
    const row = after.body.find(r => r.id === aliyot.body[0].id);
    expect(row.all_dates).toContain('2024-02-01');
    expect(row.location).toBe('Shul');
  });

  it('returns 400 when date_read is missing', async () => {
    const aliyot = await request(app).get('/api/weekday-aliyot');
    const post = await request(app).post('/api/readings/weekday')
      .send({ weekday_aliyah_id: aliyot.body[0].id, date_read: '2024-01-01' });
    const res = await request(app).put(`/api/readings/weekday/${post.body.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent weekday reading', async () => {
    const res = await request(app).put('/api/readings/weekday/999999').send({ date_read: '2024-01-01' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/readings/weekday/:id', () => {
  it('returns 204 and removes the weekday reading', async () => {
    const aliyot = await request(app).get('/api/weekday-aliyot');
    const post = await request(app).post('/api/readings/weekday')
      .send({ weekday_aliyah_id: aliyot.body[0].id, date_read: '2024-01-01' });
    const del = await request(app).delete(`/api/readings/weekday/${post.body.id}`);
    expect(del.status).toBe(204);
  });

  it('returns 404 for a non-existent weekday reading', async () => {
    const res = await request(app).delete('/api/readings/weekday/999999');
    expect(res.status).toBe(404);
  });
});

// ── hosafot readings ──────────────────────────────────────────────────────────

const HOSAFAH_BODY = {
  sefer: 'בְּרֵאשִׁית', chapter_start: 1, verse_start: 1, chapter_end: 1, verse_end: 5,
  pseukim: 5, date_read: '2024-01-01',
};

describe('GET /api/readings/hosafot', () => {
  it('returns an empty array when none recorded', async () => {
    const res = await request(app).get('/api/readings/hosafot');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('reflects a posted hosafah reading', async () => {
    await request(app).post('/api/readings/hosafot').send(HOSAFAH_BODY);
    const res = await request(app).get('/api/readings/hosafot');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].sefer).toBe(HOSAFAH_BODY.sefer);
  });
});

describe('POST /api/readings/hosafot', () => {
  it('returns 201 and an id on success', async () => {
    const res = await request(app).post('/api/readings/hosafot').send(HOSAFAH_BODY);
    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('number');
  });

  it('returns 400 when a required field is missing', async () => {
    const { pseukim, ...rest } = HOSAFAH_BODY;
    const res = await request(app).post('/api/readings/hosafot').send(rest);
    expect(res.status).toBe(400);
  });

  it('coerces is_double_parsha to 1/0', async () => {
    const post = await request(app).post('/api/readings/hosafot')
      .send({ ...HOSAFAH_BODY, is_double_parsha: true });
    const res = await request(app).get('/api/readings/hosafot');
    const row = res.body.find(r => r.id === post.body.id);
    expect(row.is_double_parsha).toBe(1);
  });
});

describe('PUT /api/readings/hosafot/:id', () => {
  it('updates date_read, note, and location', async () => {
    const post = await request(app).post('/api/readings/hosafot').send(HOSAFAH_BODY);
    const res = await request(app).put(`/api/readings/hosafot/${post.body.id}`)
      .send({ date_read: '2024-03-01', note: 'n', location: 'Shul' });
    expect(res.status).toBe(200);

    const after = await request(app).get('/api/readings/hosafot');
    const row = after.body.find(r => r.id === post.body.id);
    expect(row.date_read).toBe('2024-03-01');
    expect(row.location).toBe('Shul');
  });

  it('returns 400 when date_read is missing', async () => {
    const post = await request(app).post('/api/readings/hosafot').send(HOSAFAH_BODY);
    const res = await request(app).put(`/api/readings/hosafot/${post.body.id}`).send({});
    expect(res.status).toBe(400);
  });

  it('returns 404 for a non-existent hosafah reading', async () => {
    const res = await request(app).put('/api/readings/hosafot/999999').send({ date_read: '2024-01-01' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/readings/hosafot/:id', () => {
  it('returns 204 and removes the hosafah reading', async () => {
    const post = await request(app).post('/api/readings/hosafot').send(HOSAFAH_BODY);
    const del = await request(app).delete(`/api/readings/hosafot/${post.body.id}`);
    expect(del.status).toBe(204);
    const res = await request(app).get('/api/readings/hosafot');
    expect(res.body).toEqual([]);
  });

  it('returns 404 for a non-existent hosafah reading', async () => {
    const res = await request(app).delete('/api/readings/hosafot/999999');
    expect(res.status).toBe(404);
  });
});

// ── calendar feed ─────────────────────────────────────────────────────────────

describe('GET /api/calendar.ics', () => {
  it('returns an ICS feed with the expected headers and content', async () => {
    const res = await request(app).get('/api/calendar.ics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.headers['content-disposition']).toContain('torah-readings.ics');
    expect(res.text).toContain('BEGIN:VCALENDAR');
    expect(res.text).toContain('END:VCALENDAR');
  });
});
