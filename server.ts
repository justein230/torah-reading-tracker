import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { and, eq, ne, sql } from 'drizzle-orm';
import { createDb } from './src/db/drizzle-server.js';
import { initDb } from './src/db/init.js';
import { sefarim, parshiot, occasions, adminPassword, authSessions } from './src/db/schema.js';
import { createRepository, RepoError, type QueryRows } from './src/db/repository.js';
import { buildSchedule, fetchLiveHebcalItems, fetchLiveHebcalItemsForDate, entriesFromHebcalItems, type Schedule } from './src/utils/sedra.js';
import { SEDRA_CACHE, SEDRA_YEARS } from './src/data/sedraCache.js';
import { HOLIDAY_CACHE } from './src/data/holidayCache.js';
import { holidayDatesFromEntries, NO_HOLIDAY_DATES, type HolidayDates } from './src/utils/occasionDates.js';
import { hashPassword, verifyPassword, generateSessionToken, hashSessionToken, parseSessionCookie, serializeSessionCookie, clearSessionCookie, isHeaderAuthenticated, generateBootstrapPassword } from './src/utils/auth.js';
import { buildExportBuffer } from './src/utils/export-server.js';
import { importDatabase, ImportValidationError } from './src/utils/import-server.js';
import { stampAppVersion } from './src/utils/backup-server.js';
import { buildCalendarFeed } from './src/utils/calendar-feed.js';
import { errText } from './src/utils/errText.js';
import { localDateStr } from './src/utils/dates.js';
import { createLogger, createHttpLogger, allLogFiles } from './src/utils/logger-server.js';

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
const MIGRATIONS_DIR = path.join(PROJECT_ROOT, 'drizzle');
// package.json ships alongside the server in every deployment (dev, Docker image, Electron asar).
const APP_VERSION: string = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8')).version;

// ── logging ───────────────────────────────────────────────────────────────────
// Log path follows DB_PATH's directory (not PROJECT_ROOT) so it lands in Electron's
// writable userData dir alongside torah.db — see createLogger's doc comment.

const logger     = createLogger(DB_PATH);
const httpLogger = createHttpLogger(logger);

// ── database ──────────────────────────────────────────────────────────────────

// `let`, not `const`: a DB import (see /api/import/db below) closes the old handle and
// reassigns both to a freshly opened, migrated database. Not exported — nothing outside
// this module needs it; tests that need direct SQL access open their own connection to
// the same TORAH_DB_PATH file instead (see tests/integration).
let rawDb = new Database(DB_PATH);
rawDb.pragma('journal_mode = DELETE');
rawDb.pragma('foreign_keys = OFF'); // must be off during migrations (table recreations need it)
let db = createDb(rawDb);
// Reads `rawDb` at call time, so it follows the handle swap after a DB import.
const queryRows: QueryRows = async (query, params = []) => rawDb.prepare(query).all(...params);
// Every read and write the data routes below perform lives here, shared with the native app.
let repo = createRepository(db, queryRows);
// Printed (so `docker logs` shows it) and kept in the log file, to check what a deploy migrated.
const logMigration = (message: string) => { console.log(message); logger.info(message); };
// Backs the db up beside itself first if a migration is pending (see backupBeforeMigrating).
initDb(rawDb, MIGRATIONS_DIR, logMigration, { appVersion: APP_VERSION, backupDbPath: DB_PATH });
rawDb.pragma('foreign_keys = ON');

// ── express app ───────────────────────────────────────────────────────────────

export const app = express();
app.use(express.json());
app.use(httpLogger);
app.use(express.static(path.join(PROJECT_ROOT, 'dist')));
app.disable('x-powered-by');

// ── write guard ───────────────────────────────────────────────────────────────

// Same NODE_ENV-based default as before, overridable via TORAH_REQUIRE_PROXY_HEADER.
const REQUIRE_PROXY_HEADER = process.env.TORAH_REQUIRE_PROXY_HEADER
  ? process.env.TORAH_REQUIRE_PROXY_HEADER === 'true'
  : process.env.NODE_ENV === 'production';

