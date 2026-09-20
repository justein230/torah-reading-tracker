import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { and, eq, inArray } from 'drizzle-orm';
import { createNativeDb } from './drizzle-native.js';
import { NATIVE_DB_VERSION, NATIVE_UPGRADE_STATEMENTS } from './nativeMigrations.generated.js';
import { sefarim, parshiot, parshaPairs, aliyot, readings, occasionAliyot as occasionAliyotTable, specialReadings as specialReadingsTable, weekdayAliyot as weekdayAliyotTable, weekdayReadings as weekdayReadingsTable, hosafotReadings as hosafotReadingsTable, torahChapters } from './schema.js';
import { ALIYOT_SQL, READINGS_SQL, LOCATION_STATS_SQL, OCCASIONS_SQL, OCCASION_ALIYOT_SQL, SPECIAL_READINGS_SQL, WEEKDAY_ALIYOT_SQL, HOSAFOT_READINGS_SQL } from './queries.js';
import type { MetaResult, RawRow, ReadingRecord, LocationStat, PostReadingBody, PutReadingBody, OccasionRecord, RawOccasionAliyahRow, RawSpecialReadingRow, PostSpecialReadingBody, RawWeekdayAliyahRow, PostWeekdayReadingBody, RawHosafahRow, PostHosafahBody, AuthStatus } from '../types/index.js';
import { scheduleFromEntries, datesByParshaFromEntries, fetchLiveHebcalItemsForDate, entriesFromHebcalItems } from '../utils/sedra.js';
import { SEDRA_CACHE, SEDRA_YEARS } from '../data/sedraCache.js';
import { logEvent } from '../utils/logger-client/index.js';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let dbPromise: Promise<Awaited<ReturnType<typeof sqlite.createConnection>>> | null = null;

function getConn() {
  dbPromise ??= (async () => {
    await sqlite.copyFromAssets(false);
    // Applies any drizzle migrations added since the on-device db's PRAGMA user_version was
    // last stamped (see scripts/build-native-migrations.ts and src/db/init.ts's server-side
    // equivalent) — a no-op for a freshly-copied asset db, which is already at NATIVE_DB_VERSION.
    await sqlite.addUpgradeStatement('torah', NATIVE_UPGRADE_STATEMENTS);
    const conn = await sqlite.createConnection('torah', false, 'no-encryption', NATIVE_DB_VERSION, false);
    await conn.open();
    return conn;
  })();
  return dbPromise;
}

const db = createNativeDb(getConn);

export async function fetchCanWrite(): Promise<boolean> {
  return true;
}

// Native has direct on-device DB access — there's no server to authenticate against,
// so writes are always allowed and login/logout are no-ops.
export async function fetchAuthStatus(): Promise<AuthStatus> {
  return { authMode: 'none', insecureConfig: false };
}

export async function login(_password: string): Promise<boolean> {
  return true;
}

export async function logout(): Promise<void> {
  // Intentional no-op — see comment above.
}

export async function changePassword(_currentPassword: string, _newPassword: string): Promise<{ ok: true } | { ok: false; error: string }> {
  return { ok: true };
}

const REQUIRED_IMPORT_TABLES = ['sefarim', 'parshiot', 'aliyot', 'readings'];
const SQLITE_MAGIC = 'SQLite format 3\0';

