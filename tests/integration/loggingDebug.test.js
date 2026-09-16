// @vitest-environment node
/**
 * Covers TORAH_LOG_LEVEL=debug's request-body capture. Own file (own DB), same reason as
 * hebcalRoute.test.js: TORAH_LOG_LEVEL is read once at module-eval time in
 * createLogger(), so a later test file importing an already-cached server.ts module
 * wouldn't pick up a different value.
 */

import { afterAll, describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import request from 'supertest';
import { logFilePath } from '../../src/utils/logger-server.ts';

const TEMP_DB = path.join(os.tmpdir(), `torah-logging-debug-test-${process.pid}.db`);

process.env.TORAH_DB_PATH  = TEMP_DB;
process.env.TORAH_LOG_LEVEL = 'debug';

const { app } = await import('../../server.ts');

afterAll(() => {
  delete process.env.TORAH_LOG_LEVEL;
  try { fs.unlinkSync(TEMP_DB); } catch {}
});

describe('TORAH_LOG_LEVEL=debug', () => {
  it('captures the (redacted) request body on a mutation', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'wrong-password' });
    expect(res.status).toBe(401);

    const logged = fs.readFileSync(logFilePath(TEMP_DB), 'utf8');
    const lines = logged.trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
    const entry = lines.find(l => l.req?.url === '/api/auth/login');
    expect(entry).toBeDefined();
    expect(entry.body).toEqual({ password: '[redacted]' });
  });
});
