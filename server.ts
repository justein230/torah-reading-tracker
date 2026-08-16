import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { and, eq, ne, sql } from 'drizzle-orm';
import { createDb } from './src/db/drizzle-server.js';
import { initDb } from './src/db/init.js';
import { sefarim, parshiot, parshaPairs, aliyot, readings, occasionAliyot, specialReadings, weekdayAliyot, weekdayReadings, hosafotReadings, torahChapters, adminPassword, authSessions } from './src/db/schema.js';
import { ALIYOT_SQL, READINGS_SQL, LOCATION_STATS_SQL, OCCASIONS_SQL, OCCASION_ALIYOT_SQL, SPECIAL_READINGS_SQL, WEEKDAY_ALIYOT_SQL, HOSAFOT_READINGS_SQL } from './src/db/queries.js';
import { buildSchedule, fetchLiveHebcalItems } from './src/utils/sedra.js';
import { SEDRA_CACHE, SEDRA_YEARS } from './src/data/sedraCache.js';
import { hashPassword, verifyPassword, generateSessionToken, hashSessionToken, parseSessionCookie, serializeSessionCookie, clearSessionCookie, isHeaderAuthenticated, generateBootstrapPassword } from './src/utils/auth.js';
import { buildExportBuffer } from './src/utils/export-server.js';
import { buildCalendarFeed } from './src/utils/calendar-feed.js';
import { errText } from './src/utils/errText.js';

if (process.env.SERVICE_MODE !== 'prod') {
  const dotenv = await import('dotenv');
  dotenv.default.config();
}

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
// When compiled to dist-server/, resolve project-level assets from the parent directory
const PROJECT_ROOT = path.basename(__dirname) === 'dist-server' ? path.dirname(__dirname) : __dirname;

const PORT    = process.env.PORT || 3000;
const HOST    = process.env.TORAH_HOST || '127.0.0.1';
const DB_PATH = process.env.TORAH_DB_PATH || path.join(PROJECT_ROOT, 'torah.db');

// ── database ──────────────────────────────────────────────────────────────────

export const rawDb = new Database(DB_PATH);
rawDb.pragma('journal_mode = DELETE');
rawDb.pragma('foreign_keys = OFF'); // must be off during migrations (table recreations need it)
export const db = createDb(rawDb);
initDb(rawDb, db, path.join(PROJECT_ROOT, 'drizzle'));
rawDb.pragma('foreign_keys = ON');

// ── express app ───────────────────────────────────────────────────────────────

export const app = express();
app.use(express.json());
app.use(express.static(path.join(PROJECT_ROOT, 'dist')));
app.disable('x-powered-by');

// ── write guard ───────────────────────────────────────────────────────────────

// Same NODE_ENV-based default as before, overridable via TORAH_REQUIRE_PROXY_HEADER.
const REQUIRE_PROXY_HEADER = process.env.TORAH_REQUIRE_PROXY_HEADER
  ? process.env.TORAH_REQUIRE_PROXY_HEADER === 'true'
  : process.env.NODE_ENV === 'production';

// ── auth ──────────────────────────────────────────────────────────────────────
// Two mutually exclusive modes, picked via TORAH_AUTH_MODE:
//  'password' (default) — the app's own login, for deployments with no auth in front.
//  'header'              — trust a header an upstream reverse proxy sets after doing
//                           its own auth (e.g. Traefik/Caddy basicAuth). Only trusted
//                           when TORAH_REQUIRE_PROXY_HEADER is also on — see
//                           isHeaderAuthenticated for why.
//                           Any IP-based restriction (e.g. LAN-only access) is the
//                           reverse proxy's job now, not the app's.

const AUTH_MODE   = process.env.TORAH_AUTH_MODE === 'header' ? 'header' : 'password';
const AUTH_HEADER = (process.env.TORAH_AUTH_HEADER || 'x-forwarded-user').toLowerCase();
const COOKIE_SECURE = process.env.NODE_ENV === 'production';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getStoredPasswordHash(): string | null {
  return db.select({ passwordHash: adminPassword.passwordHash }).from(adminPassword).where(eq(adminPassword.id, 1)).get()?.passwordHash ?? null;
}