// Writes the upload into a scratch db (so getUrl() tells us its real path) and opens it there,
// to check it's valid before it ever touches the live database. Always tears the scratch db down.
async function validateImportedDb(base64: string): Promise<string | null> {
  const CHECK_DB = 'torah_import_check';
  const { Filesystem } = await import('@capacitor/filesystem');

  await CapacitorSQLite.deleteDatabase({ database: CHECK_DB }).catch(() => {});
  await sqlite.createConnection(CHECK_DB, false, 'no-encryption', 1, false);
  const { url: checkUrl } = await CapacitorSQLite.getUrl({ database: CHECK_DB });
  await sqlite.closeConnection(CHECK_DB, false);
  if (!checkUrl) return 'Could not locate scratch database on device.';
  await Filesystem.writeFile({ path: checkUrl, data: base64 });

  try {
    const checkConn = await sqlite.createConnection(CHECK_DB, false, 'no-encryption', 1, false);
    await checkConn.open();
    try {
      const integrity = await checkConn.query('PRAGMA integrity_check');
      if (integrity.values?.[0]?.integrity_check !== 'ok') return 'Database failed integrity check.';

      const tables = await checkConn.query("SELECT name FROM sqlite_master WHERE type = 'table'");
      const tableNames = new Set((tables.values ?? []).map((r: { name: string }) => r.name));
      const missing = REQUIRED_IMPORT_TABLES.filter(t => !tableNames.has(t));
      if (missing.length) {
        return `Doesn't look like a Torah Tracker database (missing table${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}).`;
      }
      return null;
    } finally {
      await checkConn.close();
    }
  } catch {
    return 'Could not open file as a SQLite database.';
  } finally {
    await sqlite.closeConnection(CHECK_DB, false).catch(() => {});
    await CapacitorSQLite.deleteDatabase({ database: CHECK_DB }).catch(() => {});
  }
}

// Native equivalent of importDatabase in utils/import-server.ts, minus migration/auth-row
// preservation (native has neither) — validates, then overwrites the live db file in place.
export async function importDatabase(file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = new TextDecoder('latin1').decode(bytes.slice(0, 16));
  if (header !== SQLITE_MAGIC) return { ok: false, error: 'Not a valid SQLite database file.' };

  const base64 = Buffer.from(bytes).toString('base64');
  const validationError = await validateImportedDb(base64);
  if (validationError) return { ok: false, error: validationError };

  const { Filesystem } = await import('@capacitor/filesystem');
  const { url: mainUrl } = await CapacitorSQLite.getUrl({ database: 'torah' });
  if (!mainUrl) return { ok: false, error: 'Could not locate the database on device.' };

  // Best-effort backup, not surfaced in the UI — shouldn't block the import if it fails.
  try {
    const current = await Filesystem.readFile({ path: mainUrl });
    await Filesystem.writeFile({ path: `${mainUrl}.bak`, data: current.data as string });
  } catch {
    // ignore
  }

  const conn = await getConn();
  await conn.close();
  await sqlite.closeConnection('torah', false);
  await Filesystem.writeFile({ path: mainUrl, data: base64 });
  dbPromise = null; // next getConn() reopens against the file just written

  return { ok: true };
}

export async function fetchMeta(): Promise<MetaResult> {
  const [seferRows, parshaRows, pairRows, chapterRows] = await Promise.all([
    db.select({ name: sefarim.name, name_en: sefarim.nameEn, color: sefarim.color, id: sefarim.id }).from(sefarim).orderBy(sefarim.sortOrder).all(),
    db.select({ id: parshiot.id, name: parshiot.name, name_en: parshiot.nameEn }).from(parshiot).orderBy(parshiot.sortOrder).all(),
    db.select({ id: parshaPairs.id, name: parshaPairs.name, name_en: parshaPairs.nameEn, parsha1_id: parshaPairs.parsha1Id, parsha2_id: parshaPairs.parsha2Id }).from(parshaPairs).all(),
    db.select({ seferId: torahChapters.seferId, verseCount: torahChapters.verseCount }).from(torahChapters).orderBy(torahChapters.seferId, torahChapters.chapter).all(),
  ]);
  const cvMap: Record<number, number[]> = {};
  for (const r of chapterRows) {
    const arr = cvMap[r.seferId] ?? [];
    cvMap[r.seferId] = arr;
    arr.push(r.verseCount);
  }
  return {
    sefarim: seferRows.map(s => ({ name: s.name, name_en: s.name_en, color: s.color, chapter_verses: cvMap[s.id] ?? [] })),
    parshiot: parshaRows,
    pairs: pairRows,
  };
}

export async function fetchAliyot(): Promise<RawRow[]> {
  const conn = await getConn();
  const res = await conn.query(ALIYOT_SQL, []);
  return (res.values ?? []) as RawRow[];
}

export async function fetchReadings(): Promise<ReadingRecord[]> {
  const conn = await getConn();
  const res = await conn.query(READINGS_SQL, []);
  return (res.values ?? []) as ReadingRecord[];
}

export async function fetchLocationStats(): Promise<LocationStat[]> {
  const conn = await getConn();
  const res = await conn.query(LOCATION_STATS_SQL, []);
  return (res.values ?? []) as LocationStat[];
}

