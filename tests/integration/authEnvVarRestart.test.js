// @vitest-environment node
/**
 * Regression test: TORAH_ADMIN_PASSWORD must only seed the stored hash on the very
 * first start (no stored hash yet). Once a hash exists — whether from a prior env-var
 * start or from changing the password in Settings — a later restart with a *different*
 * TORAH_ADMIN_PASSWORD must not silently overwrite it. Own DB/process env and fresh
 * server.ts import per phase — see auth.test.js for why.
 */

import { afterAll, describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import request from 'supertest';

const TEMP_DB = path.join(os.tmpdir(), `torah-auth-envvar-restart-test-${process.pid}.db`);

process.env.TORAH_DB_PATH = TEMP_DB;
process.env.SERVICE_MODE  = 'prod'; // skip loading the real .env file's dev TORAH_ADMIN_PASSWORD

afterAll(() => {
  try { fs.unlinkSync(TEMP_DB); } catch {}
});

describe('TORAH_ADMIN_PASSWORD across restarts', () => {
  it('hashes it into the DB on first start', async () => {
    process.env.TORAH_ADMIN_PASSWORD = 'original-password';
    const { app, rawDb } = await import('../../server.ts');
    const res = await request(app).post('/api/auth/login').send({ password: 'original-password' });
    expect(res.status).toBe(200);
    rawDb.close();
  });

  it('does not overwrite the stored hash on a later start with a different value', async () => {
    vi.resetModules();
    process.env.TORAH_ADMIN_PASSWORD = 'different-password';
    const { app, rawDb } = await import('../../server.ts');

    const originalStillWorks = await request(app).post('/api/auth/login').send({ password: 'original-password' });
    expect(originalStillWorks.status).toBe(200);

    const differentIsRejected = await request(app).post('/api/auth/login').send({ password: 'different-password' });
    expect(differentIsRejected.status).toBe(401);

    const canWrite = await request(app).get('/api/can-write');
    expect(canWrite.body).toEqual({ canWrite: false, authMode: 'password', insecureConfig: true });

    rawDb.close();
  });
});