// If TORAH_ADMIN_PASSWORD (plaintext) is set, hash it and persist the hash to
// admin_password so the plaintext doesn't need to stay set across restarts. Doing
// this at startup — rather than shipping a separate hashing script — means setting
// up a password never requires anything beyond the app's own normal startup.
//
// If it's *not* set and no password has ever been configured (no stored hash yet),
// generate a random one-time bootstrap password, store its hash, and print the
// plaintext to the logs once — the Rancher/NetBox pattern. Every later restart
// finds a stored hash already, so this only ever fires on first run.
let INSECURE_CONFIG = false;
if (AUTH_MODE === 'password' && process.env.TORAH_ADMIN_PASSWORD) {
  const passwordHash = hashPassword(process.env.TORAH_ADMIN_PASSWORD);
  db.insert(adminPassword)
    .values({ id: 1, passwordHash })
    .onConflictDoUpdate({ target: adminPassword.id, set: { passwordHash, updatedAt: sql`(datetime('now'))` } })
    .run();
  // A hash now exists in the DB, and the plaintext env var that produced it is still
  // set — that's the "forgot to unset it" case the insecureConfig banner warns about.
  INSECURE_CONFIG = true;
} else if (AUTH_MODE === 'password' && !getStoredPasswordHash()) {
  const bootstrapPassword = generateBootstrapPassword();
  db.insert(adminPassword).values({ id: 1, passwordHash: hashPassword(bootstrapPassword) }).run();
  console.log([
    '',
    '='.repeat(72),
    'No admin password configured — generated a one-time bootstrap password:',
    '',
    `    ${bootstrapPassword}`,
    '',
    'Log in with it and change it from Settings, or set TORAH_ADMIN_PASSWORD',
    'and restart to use your own password instead.',
    '='.repeat(72),
    '',
  ].join('\n'));
}

function hasValidSession(req: express.Request): boolean {
  const token = parseSessionCookie(req.headers.cookie);
  if (!token) return false;
  const row = db.select({ id: authSessions.id })
    .from(authSessions)
    .where(and(eq(authSessions.tokenHash, hashSessionToken(token)), sql`${authSessions.expiresAt} > datetime('now')`))
    .get();
  return !!row;
}

function isAuthenticated(req: express.Request): boolean {
  return AUTH_MODE === 'header'
    ? isHeaderAuthenticated(req.headers[AUTH_HEADER], REQUIRE_PROXY_HEADER)
    : hasValidSession(req);
}

function canWriteFor(req: express.Request): boolean {
  return isAuthenticated(req);
}

function privateOnly(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (canWriteFor(req)) return next();
  res.status(403).json({ detail: 'Forbidden' });
}

// Every mutation under /api/readings/* (regular, special, weekday, hosafot) requires
// privateOnly. GETs pass through unguarded. This is a prefix guard rather than an
// enumerated route list, so new sub-resources under /api/readings are covered automatically.
app.use('/api/readings', (req, res, next) => {
  if (req.method === 'GET') return next();
  privateOnly(req, res, next);
});

// Generous cap on writes — protects against a buggy client or compromised LAN
// device hammering the DB, not meant to constrain normal manual use.
const writeLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false });
app.use('/api/readings', (req, res, next) => {
  if (req.method === 'GET') return next();
  writeLimiter(req, res, next);
});

// Tight cap on login attempts — this is the brute-force defense for password mode,
// since a long random password plus a slow request budget makes guessing infeasible.
// change-password gets its own instance of the same cap rather than sharing this one,
// so guessing at the login page and mistyping a current password don't drain the same
// budget and lock each other out.
const loginLimiter          = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });
const changePasswordLimiter = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

app.post('/api/auth/login', loginLimiter, (req, res) => {
  if (AUTH_MODE !== 'password') return res.status(404).json({ detail: 'Not found' });
  const storedHash = getStoredPasswordHash();
  const { password } = req.body;
  if (!storedHash || typeof password !== 'string' || !verifyPassword(password, storedHash)) {
    return res.status(401).json({ detail: 'Incorrect password' });
  }
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
  db.insert(authSessions).values({ tokenHash: hashSessionToken(token), expiresAt }).run();
  res.setHeader('Set-Cookie', serializeSessionCookie(token, SESSION_MAX_AGE_SECONDS, COOKIE_SECURE));
  res.json({ success: true });
});

app.post('/api/auth/logout', (req, res) => {
  const token = parseSessionCookie(req.headers.cookie);
  if (token) db.delete(authSessions).where(eq(authSessions.tokenHash, hashSessionToken(token))).run();
  res.setHeader('Set-Cookie', clearSessionCookie(COOKIE_SECURE));
  res.json({ success: true });
});

