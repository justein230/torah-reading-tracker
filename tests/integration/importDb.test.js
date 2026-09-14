// @vitest-environment node
import { afterAll, describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import Database from 'better-sqlite3';
import request from 'supertest';

const TEMP_DB = path.join(os.tmpdir(), `torah-import-route-test-${process.pid}.db`);
const TEST_PASSWORD = 'correct horse battery staple';

process.env.TORAH_DB_PATH        = TEMP_DB;
process.env.TORAH_ADMIN_PASSWORD = TEST_PASSWORD;

const { app } = await import('../../server.ts');

afterAll(() => {
  try { fs.unlinkSync(TEMP_DB); } catch {}
  try { fs.rmSync(path.join(path.dirname(TEMP_DB), 'backups'), { recursive: true, force: true }); } catch {}
});

// Builds an importable buffer from a copy of the live db plus one extra reading — reuses
// the app's own already-migrated schema instead of hand-rolling a second one for this test.
function addReadingToBuffer(exportedBuffer) {
  const tempPath = path.join(os.tmpdir(), `torah-import-candidate-${process.pid}-${Date.now()}.db`);
  fs.writeFileSync(tempPath, exportedBuffer);
  const candidateDb = new Database(tempPath);
  const aliyah = candidateDb.prepare('SELECT id FROM aliyot LIMIT 1').get();
  candidateDb.prepare("INSERT INTO readings (aliyah_id, date_read, reading_type) VALUES (?, '2020-01-01', 'standard')").run(aliyah.id);
  candidateDb.close();
  const buf = fs.readFileSync(tempPath);
  fs.unlinkSync(tempPath);
  return buf;
}

describe('POST /api/import/db', () => {
  it('returns 403 without a session', async () => {
    const res = await request(app)
      .post('/api/import/db')
      .type('application/vnd.sqlite3')
      .send(Buffer.from('anything'));
    expect(res.status).toBe(403);
  });

  it('rejects an invalid upload and leaves existing data intact', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ password: TEST_PASSWORD });

    const before = await agent.get('/api/readings');

    const res = await agent
      .post('/api/import/db')
      .type('application/vnd.sqlite3')
      .send(Buffer.from('not a database'));
    expect(res.status).toBe(400);

    const after = await agent.get('/api/readings');
    expect(after.body).toEqual(before.body);
  });

  it('replaces reading data on a valid upload, and keeps the current session working', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ password: TEST_PASSWORD });

    const exported = fs.readFileSync(TEMP_DB);
    const uploadBuffer = addReadingToBuffer(exported);

    const res = await agent
      .post('/api/import/db')
      .type('application/vnd.sqlite3')
      .send(uploadBuffer);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });

    const readings = await agent.get('/api/readings');
    expect(readings.body).toHaveLength(1);
    expect(readings.body[0].date_read).toBe('2020-01-01');

    // Preserved session — the same login should still be recognized without re-authenticating.
    const canWrite = await agent.get('/api/can-write');
    expect(canWrite.body.canWrite).toBe(true);
  });
});
