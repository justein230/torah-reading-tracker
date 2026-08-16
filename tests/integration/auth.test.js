// @vitest-environment node
/**
 * Covers password-mode login/logout. header mode is covered separately in
 * authHeader.test.js, since it needs its own fresh server.ts import — AUTH_MODE
 * etc. are all read once at import time (see hebcalRoute.test.js for why each of
 * these files gets its own DB/process env).
 */

import { afterEach, afterAll, describe, it, expect } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import request from 'supertest';

const TEMP_DB = path.join(os.tmpdir(), `torah-auth-test-${process.pid}.db`);

process.env.TORAH_DB_PATH         = TEMP_DB;
process.env.TORAH_REQUIRE_PROXY_HEADER = 'true';
process.env.TORAH_ADMIN_PASSWORD  = 'correct horse battery staple';
process.env.TORAH_AUTH_HEADER     = 'x-test-user';

const { app, rawDb: db } = await import('../../server.ts');

afterEach(() => {
  db.prepare('DELETE FROM auth_sessions').run();
});

afterAll(() => {
  try { fs.unlinkSync(TEMP_DB); } catch {}
});

function sessionCookie(res) {
  const setCookie = res.headers['set-cookie'];
  return setCookie?.[0]?.split(';')[0];
}

describe('GET /api/can-write — password mode', () => {
  it('reports canWrite: false, authMode: password, insecureConfig: true (TORAH_ADMIN_PASSWORD still set)', async () => {
    const res = await request(app).get('/api/can-write');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ canWrite: false, authMode: 'password', insecureConfig: true });
  });
});

describe('POST /api/auth/login', () => {
  it('rejects an incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('accepts the password hashed from TORAH_ADMIN_PASSWORD at startup and sets a session cookie', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'correct horse battery staple' });
    expect(res.status).toBe(200);
    expect(sessionCookie(res)).toBeTruthy();
  });

  it('the resulting session grants canWrite and passes privateOnly', async () => {
    const login = await request(app).post('/api/auth/login').send({ password: 'correct horse battery staple' });
    const cookie = sessionCookie(login);

    const canWrite = await request(app).get('/api/can-write').set('Cookie', cookie);
    expect(canWrite.body.canWrite).toBe(true);

    const post = await request(app).post('/api/readings').set('Cookie', cookie)
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    expect(post.status).toBe(201);
  });
});

describe('POST /api/auth/logout', () => {
  it('invalidates the session so a subsequent write is forbidden again', async () => {
    const login = await request(app).post('/api/auth/login').send({ password: 'correct horse battery staple' });
    const cookie = sessionCookie(login);

    await request(app).post('/api/auth/logout').set('Cookie', cookie);

    const canWrite = await request(app).get('/api/can-write').set('Cookie', cookie);
    expect(canWrite.body.canWrite).toBe(false);

    const post = await request(app).post('/api/readings').set('Cookie', cookie)
      .send({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    expect(post.status).toBe(403);
  });
});

// change-password has its own rate limiter (see server.ts), separate from login's —
// but login itself is still shared and capped across this whole file, so these tests
// are written to spend as few /api/auth/login calls as possible.
describe('POST /api/auth/change-password', () => {
  it('requires a valid session', async () => {
    const res = await request(app).post('/api/auth/change-password')
      .send({ currentPassword: 'correct horse battery staple', newPassword: 'a new long password' });
    expect(res.status).toBe(403);
  });

  it('rejects an incorrect current password, then a too-short new password', async () => {
    const login = await request(app).post('/api/auth/login').send({ password: 'correct horse battery staple' });
    const cookie = sessionCookie(login);

    const badCurrent = await request(app).post('/api/auth/change-password').set('Cookie', cookie)
      .send({ currentPassword: 'wrong', newPassword: 'a new long password' });
    expect(badCurrent.status).toBe(401);

    const badNew = await request(app).post('/api/auth/change-password').set('Cookie', cookie)
      .send({ currentPassword: 'correct horse battery staple', newPassword: 'short' });
    expect(badNew.status).toBe(400);
  });

  it('changes the password: the current session stays valid and the new password can log in', async () => {
    const login = await request(app).post('/api/auth/login').send({ password: 'correct horse battery staple' });
    const cookie = sessionCookie(login);

    const change = await request(app).post('/api/auth/change-password').set('Cookie', cookie)
      .send({ currentPassword: 'correct horse battery staple', newPassword: 'a new long password' });
    expect(change.status).toBe(200);

    const canWrite = await request(app).get('/api/can-write').set('Cookie', cookie);
    expect(canWrite.body.canWrite).toBe(true);

    const newLogin = await request(app).post('/api/auth/login').send({ password: 'a new long password' });
    expect(newLogin.status).toBe(200);

    // Reset back to the fixture password so later tests in this file are unaffected.
    await request(app).post('/api/auth/change-password').set('Cookie', sessionCookie(newLogin))
      .send({ currentPassword: 'a new long password', newPassword: 'correct horse battery staple' });
  });

  it('invalidates other sessions but not the one that made the change', async () => {
    const loginA = await request(app).post('/api/auth/login').send({ password: 'correct horse battery staple' });
    const cookieA = sessionCookie(loginA);
    const loginB = await request(app).post('/api/auth/login').send({ password: 'correct horse battery staple' });
    const cookieB = sessionCookie(loginB);

    await request(app).post('/api/auth/change-password').set('Cookie', cookieA)
      .send({ currentPassword: 'correct horse battery staple', newPassword: 'a new long password' });

    const canWriteA = await request(app).get('/api/can-write').set('Cookie', cookieA);
    expect(canWriteA.body.canWrite).toBe(true);

    const canWriteB = await request(app).get('/api/can-write').set('Cookie', cookieB);
    expect(canWriteB.body.canWrite).toBe(false);

    // Reset back to the fixture password for later tests.
    await request(app).post('/api/auth/change-password').set('Cookie', cookieA)
      .send({ currentPassword: 'a new long password', newPassword: 'correct horse battery staple' });
  });
});