// Requires the current password (defense in depth beyond just having a valid session —
// e.g. a left-open browser tab shouldn't be enough on its own) and rate-limits like
// login, since it's also a password-guessing surface. On success, every *other* session
// is invalidated (a changed password should kick out anyone else logged in) but the
// caller's own session stays valid so they aren't logged out by changing their password.
app.post('/api/auth/change-password', changePasswordLimiter, privateOnly, (req, res) => {
  if (AUTH_MODE !== 'password') return res.status(404).json({ detail: 'Not found' });
  const { currentPassword, newPassword } = req.body;
  const storedHash = getStoredPasswordHash();
  if (!storedHash || typeof currentPassword !== 'string' || !verifyPassword(currentPassword, storedHash)) {
    return res.status(401).json({ detail: 'Incorrect current password' });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return res.status(400).json({ detail: 'New password must be at least 8 characters' });
  }
  db.update(adminPassword)
    .set({ passwordHash: hashPassword(newPassword), updatedAt: sql`(datetime('now'))` })
    .where(eq(adminPassword.id, 1))
    .run();
  const currentToken = parseSessionCookie(req.headers.cookie);
  const currentTokenHash = currentToken ? hashSessionToken(currentToken) : null;
  if (currentTokenHash) db.delete(authSessions).where(ne(authSessions.tokenHash, currentTokenHash)).run();
  else db.delete(authSessions).run();
  res.json({ success: true });
});

// ── parsha schedule ─────────────────────────────────────────────────────────────
// The upcoming-parsha dates come from a baked cache (src/data/sedraCache.ts, generated
// from the Hebcal.com REST API — CC BY 4.0). The cache runs through SEDRA_YEARS[1], so
// a live call is only needed once "today" is within a year of that end.

let _schedule: Record<string, string> | null = null;

async function getSchedule(): Promise<Record<string, string>> {
  if (_schedule) return _schedule;

  _schedule = await buildSchedule({
    parshaNames: new Set(
      db.select({ name_en: parshiot.nameEn }).from(parshiot).all().map(r => r.name_en)
    ),
    today:        new Date().toISOString().slice(0, 10),
    cache:        SEDRA_CACHE,
    cacheEndYear: SEDRA_YEARS[1],
    fetchLive:    fetchLiveHebcalItems,
  });
  return _schedule;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function parseId(req: express.Request): number {
  return Number.parseInt(String(req.params['id']), 10);
}

// Strips control characters from user-supplied free text (occasion/location/note)
// before it's stored and later echoed into the public ICS calendar feed.
function cleanText(s: string): string {
  return s.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

function requireFields(res: express.Response, body: Record<string, unknown>, fields: string[]): boolean {
  const missing = fields.filter(f => !body[f]);
  if (!missing.length) return true;
  res.status(400).json({ detail: `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required` });
  return false;
}

// Coerces the given fields to positive integers, 400ing if any are missing or non-numeric.
// Prevents non-numeric input from reaching the chapter/verse columns that drive the
// chapter*1000+verse overlap arithmetic in queries.ts and compute.ts.
function requireInts<F extends string>(res: express.Response, body: Record<string, unknown>, fields: F[]): Record<F, number> | null {
  const out = {} as Record<F, number>;
  for (const f of fields) {
    const n = Number.parseInt(String(body[f]), 10);
    if (!Number.isFinite(n) || n < 1) {
      res.status(400).json({ detail: `${f} must be a positive integer` });
      return null;
    }
    out[f] = n;
  }
  return out;
}

function existsOrNotFound(res: express.Response, query: { get(): unknown }, label: string): boolean {
  if (query.get()) return true;
  res.status(404).json({ detail: `${label} not found` });
  return false;
}

function isUniqueConstraint(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: unknown }).code === 'SQLITE_CONSTRAINT_UNIQUE';
}

function findAliyahId(parsha: string, aliyahNum: number): number | null {
  const row = db.select({ id: aliyot.id })
    .from(aliyot)
    .innerJoin(parshiot, eq(parshiot.id, aliyot.parshaId))
    .where(and(eq(parshiot.name, parsha), eq(aliyot.aliyah, aliyahNum)))
    .get();
  return row?.id ?? null;
}

// ── routes ────────────────────────────────────────────────────────────────────

app.get('/api/hebcal', async (_req, res) => {
  try {
    res.json({ schedule: await getSchedule() });
  } catch (err: unknown) {
    console.error('Hebcal error:', errText(err));
    res.json({ schedule: {} });
  }
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(PROJECT_ROOT, 'dist', 'index.html'));
});