// ── auth ──────────────────────────────────────────────────────────────────────
// Three mutually exclusive modes:
//  'none'                — no auth at all. Forced on, and NOT settable via env var
//                          (so a web deployment can't be misconfigured into it), whenever
//                          this process is actually running inside Electron — see
//                          IS_ELECTRON below. The desktop app's DB is per-user local
//                          storage with no network exposure, so there's nothing to guard.
//  'password' (default) — the app's own login, for deployments with no auth in front.
//  'header'              — trust a header an upstream reverse proxy sets after doing
//                           its own auth (e.g. Traefik/Caddy basicAuth). Only trusted
//                           when TORAH_REQUIRE_PROXY_HEADER is also on — see
//                           isHeaderAuthenticated for why.
//                           Any IP-based restriction (e.g. LAN-only access) is the
//                           reverse proxy's job now, not the app's.

// True only when this process is actually running inside the Electron runtime
// (server.ts is imported in-process by electron/main.cjs, not spawned as a plain
// Node subprocess) — not a flag any deployment config could set by accident.
// The one exception is `npm run electron:dev`, which runs this server as a separate Node
// process (nodemon + tsx) next to the Electron window; it sets ELECTRON_DEV so the window
// sees the same no-auth behaviour as the packaged app. Ignored in production.
const IS_ELECTRON = !!(process.versions as NodeJS.ProcessVersions & { electron?: string }).electron
  || (process.env.ELECTRON_DEV === 'true' && process.env.NODE_ENV !== 'production');

function resolveAuthMode(): 'none' | 'header' | 'password' {
  if (IS_ELECTRON) return 'none';
  if (process.env.TORAH_AUTH_MODE === 'header') return 'header';
  return 'password';
}
const AUTH_MODE = resolveAuthMode();
const AUTH_HEADER = (process.env.TORAH_AUTH_HEADER || 'x-forwarded-user').toLowerCase();
const COOKIE_SECURE = process.env.NODE_ENV === 'production';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getStoredPasswordHash(): string | null {
  return db.select({ passwordHash: adminPassword.passwordHash }).from(adminPassword).where(eq(adminPassword.id, 1)).get()?.passwordHash ?? null;
}

