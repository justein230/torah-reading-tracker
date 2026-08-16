// @vitest-environment node
/**
 * Covers the one-time bootstrap password: when password mode is active and no
 * TORAH_ADMIN_PASSWORD is set and no password has ever been configured, the app
 * generates one, stores its hash, and prints the plaintext to the logs once.
 * Own DB/process env and fresh server.ts import — see auth.test.js for why.
 */

import { afterAll, describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import request from 'supertest';

const TEMP_DB = path.join(os.tmpdir(), `torah-auth-bootstrap-test-${process.pid}.db`);

process.env.TORAH_DB_PATH = TEMP_DB;
delete process.env.TORAH_ADMIN_PASSWORD;
// Skip loading the real .env file — it has a dev TORAH_ADMIN_PASSWORD set, which
// would defeat the point of this test (dotenv doesn't overwrite an already-set
// var, but it would repopulate one we just deleted).
process.env.SERVICE_MODE = 'prod';

const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const { app } = await import('../../server.ts');
// Read the calls before mockRestore() — restoring also clears the recorded call history.
const printed = logSpy.mock.calls.map(call => call.join(' ')).join('\n');
logSpy.mockRestore();

const bootstrapPassword = printed.match(/^ {4}(\S+)$/m)?.[1];

afterAll(() => {
  try { fs.unlinkSync(TEMP_DB); } catch {}
});

describe('bootstrap admin password', () => {
  it('prints a bootstrap password to the logs on first start', () => {
    expect(bootstrapPassword).toBeTruthy();
    expect(bootstrapPassword.length).toBeGreaterThanOrEqual(20);
  });

  it('reports insecureConfig: false (no plaintext env var to warn about)', async () => {
    const res = await request(app).get('/api/can-write');
    expect(res.body).toEqual({ canWrite: false, authMode: 'password', insecureConfig: false });
  });

  it('logs in successfully with the printed bootstrap password', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: bootstrapPassword });
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeTruthy();
  });
});