app.get('/api/can-write', (req, res) => {
  res.json({
    canWrite: canWriteFor(req),
    authMode: AUTH_MODE,
    insecureConfig: INSECURE_CONFIG,
  });
});

app.get('/api/export/excel', privateOnly, async (_req, res) => {
  try {
    const rows = db.all(sql.raw(ALIYOT_SQL)) as Parameters<typeof buildExportBuffer>[0];
    const seferRows = db.select({ name: sefarim.name, name_en: sefarim.nameEn })
      .from(sefarim).orderBy(sefarim.sortOrder).all();
    const buf = await buildExportBuffer(rows, seferRows);
    const filename = `torah-readings-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (err: unknown) {
    console.error('Excel export error:', errText(err));
    res.status(500).json({ detail: 'Failed to generate export.' });
  }
});

app.get('/api/export/db', privateOnly, (_req, res) => {
  const data = fs.readFileSync(DB_PATH);
  res.setHeader('Content-Type', 'application/vnd.sqlite3');
  res.setHeader('Content-Disposition', 'attachment; filename="torah.db"');
  res.end(data);
});

app.get('/api/meta', (_req, res) => {
  const seferRows  = db.select({ id: sefarim.id, name: sefarim.name, name_en: sefarim.nameEn, color: sefarim.color }).from(sefarim).orderBy(sefarim.sortOrder).all();
  const parshaRows = db.select({ id: parshiot.id, name: parshiot.name, name_en: parshiot.nameEn }).from(parshiot).orderBy(parshiot.sortOrder).all();
  const pairRows   = db.select({ id: parshaPairs.id, name: parshaPairs.name, name_en: parshaPairs.nameEn, parsha1_id: parshaPairs.parsha1Id, parsha2_id: parshaPairs.parsha2Id }).from(parshaPairs).all();
  const chapterRows = db.select({ seferId: torahChapters.seferId, verseCount: torahChapters.verseCount }).from(torahChapters).orderBy(torahChapters.seferId, torahChapters.chapter).all();
  const cvMap: Record<number, number[]> = {};
  for (const r of chapterRows) {
    const arr = cvMap[r.seferId] ?? [];
    cvMap[r.seferId] = arr;
    arr.push(r.verseCount);
  }
  res.json({
    sefarim:  seferRows.map(s => ({ name: s.name, name_en: s.name_en, color: s.color, chapter_verses: cvMap[s.id] ?? [] })),
    parshiot: parshaRows,
    pairs:    pairRows,
  });
});

app.get('/api/aliyot', (_req, res) => {
  res.json(db.all(sql.raw(ALIYOT_SQL)));
});

app.get('/api/stats/location', (_req, res) => {
  res.json(db.all(sql.raw(LOCATION_STATS_SQL)));
});

app.get('/api/readings', (_req, res) => {
  res.json(db.all(sql.raw(READINGS_SQL)));
});

app.post('/api/readings', (req, res) => {
  const { parsha, aliyah, date_read, occasion = '', location = '', pair_id, reading_type: requested_type } = req.body;
  if (!requireFields(res, req.body, ['parsha', 'aliyah', 'date_read'])) return;
  const aliyahId = findAliyahId(parsha, aliyah);
  if (aliyahId == null) return res.status(404).json({ detail: 'Aliyah not found' });

  const existing = db.select({ id: readings.id })
    .from(readings)
    .where(and(
      eq(readings.aliyahId, aliyahId),
      sql`${readings.readingType} IN ('standard', 'double_parsha')`
    ))
    .get();
  let reading_type: string;
  if (existing) {
    reading_type = 'additional';
  } else {
    reading_type = requested_type === 'double_parsha' ? 'double_parsha' : 'standard';
  }

  let id: number;
  try {
    const result = db.insert(readings).values({
      aliyahId,
      dateRead: date_read,
      occasion: occasion ? cleanText(occasion) || null : null,
      location: location ? cleanText(location) || null : null,
      readingType: reading_type,
      pairId: pair_id ?? null,
    }).run();
    id = Number(result.lastInsertRowid);
  } catch (e: unknown) {
    if (isUniqueConstraint(e))
      return res.status(409).json({ detail: 'This aliyah was already recorded on that date.' });
    throw e;
  }

  res.status(201).json({ id, reading_type });
});

app.put('/api/readings/:id', (req, res) => {
  const id = parseId(req);
  if (!existsOrNotFound(res, db.select({ id: readings.id }).from(readings).where(eq(readings.id, id)), 'Reading')) return;

  const { occasion = '', location = '' } = req.body;
  db.update(readings)
    .set({ occasion: occasion ? cleanText(occasion) || null : null, location: location ? cleanText(location) || null : null })
    .where(eq(readings.id, id))
    .run();
  res.json({ id });
});

app.delete('/api/readings/:id', (req, res) => {
  const id = parseId(req);
  if (!existsOrNotFound(res, db.select({ id: readings.id }).from(readings).where(eq(readings.id, id)), 'Reading')) return;

  db.delete(readings).where(eq(readings.id, id)).run();
  res.status(204).send();
});

// ── occasions / special readings ──────────────────────────────────────────────

app.get('/api/occasions', (_req, res) => {
  const rows = db.all(sql.raw(OCCASIONS_SQL)) as Array<{ id: number; name: string; name_en: string; category: string; sort_order: number }>;
  res.json(rows.map(r => ({ id: r.id, name: r.name, nameEn: r.name_en, category: r.category, sortOrder: r.sort_order })));
});

app.get('/api/occasion-aliyot', (_req, res) => {
  res.json(db.all(sql.raw(OCCASION_ALIYOT_SQL)));
});

app.get('/api/readings/special', (_req, res) => {
  res.json(db.all(sql.raw(SPECIAL_READINGS_SQL)));
});

app.post('/api/readings/special', (req, res) => {
  const { occasion_aliyah_id, date_read, note = '', location: loc = '' } = req.body;
  if (!requireFields(res, req.body, ['occasion_aliyah_id', 'date_read'])) return;
  if (!existsOrNotFound(res, db.select({ id: occasionAliyot.id }).from(occasionAliyot).where(eq(occasionAliyot.id, occasion_aliyah_id)), 'Occasion aliyah')) return;

  let id: number;
  try {
    const result = db.insert(specialReadings).values({
      occasionAliyahId: occasion_aliyah_id,
      dateRead: date_read,
      note:     note ? cleanText(note) || null : null,
      location: loc  ? cleanText(loc)  || null : null,
    }).run();
    id = Number(result.lastInsertRowid);
  } catch (e: unknown) {
    if (isUniqueConstraint(e))
      return res.status(409).json({ detail: 'This occasion aliyah was already recorded on that date.' });
    throw e;
  }
  res.status(201).json({ id });
});

app.delete('/api/readings/special/:id', (req, res) => {
  const id = parseId(req);
  if (!existsOrNotFound(res, db.select({ id: specialReadings.id }).from(specialReadings).where(eq(specialReadings.id, id)), 'Special reading')) return;
  db.delete(specialReadings).where(eq(specialReadings.id, id)).run();
  res.status(204).send();
});

// ── weekday readings ──────────────────────────────────────────────────────────

app.get('/api/weekday-aliyot', (_req, res) => {
  res.json(db.all(sql.raw(WEEKDAY_ALIYOT_SQL)));
});

app.post('/api/readings/weekday', (req, res) => {
  const { weekday_aliyah_id, date_read, note = '', location: loc = '' } = req.body;
  if (!requireFields(res, req.body, ['weekday_aliyah_id', 'date_read'])) return;
  if (!existsOrNotFound(res, db.select({ id: weekdayAliyot.id }).from(weekdayAliyot).where(eq(weekdayAliyot.id, weekday_aliyah_id)), 'Weekday aliyah')) return;

  try {
    const [inserted] = db.insert(weekdayReadings).values({
      weekdayAliyahId: weekday_aliyah_id,
      dateRead:        date_read,
      note:            note  ? cleanText(note) || null : null,
      location:        loc   ? cleanText(loc)  || null : null,
    }).returning({ id: weekdayReadings.id }).all();
    if (!inserted) throw new Error('Insert returned no row');
    res.status(201).json({ id: inserted.id });
  } catch (e: unknown) {
    if (isUniqueConstraint(e)) return res.status(409).json({ detail: 'This weekday reading was already recorded.' });
    throw e;
  }
});

app.put('/api/readings/weekday/:id', (req, res) => {
  const id = parseId(req);
  const { date_read, note = '', location: loc = '' } = req.body;
  if (!requireFields(res, req.body, ['date_read'])) return;
  if (!existsOrNotFound(res, db.select({ id: weekdayReadings.id }).from(weekdayReadings).where(eq(weekdayReadings.id, id)), 'Weekday reading')) return;
  db.update(weekdayReadings).set({ dateRead: date_read, note: note ? cleanText(note) || null : null, location: loc ? cleanText(loc) || null : null })
    .where(eq(weekdayReadings.id, id)).run();
  res.json({ success: true });
});

app.delete('/api/readings/weekday/:id', (req, res) => {
  const id = parseId(req);
  if (!existsOrNotFound(res, db.select({ id: weekdayReadings.id }).from(weekdayReadings).where(eq(weekdayReadings.id, id)), 'Weekday reading')) return;
  db.delete(weekdayReadings).where(eq(weekdayReadings.id, id)).run();
  res.status(204).send();
});

// ── hosafot readings ──────────────────────────────────────────────────────────

app.get('/api/readings/hosafot', (_req, res) => {
  res.json(db.all(sql.raw(HOSAFOT_READINGS_SQL)));
});

app.post('/api/readings/hosafot', (req, res) => {
  if (!requireFields(res, req.body, ['sefer', 'chapter_start', 'verse_start', 'chapter_end', 'verse_end', 'pseukim', 'date_read'])) return;
  const ints = requireInts(res, req.body, ['chapter_start', 'verse_start', 'chapter_end', 'verse_end', 'pseukim']);
  if (!ints) return;
  const {
    sefer, parsha_id_1 = null, parsha_id_2 = null, occasion_id = null,
    is_double_parsha = 0, date_read, note = '', location: loc = '',
  } = req.body;
  let id: number;
  try {
    const values: typeof hosafotReadings.$inferInsert = {
      sefer,
      parshaId1:      parsha_id_1,
      parshaId2:      parsha_id_2,
      occasionId:     occasion_id,
      isDoubleParsha: is_double_parsha ? 1 : 0,
      chapterStart:   ints['chapter_start'],
      verseStart:     ints['verse_start'],
      chapterEnd:     ints['chapter_end'],
      verseEnd:       ints['verse_end'],
      pseukim:        ints['pseukim'],
      dateRead:       date_read,
      note:           note  ? cleanText(note) || null : null,
      location:       loc   ? cleanText(loc)  || null : null,
    };
    const [inserted] = db.insert(hosafotReadings).values(values).returning({ id: hosafotReadings.id }).all();
    if (!inserted) throw new Error('Insert returned no row');
    id = inserted.id;
  } catch (e: unknown) {
    if (isUniqueConstraint(e))
      return res.status(409).json({ detail: 'This hosafah reading was already recorded on that date.' });
    throw e;
  }
  res.status(201).json({ id });
});

app.put('/api/readings/hosafot/:id', (req, res) => {
  const id = parseId(req);
  if (!existsOrNotFound(res, db.select({ id: hosafotReadings.id }).from(hosafotReadings).where(eq(hosafotReadings.id, id)), 'Hosafah reading')) return;
  const { date_read, note, location: loc } = req.body;
  if (!date_read) { res.status(400).json({ detail: 'date_read is required.' }); return; }
  db.update(hosafotReadings).set({
    dateRead: date_read,
    note:     note ? cleanText(note) || null : null,
    location: loc  ? cleanText(loc)  || null : null,
  }).where(eq(hosafotReadings.id, id)).run();
  res.json({ id });
});

app.delete('/api/readings/hosafot/:id', (req, res) => {
  const id = parseId(req);
  if (!existsOrNotFound(res, db.select({ id: hosafotReadings.id }).from(hosafotReadings).where(eq(hosafotReadings.id, id)), 'Hosafah reading')) return;
  db.delete(hosafotReadings).where(eq(hosafotReadings.id, id)).run();
  res.status(204).send();
});


// ── calendar feed ─────────────────────────────────────────────────────────────

app.get('/api/calendar.ics', async (_req, res) => {
  try {
    const ics = await buildCalendarFeed(rawDb);
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="torah-readings.ics"');
    res.send(ics);
  } catch (err: unknown) {
    console.error('Calendar feed error:', errText(err));
    res.status(500).json({ detail: 'Failed to generate calendar feed.' });
  }
});

// ── error handler ─────────────────────────────────────────────────────────────

// Terminal handler: without this, Express's default error handler responds with the
// full stack trace (including absolute filesystem paths) whenever a route throws.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', errText(err));
  res.status(500).json({ detail: 'Internal error' });
});

// ── start ─────────────────────────────────────────────────────────────────────

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  app.listen(Number(PORT), HOST, () =>
    console.log(`Torah tracker listening on http://${HOST}:${PORT}`)
  );
}