async function postReadingFn({ parsha, aliyah, date_read, occasion = '', location = '', pair_id, reading_type: requested_type }: PostReadingBody): Promise<{ id: number; reading_type: string }> {
  if (!parsha || !aliyah || !date_read) throw Object.assign(new Error('parsha, aliyah, and date_read are required'), { detail: 'parsha, aliyah, and date_read are required' });

  const parshaRow = await db
    .select({ id: parshiot.id })
    .from(parshiot)
    .where(eq(parshiot.name, parsha))
    .get();
  if (!parshaRow) throw Object.assign(new Error('Aliyah not found'), { detail: 'Aliyah not found' });

  const aliyahRow = await db
    .select({ id: aliyot.id })
    .from(aliyot)
    .where(and(eq(aliyot.parshaId, parshaRow.id), eq(aliyot.aliyah, aliyah)))
    .get();
  if (!aliyahRow) throw Object.assign(new Error('Aliyah not found'), { detail: 'Aliyah not found' });

  const existing = await db
    .select({ id: readings.id })
    .from(readings)
    .where(and(eq(readings.aliyahId, aliyahRow.id), inArray(readings.readingType, ['standard', 'double_parsha'])))
    .get();
  let reading_type: string;
  if (existing) {
    reading_type = 'additional';
  } else {
    reading_type = requested_type === 'double_parsha' ? 'double_parsha' : 'standard';
  }

  const [inserted] = await db.insert(readings).values({
    aliyahId: aliyahRow.id,
    dateRead: date_read,
    occasion: occasion || null,
    location: location || null,
    readingType: reading_type,
    pairId: pair_id ?? null,
  }).returning({ id: readings.id });
  if (!inserted) throw new Error('Insert failed unexpectedly');

  return { id: inserted.id, reading_type };
}

async function putReadingFn(id: number, { occasion = '', location = '' }: PutReadingBody): Promise<{ id: number }> {
  const exists = await db
    .select({ id: readings.id })
    .from(readings)
    .where(eq(readings.id, id))
    .get();
  if (!exists) throw Object.assign(new Error('Reading not found'), { detail: 'Reading not found' });

  await db.update(readings)
    .set({ occasion: occasion || null, location: location || null })
    .where(eq(readings.id, id));
  return { id };
}

async function deleteReadingFn(id: number): Promise<void> {
  const exists = await db
    .select({ id: readings.id })
    .from(readings)
    .where(eq(readings.id, id))
    .get();
  if (!exists) throw Object.assign(new Error('Reading not found'), { detail: 'Reading not found' });

  await db.delete(readings).where(eq(readings.id, id));
}

// The upcoming-parsha dates come from the baked cache (src/data/sedraCache.ts, generated
// from the Hebcal.com REST API — CC BY 4.0). Native builds are cache-only and offline by
// default: no library, no network. The cache runs through SEDRA_YEARS[1].
export async function fetchHebcal(): Promise<{ schedule: Record<string, string>; datesByParsha: Record<string, string[]>; cacheYears: [number, number] }> {
  const parshaRows = await db.select({ name_en: parshiot.nameEn }).from(parshiot).all();
  const known = new Set(parshaRows.map(r => r.name_en));
  const today = new Date().toISOString().slice(0, 10);
  return {
    schedule:      scheduleFromEntries(SEDRA_CACHE, known, today),
    datesByParsha: datesByParshaFromEntries(SEDRA_CACHE, known),
    cacheYears:    [SEDRA_YEARS[0], SEDRA_YEARS[1]],
  };
}

// On-demand, single-day live lookup for dates outside SEDRA_YEARS. Opt-in via the
// Settings toggle (off by default, same as web) — only attempted when the device
// reports it's online, and any failure degrades to "no data" rather than throwing.
export async function fetchHebcalOnDate(date: string): Promise<{ parshiot: string[] }> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { parshiot: [] };
  try {
    const items = await fetchLiveHebcalItemsForDate(date);
    return { parshiot: entriesFromHebcalItems(items).map(([, name]) => name) };
  } catch {
    return { parshiot: [] };
  }
}

