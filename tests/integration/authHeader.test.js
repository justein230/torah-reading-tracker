// @vitest-environment node
/**
 * Covers header-mode trust. Own DB/process env, since AUTH_MODE is read once at
 * server.ts import time (see hebcalRoute.test.js for why each of these files gets
 * its own fresh import).
 */

import { afterAll, describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import request from 'supertest';

const TEMP_DB = path.join(os.tmpdir(), `torah-auth-header-test-${process.pid}.db`);

process.env.TORAH_DB_PATH         = TEMP_DB;
process.env.TORAH_REQUIRE_PROXY_HEADER = 'true';
process.env.TORAH_AUTH_MODE       = 'header';
process.env.TORAH_AUTH_HEADER     = 'x-test-user';

const { app, rawDb: db } = await import('../../server.ts');

afterAll(() => {
  try { fs.unlinkSync(TEMP_DB); } catch {}
});

describe('GET /api/can-write — header mode', () => {
  it('reports canWrite: false with no header set', async () => {
    const res = await request(app).get('/api/can-write');
    expect(res.body).toEqual({ canWrite: false, authMode: 'header', insecureConfig: false });
  });

  it('reports canWrite: true when the configured header is present', async () => {
    const res = await request(app).get('/api/can-write').set('x-test-user', 'justin');
    expect(res.body.canWrite).toBe(true);
  });
});

describe('writes in header mode', () => {
  it('are forbidden without the header', async () => {
    const res = await request(app).post('/api/readings')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    expect(res.status).toBe(403);
  });

  it('succeed with the header present', async () => {
    const res = await request(app).post('/api/readings').set('x-test-user', 'justin')
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    expect(res.status).toBe(201);
    db.prepare('DELETE FROM readings').run();
  });

  it('POST /api/auth/login is not available in header mode', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'anything' });
    expect(res.status).toBe(404);
  });

  it('POST /api/auth/change-password is not available in header mode', async () => {
    const res = await request(app).post('/api/auth/change-password').set('x-test-user', 'justin')
      .send({ currentPassword: 'anything', newPassword: 'anything-else-long' });
    expect(res.status).toBe(404);
  });
});