// If TORAH_ADMIN_PASSWORD is set on first start (no stored hash yet), hash it into
// admin_password so the plaintext doesn't need to stay set across restarts. First-start-
// only: once a hash exists, the env var is never re-applied
//
// If it's not set and no password has ever been configured, generate a random one-time
// bootstrap password, store its hash, and print the plaintext to the logs.
const existingPasswordHash = getStoredPasswordHash();
// Env var still set in password mode is always the "forgot to unset it" case the
// insecureConfig banner warns about — true whether this is the first start (which
// just hashed it) or a later one (which left the existing hash alone).
const INSECURE_CONFIG = AUTH_MODE === 'password' && !!process.env.TORAH_ADMIN_PASSWORD;
if (AUTH_MODE === 'password' && process.env.TORAH_ADMIN_PASSWORD && !existingPasswordHash) {
  const passwordHash = hashPassword(process.env.TORAH_ADMIN_PASSWORD);
  db.insert(adminPassword)
    .values({ id: 1, passwordHash })
    .onConflictDoUpdate({ target: adminPassword.id, set: { passwordHash, updatedAt: sql`(datetime('now'))` } })
    .run();
} else if (AUTH_MODE === 'password' && !existingPasswordHash) {
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
  if (AUTH_MODE === 'none') return true;
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
  const { password } = bodyOrEmpty(req);
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
  const { currentPassword, newPassword } = bodyOrEmpty(req);
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

let _schedule: Schedule | null = null;

async function getSchedule(): Promise<Schedule> {
  if (_schedule) return _schedule;

  _schedule = await buildSchedule({
    parshaNames: new Set(
      db.select({ name_en: parshiot.nameEn }).from(parshiot).all().map(r => r.name_en)
    ),
    today:        localDateStr(),
    cache:        SEDRA_CACHE,
    cacheEndYear: SEDRA_YEARS[1],
    fetchLive:    fetchLiveHebcalItems,
  });
  return _schedule;
}

// Holiday dates are cache-only (HOLIDAY_YEARS), so unlike the schedule they need no live extend.
// Memoised like _schedule: the occasions table is static reference data.
let _holidayDates: HolidayDates | null = null;

function getHolidayDates(): HolidayDates {
  _holidayDates ??= holidayDatesFromEntries(
    HOLIDAY_CACHE,
    db.select({ nameEn: occasions.nameEn }).from(occasions).all().map(r => r.nameEn),
  );
  return _holidayDates;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function parseId(req: express.Request): number {
  return Number.parseInt(String(req.params['id']), 10);
}

// Express 5 leaves req.body undefined (Express 4 made it {}) when no body was parsed, e.g. a
// POST with no payload. Reading it through here lets requireFields answer 400 instead of crashing.
function bodyOrEmpty(req: express.Request) {
  return req.body ?? {};
}

// ── routes ────────────────────────────────────────────────────────────────────

app.get('/api/hebcal', async (_req, res) => {
  try {
    const { schedule, datesByParsha } = await getSchedule();
    res.json({ schedule, datesByParsha, cacheYears: SEDRA_YEARS, holidayDates: getHolidayDates() });
  } catch (err: unknown) {
    logger.error({ err: errText(err) }, 'Hebcal error');
    res.json({ schedule: {}, datesByParsha: {}, cacheYears: SEDRA_YEARS, holidayDates: NO_HOLIDAY_DATES });
  }
});

// On-demand, single-day live lookup for dates outside SEDRA_YEARS — opt-in from the
// client (Settings toggle), since it's an outbound call to Hebcal.com per date checked.
app.get('/api/hebcal/lookup', async (req, res) => {
  const date = req.query['date'];
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ detail: 'date must be YYYY-MM-DD' });
    return;
  }
  try {
    const items = await fetchLiveHebcalItemsForDate(date);
    res.json({ parshiot: entriesFromHebcalItems(items).map(([, name]) => name) });
  } catch (err: unknown) {
    logger.error({ err: errText(err) }, 'Hebcal lookup error');
    res.json({ parshiot: [] });
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
    const rows = await repo.fetchAliyot() as Parameters<typeof buildExportBuffer>[0];
    const seferRows = db.select({ name: sefarim.name, name_en: sefarim.nameEn })
      .from(sefarim).orderBy(sefarim.sortOrder).all();
    const buf = await buildExportBuffer(rows, seferRows);
    const filename = `torah-readings-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buf);
  } catch (err: unknown) {
    logger.error({ err: errText(err) }, 'Excel export error');
    res.status(500).json({ detail: 'Failed to generate export.' });
  }
});

app.get('/api/export/db', privateOnly, (_req, res) => {
  const data = fs.readFileSync(DB_PATH);
  res.setHeader('Content-Type', 'application/vnd.sqlite3');
  res.setHeader('Content-Disposition', 'attachment; filename="torah.db"');
  res.end(data);
});

// Server-side mutation/request log only — there is no endpoint for the client to write
// to this file. See src/utils/logger-client for how browser/Electron/Capacitor logging
// is handled instead (console, electron-log, and on-device file respectively).
app.get('/api/export/logs', privateOnly, (_req, res) => {
  const files = allLogFiles(DB_PATH);
  const body = files.length
    ? files.map(f => `── ${path.basename(f)} ──\n${fs.readFileSync(f, 'utf8')}`).join('\n')
    : '(no log entries yet)\n';
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="torah-logs.txt"');
  res.send(body);
});

// express.raw is scoped to this route only, so the global express.json() above still
// handles every other endpoint untouched.
app.post('/api/import/db', privateOnly, express.raw({ type: 'application/vnd.sqlite3', limit: '25mb' }), (req, res) => {
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
    return res.status(400).json({ detail: 'No file uploaded.' });
  }
  try {
    ({ rawDb, db } = importDatabase(req.body, rawDb, DB_PATH, MIGRATIONS_DIR, message => logMigration(`DB import: ${message}`)));
    repo = createRepository(db, queryRows);
    stampAppVersion(rawDb, APP_VERSION);
    res.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof ImportValidationError) return res.status(400).json({ detail: err.message });
    logger.error({ err: errText(err) }, 'DB import error');
    res.status(500).json({ detail: 'Failed to import database.' });
  }
});

// Data routes only adapt HTTP to the repository: read the body, call it, send the result. A RepoError
// it throws (400/404/409) reaches the error handler at the bottom via Express 5's async forwarding.

app.get('/api/meta',            async (_req, res) => { res.json(await repo.fetchMeta()); });
app.get('/api/aliyot',          async (_req, res) => { res.json(await repo.fetchAliyot()); });
app.get('/api/stats/location',  async (_req, res) => { res.json(await repo.fetchLocationStats()); });
app.get('/api/readings',        async (_req, res) => { res.json(await repo.fetchReadings()); });

app.post('/api/readings', async (req, res) => {
  res.status(201).json(await repo.postReading(bodyOrEmpty(req)));
});

app.put('/api/readings/:id', async (req, res) => {
  res.json(await repo.putReading(parseId(req), bodyOrEmpty(req)));
});

app.delete('/api/readings/:id', async (req, res) => {
  await repo.deleteReading(parseId(req));
  res.status(204).send();
});

// ── occasions / special readings ──────────────────────────────────────────────

app.get('/api/occasions',        async (_req, res) => { res.json(await repo.fetchOccasions()); });
app.get('/api/occasion-aliyot',  async (_req, res) => { res.json(await repo.fetchOccasionAliyot()); });
app.get('/api/readings/special', async (_req, res) => { res.json(await repo.fetchSpecialReadings()); });

app.post('/api/readings/special', async (req, res) => {
  res.status(201).json(await repo.postSpecialReading(bodyOrEmpty(req)));
});

app.delete('/api/readings/special/:id', async (req, res) => {
  await repo.deleteSpecialReading(parseId(req));
  res.status(204).send();
});

// ── weekday readings ──────────────────────────────────────────────────────────

app.get('/api/weekday-aliyot', async (_req, res) => { res.json(await repo.fetchWeekdayAliyot()); });

app.post('/api/readings/weekday', async (req, res) => {
  res.status(201).json(await repo.postWeekdayReading(bodyOrEmpty(req)));
});

app.put('/api/readings/weekday/:id', async (req, res) => {
  const id = parseId(req);
  await repo.putWeekdayReading(id, bodyOrEmpty(req));
  res.json({ id });
});

app.delete('/api/readings/weekday/:id', async (req, res) => {
  await repo.deleteWeekdayReading(parseId(req));
  res.status(204).send();
});

// ── hosafot readings ──────────────────────────────────────────────────────────

app.get('/api/readings/hosafot', async (_req, res) => { res.json(await repo.fetchHosafotReadings()); });

app.post('/api/readings/hosafot', async (req, res) => {
  res.status(201).json(await repo.postHosafah(bodyOrEmpty(req)));
});

app.put('/api/readings/hosafot/:id', async (req, res) => {
  const id = parseId(req);
  await repo.putHosafah(id, bodyOrEmpty(req));
  res.json({ id });
});

app.delete('/api/readings/hosafot/:id', async (req, res) => {
  await repo.deleteHosafah(parseId(req));
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
    logger.error({ err: errText(err) }, 'Calendar feed error');
    res.status(500).json({ detail: 'Failed to generate calendar feed.' });
  }
});

// ── error handler ─────────────────────────────────────────────────────────────

// Terminal handler: without this, Express's default error handler responds with the
// full stack trace (including absolute filesystem paths) whenever a route throws.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof RepoError) {
    res.status(err.status).json({ detail: err.detail });
    return;
  }
  logger.error({ err: errText(err) }, 'Unhandled error');
  res.status(500).json({ detail: 'Internal error' });
});

// ── start ─────────────────────────────────────────────────────────────────────

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  app.listen(Number(PORT), HOST, () =>
    console.log(`Torah tracker listening on http://${HOST}:${PORT}`)
  );
}