export async function fetchOccasions(): Promise<OccasionRecord[]> {
  const conn = await getConn();
  const res  = await conn.query(OCCASIONS_SQL, []);
  return ((res.values ?? []) as Array<{ id: number; name: string; name_en: string; category: string; sort_order: number }>)
    .map(r => ({ id: r.id, name: r.name, nameEn: r.name_en, category: r.category, sortOrder: r.sort_order }));
}

export async function fetchOccasionAliyot(): Promise<RawOccasionAliyahRow[]> {
  const conn = await getConn();
  const res  = await conn.query(OCCASION_ALIYOT_SQL, []);
  return (res.values ?? []) as RawOccasionAliyahRow[];
}

export async function fetchSpecialReadings(): Promise<RawSpecialReadingRow[]> {
  const conn = await getConn();
  const res  = await conn.query(SPECIAL_READINGS_SQL, []);
  return (res.values ?? []) as RawSpecialReadingRow[];
}

async function postSpecialReadingFn({ occasion_aliyah_id, date_read, note = '', location = '' }: PostSpecialReadingBody): Promise<{ id: number }> {
  const oaRow = await db
    .select({ id: occasionAliyotTable.id })
    .from(occasionAliyotTable)
    .where(eq(occasionAliyotTable.id, occasion_aliyah_id))
    .get();
  if (!oaRow) throw Object.assign(new Error('Occasion aliyah not found'), { detail: 'Occasion aliyah not found' });

  const [inserted] = await db.insert(specialReadingsTable).values({
    occasionAliyahId: occasion_aliyah_id,
    dateRead: date_read,
    note:     note     || null,
    location: location || null,
  }).returning({ id: specialReadingsTable.id });
  if (!inserted) throw new Error('Insert failed');
  return { id: inserted.id };
}

async function deleteSpecialReadingFn(id: number): Promise<void> {
  const exists = await db
    .select({ id: specialReadingsTable.id })
    .from(specialReadingsTable)
    .where(eq(specialReadingsTable.id, id))
    .get();
  if (!exists) throw Object.assign(new Error('Special reading not found'), { detail: 'Special reading not found' });
  await db.delete(specialReadingsTable).where(eq(specialReadingsTable.id, id));
}

export async function fetchWeekdayAliyot(): Promise<RawWeekdayAliyahRow[]> {
  const conn = await getConn();
  const res  = await conn.query(WEEKDAY_ALIYOT_SQL, []);
  return (res.values ?? []) as RawWeekdayAliyahRow[];
}

async function postWeekdayReadingFn({ weekday_aliyah_id, date_read, note = '', location = '' }: PostWeekdayReadingBody): Promise<{ id: number }> {
  const waRow = await db
    .select({ id: weekdayAliyotTable.id })
    .from(weekdayAliyotTable)
    .where(eq(weekdayAliyotTable.id, weekday_aliyah_id))
    .get();
  if (!waRow) throw Object.assign(new Error('Weekday aliyah not found'), { detail: 'Weekday aliyah not found' });

  const [inserted] = await db.insert(weekdayReadingsTable).values({
    weekdayAliyahId: weekday_aliyah_id,
    dateRead:        date_read,
    note:            note     || null,
    location:        location || null,
  }).returning({ id: weekdayReadingsTable.id });
  if (!inserted) throw new Error('Insert failed');
  return { id: inserted.id };
}

async function putWeekdayReadingFn(id: number, body: { date_read: string; note?: string; location?: string }): Promise<void> {
  const exists = await db.select({ id: weekdayReadingsTable.id }).from(weekdayReadingsTable).where(eq(weekdayReadingsTable.id, id)).get();
  if (!exists) throw Object.assign(new Error('Weekday reading not found'), { detail: 'Weekday reading not found' });
  await db.update(weekdayReadingsTable).set({ dateRead: body.date_read, note: body.note ?? null, location: body.location ?? null }).where(eq(weekdayReadingsTable.id, id));
}

async function deleteWeekdayReadingFn(id: number): Promise<void> {
  const exists = await db
    .select({ id: weekdayReadingsTable.id })
    .from(weekdayReadingsTable)
    .where(eq(weekdayReadingsTable.id, id))
    .get();
  if (!exists) throw Object.assign(new Error('Weekday reading not found'), { detail: 'Weekday reading not found' });
  await db.delete(weekdayReadingsTable).where(eq(weekdayReadingsTable.id, id));
}

export async function fetchHosafotReadings(): Promise<RawHosafahRow[]> {
  const conn = await getConn();
  const res  = await conn.query(HOSAFOT_READINGS_SQL, []);
  return (res.values ?? []) as RawHosafahRow[];
}

async function postHosafahFn(body: PostHosafahBody): Promise<{ id: number }> {
  const {
    sefer, parsha_id_1 = null, parsha_id_2 = null, occasion_id = null,
    is_double_parsha = 0, chapter_start, verse_start, chapter_end, verse_end,
    pseukim, date_read, note = '', location = '',
  } = body;

  const values: typeof hosafotReadingsTable.$inferInsert = {
    sefer,
    parshaId1:      parsha_id_1,
    parshaId2:      parsha_id_2,
    occasionId:     occasion_id,
    isDoubleParsha: is_double_parsha ? 1 : 0,
    chapterStart:   chapter_start,
    verseStart:     verse_start,
    chapterEnd:     chapter_end,
    verseEnd:       verse_end,
    pseukim,
    dateRead:       date_read,
    note:           note     || null,
    location:       location || null,
  };
  const [inserted] = await db.insert(hosafotReadingsTable).values(values).returning({ id: hosafotReadingsTable.id });
  if (!inserted) throw new Error('Insert failed');
  return { id: inserted.id };
}

async function putHosafahFn(id: number, body: { date_read: string; note?: string; location?: string }): Promise<void> {
  const exists = await db
    .select({ id: hosafotReadingsTable.id })
    .from(hosafotReadingsTable)
    .where(eq(hosafotReadingsTable.id, id))
    .get();
  if (!exists) throw Object.assign(new Error('Hosafah reading not found'), { detail: 'Hosafah reading not found' });
  await db.update(hosafotReadingsTable)
    .set({ dateRead: body.date_read, note: body.note ?? null, location: body.location ?? null })
    .where(eq(hosafotReadingsTable.id, id));
}

async function deleteHosafahFn(id: number): Promise<void> {
  const exists = await db
    .select({ id: hosafotReadingsTable.id })
    .from(hosafotReadingsTable)
    .where(eq(hosafotReadingsTable.id, id))
    .get();
  if (!exists) throw Object.assign(new Error('Hosafah reading not found'), { detail: 'Hosafah reading not found' });
  await db.delete(hosafotReadingsTable).where(eq(hosafotReadingsTable.id, id));
}

// ── logging ───────────────────────────────────────────────────────────────────
// Wraps each CUD function above with attempt/outcome logging, mirroring what
// src/db/web.ts's mutateJson/mutateVoid/del do for the web/Electron path — there's no
// single shared helper here since each function talks to Drizzle directly rather than
// going through a common fetch wrapper.
function logged<A extends unknown[], R>(label: string, fn: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  return async (...args: A): Promise<R> => {
    logEvent('debug', 'mutation', `${label} start`);
    try {
      const result = await fn(...args);
      logEvent('info', 'mutation', `${label} ok`);
      return result;
    } catch (e: unknown) {
      logEvent('warn', 'mutation', `${label} failed`, { detail: (e as { detail?: string } | null)?.detail });
      throw e;
    }
  };
}

export const postReading           = logged('postReading', postReadingFn);
export const putReading            = logged('putReading', putReadingFn);
export const deleteReading         = logged('deleteReading', deleteReadingFn);
export const postSpecialReading    = logged('postSpecialReading', postSpecialReadingFn);
export const deleteSpecialReading  = logged('deleteSpecialReading', deleteSpecialReadingFn);
export const postWeekdayReading    = logged('postWeekdayReading', postWeekdayReadingFn);
export const putWeekdayReading     = logged('putWeekdayReading', putWeekdayReadingFn);
export const deleteWeekdayReading  = logged('deleteWeekdayReading', deleteWeekdayReadingFn);
export const postHosafah           = logged('postHosafah', postHosafahFn);
export const putHosafah            = logged('putHosafah', putHosafahFn);
export const deleteHosafah         = logged('deleteHosafah', deleteHosafahFn);
