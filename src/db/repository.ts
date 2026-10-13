import { and, eq, inArray } from 'drizzle-orm';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import * as schema from './schema.js';
import { sefarim, parshiot, parshaPairs, aliyot, readings, occasionAliyot, specialReadings, weekdayAliyot, weekdayReadings, hosafotReadings, torahChapters } from './schema.js';
import { ALIYOT_SQL, READINGS_SQL, LOCATION_STATS_SQL, OCCASIONS_SQL, OCCASION_ALIYOT_SQL, SPECIAL_READINGS_SQL, WEEKDAY_ALIYOT_SQL, HOSAFOT_READINGS_SQL } from './queries.js';
import { localDateStr } from '../utils/dates.js';
import type { MetaResult, RawRow, ReadingRecord, LocationStat, PostReadingBody, PutReadingBody, OccasionRecord, RawOccasionAliyahRow, RawSpecialReadingRow, PostSpecialReadingBody, RawWeekdayAliyahRow, PostWeekdayReadingBody, RawHosafahRow, PostHosafahBody } from '../types/index.js';

// The one implementation of every read and write, shared by the Express server (better-sqlite3,
// synchronous) and the Capacitor app (sqlite-proxy, asynchronous). Drizzle's query builders can be
// awaited on both, so each body is written once with `await`.

// Either Drizzle driver: the server's sync one or the native async one.
// oxlint-disable-next-line no-explicit-any -- the run-result type differs per driver and is never read here
export type RepoDb = BaseSQLiteDatabase<'sync' | 'async', any, typeof schema>;

// Runs a raw SELECT and returns rows as column-name objects. Injected because the two platforms
// reach SQLite differently, and Drizzle's proxy driver returns raw-SQL rows without column names.
export type QueryRows = (sql: string, params?: Array<string | number | null>) => Promise<unknown[]>;

// A failure the caller caused (bad input, missing row, duplicate). `status` is the HTTP code the
// server answers with; `detail` is the message both platforms show the user.
export class RepoError extends Error {
  constructor(readonly status: number, readonly detail: string) {
    super(detail);
    this.name = 'RepoError';
  }
}

// ── helpers ───────────────────────────────────────────────────────────────────

// Strips control characters from user-supplied free text (occasion/location/note)
// before it's stored and later echoed into the public ICS calendar feed.
export function cleanText(s: string): string {
  // oxlint-disable-next-line no-control-regex -- intentional: stripping control chars is the point
  return s.replace(/[\x00-\x1F\x7F]/g, '').trim();
}

// Cleans an optional free-text field, collapsing missing/empty/control-only input to null
// so it stores as NULL rather than ''.
export function cleanOrNull(s: string | undefined | null): string | null {
  return s ? cleanText(s) || null : null;
}

// better-sqlite3 sets `code`; the Capacitor plugin only reports the message. Drizzle may wrap either in `cause`.
export function isUniqueConstraint(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false;
  const { code, message, cause } = e as { code?: unknown; message?: unknown; cause?: unknown };
  return code === 'SQLITE_CONSTRAINT_UNIQUE'
    || (typeof message === 'string' && message.includes('UNIQUE constraint failed'))
    || isUniqueConstraint(cause);
}

function requireFields(body: object, fields: string[]): void {
  const missing = fields.filter(f => !(body as Record<string, unknown>)[f]);
  if (missing.length) throw new RepoError(400, `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} required`);
}

// Coerces the given fields to positive integers. Prevents non-numeric input from reaching the
// chapter/verse columns that drive the chapter*1000+verse overlap arithmetic in queries.ts and compute.ts.
function requireInts<F extends string>(body: object, fields: F[]): Record<F, number> {
  const out = {} as Record<F, number>;
  for (const f of fields) {
    const raw = (body as Record<string, unknown>)[f];
    const n = typeof raw === 'string' || typeof raw === 'number' ? Number.parseInt(String(raw), 10) : Number.NaN;
    if (!Number.isFinite(n) || n < 1) throw new RepoError(400, `${f} must be a positive integer`);
    out[f] = n;
  }
  return out;
}

async function assertFound(row: unknown, label: string): Promise<void> {
  if (!(await row)) throw new RepoError(404, `${label} not found`);
}

// Runs an insert that returns the new row's id, turning a duplicate-key failure into a 409. The insert
// is passed as a function because the sync driver throws as soon as the query is built, not when awaited.
async function insertId(insert: () => PromiseLike<Array<{ id: number }>> | Array<{ id: number }>, duplicateDetail: string): Promise<number> {
  try {
    const [row] = await insert();
    if (!row) throw new Error('Insert returned no row');
    return row.id;
  } catch (e: unknown) {
    throw isUniqueConstraint(e) ? new RepoError(409, duplicateDetail) : e;
  }
}

// The tables whose rows are edited or removed by id from the UI, each with an `id` primary key.
type ReadingTable = typeof readings | typeof specialReadings | typeof weekdayReadings | typeof hosafotReadings;
type DatedNoteTable = typeof weekdayReadings | typeof hosafotReadings;

export function createRepository(db: RepoDb, queryRows: QueryRows) {
  async function removeById(table: ReadingTable, id: number, label: string): Promise<void> {
    await assertFound(db.select({ id: table.id }).from(table).where(eq(table.id, id)).get(), label);
    await db.delete(table).where(eq(table.id, id)).run();
  }

  // Weekday and hosafot readings are edited the same way: a new date plus optional note/location.
  async function updateDatedNote(table: DatedNoteTable, id: number, body: { date_read: string; note?: string; location?: string }, label: string): Promise<void> {
    requireFields(body, ['date_read']);
    await assertFound(db.select({ id: table.id }).from(table).where(eq(table.id, id)).get(), label);
    await db.update(table)
      .set({ dateRead: body.date_read, note: cleanOrNull(body.note), location: cleanOrNull(body.location) })
      .where(eq(table.id, id))
      .run();
  }

  const rows = <T>(sql: string, params: Array<string | number | null> = []) => queryRows(sql, params) as Promise<T[]>;

  return {
    // ── reads ───────────────────────────────────────────────────────────────

    async fetchMeta(): Promise<MetaResult> {
      const [seferRows, parshaRows, pairRows, chapterRows] = await Promise.all([
        db.select({ id: sefarim.id, name: sefarim.name, name_en: sefarim.nameEn, color: sefarim.color }).from(sefarim).orderBy(sefarim.sortOrder).all(),
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
        sefarim:  seferRows.map(s => ({ name: s.name, name_en: s.name_en, color: s.color, chapter_verses: cvMap[s.id] ?? [] })),
        parshiot: parshaRows,
        pairs:    pairRows,
      };
    },

    fetchAliyot:           () => rows<RawRow>(ALIYOT_SQL),
    fetchReadings:         () => rows<ReadingRecord>(READINGS_SQL),
    fetchOccasionAliyot:   () => rows<RawOccasionAliyahRow>(OCCASION_ALIYOT_SQL),
    fetchSpecialReadings:  () => rows<RawSpecialReadingRow>(SPECIAL_READINGS_SQL),
    fetchWeekdayAliyot:    () => rows<RawWeekdayAliyahRow>(WEEKDAY_ALIYOT_SQL),
    fetchHosafotReadings:  () => rows<RawHosafahRow>(HOSAFOT_READINGS_SQL),

    fetchLocationStats(): Promise<LocationStat[]> {
      const today = localDateStr();
      return rows<LocationStat>(LOCATION_STATS_SQL, [today, today]);
    },

    async fetchOccasions(): Promise<OccasionRecord[]> {
      const found = await rows<{ id: number; name: string; name_en: string; category: string; sort_order: number }>(OCCASIONS_SQL);
      return found.map(r => ({ id: r.id, name: r.name, nameEn: r.name_en, category: r.category, sortOrder: r.sort_order }));
    },

    // ── standard readings ───────────────────────────────────────────────────

    async postReading(body: PostReadingBody): Promise<{ id: number; reading_type: string }> {
      requireFields(body, ['parsha', 'aliyah', 'date_read']);
      const { parsha, aliyah, date_read, occasion = '', location = '', pair_id, reading_type: requested } = body;

      const aliyahRow = await db.select({ id: aliyot.id })
        .from(aliyot)
        .innerJoin(parshiot, eq(parshiot.id, aliyot.parshaId))
        .where(and(eq(parshiot.name, parsha), eq(aliyot.aliyah, aliyah)))
        .get();
      if (!aliyahRow) throw new RepoError(404, 'Aliyah not found');

      // A second recording of an aliyah that already has a standard/double_parsha one is 'additional',
      // so each aliyah is counted once toward completion.
      const existing = await db.select({ id: readings.id })
        .from(readings)
        .where(and(eq(readings.aliyahId, aliyahRow.id), inArray(readings.readingType, ['standard', 'double_parsha'])))
        .get();
      let reading_type = 'additional';
      if (!existing) reading_type = requested === 'double_parsha' ? 'double_parsha' : 'standard';

      const id = await insertId(() => db.insert(readings).values({
        aliyahId:    aliyahRow.id,
        dateRead:    date_read,
        occasion:    cleanOrNull(occasion),
        location:    cleanOrNull(location),
        readingType: reading_type,
        pairId:      pair_id ?? null,
      }).returning({ id: readings.id }).all(), 'This aliyah was already recorded on that date.');
      return { id, reading_type };
    },

    async putReading(id: number, { occasion = '', location = '' }: PutReadingBody): Promise<{ id: number }> {
      await assertFound(db.select({ id: readings.id }).from(readings).where(eq(readings.id, id)).get(), 'Reading');
      await db.update(readings)
        .set({ occasion: cleanOrNull(occasion), location: cleanOrNull(location) })
        .where(eq(readings.id, id))
        .run();
      return { id };
    },

    deleteReading: (id: number) => removeById(readings, id, 'Reading'),

    // ── special (occasion) readings ─────────────────────────────────────────

    async postSpecialReading(body: PostSpecialReadingBody): Promise<{ id: number }> {
      requireFields(body, ['occasion_aliyah_id', 'date_read']);
      const { occasion_aliyah_id, date_read, note = '', location = '' } = body;
      await assertFound(db.select({ id: occasionAliyot.id }).from(occasionAliyot).where(eq(occasionAliyot.id, occasion_aliyah_id)).get(), 'Occasion aliyah');

      const id = await insertId(() => db.insert(specialReadings).values({
        occasionAliyahId: occasion_aliyah_id,
        dateRead:         date_read,
        note:             cleanOrNull(note),
        location:         cleanOrNull(location),
      }).returning({ id: specialReadings.id }).all(), 'This occasion aliyah was already recorded on that date.');
      return { id };
    },

    deleteSpecialReading: (id: number) => removeById(specialReadings, id, 'Special reading'),

    // ── weekday readings ────────────────────────────────────────────────────

    async postWeekdayReading(body: PostWeekdayReadingBody): Promise<{ id: number }> {
      requireFields(body, ['weekday_aliyah_id', 'date_read']);
      const { weekday_aliyah_id, date_read, note = '', location = '' } = body;
      await assertFound(db.select({ id: weekdayAliyot.id }).from(weekdayAliyot).where(eq(weekdayAliyot.id, weekday_aliyah_id)).get(), 'Weekday aliyah');

      const id = await insertId(() => db.insert(weekdayReadings).values({
        weekdayAliyahId: weekday_aliyah_id,
        dateRead:        date_read,
        note:            cleanOrNull(note),
        location:        cleanOrNull(location),
      }).returning({ id: weekdayReadings.id }).all(), 'This weekday reading was already recorded.');
      return { id };
    },

    putWeekdayReading: (id: number, body: { date_read: string; note?: string; location?: string }) =>
      updateDatedNote(weekdayReadings, id, body, 'Weekday reading'),

    deleteWeekdayReading: (id: number) => removeById(weekdayReadings, id, 'Weekday reading'),

    // ── hosafot readings ────────────────────────────────────────────────────

    async postHosafah(body: PostHosafahBody): Promise<{ id: number }> {
      requireFields(body, ['sefer', 'chapter_start', 'verse_start', 'chapter_end', 'verse_end', 'pseukim', 'date_read']);
      const ints = requireInts(body, ['chapter_start', 'verse_start', 'chapter_end', 'verse_end', 'pseukim']);
      const {
        sefer, parsha_id_1 = null, parsha_id_2 = null, occasion_id = null,
        is_double_parsha = 0, date_read, note = '', location = '',
      } = body;

      const id = await insertId(() => db.insert(hosafotReadings).values({
        sefer,
        parshaId1:      parsha_id_1,
        parshaId2:      parsha_id_2,
        occasionId:     occasion_id,
        isDoubleParsha: is_double_parsha ? 1 : 0,
        chapterStart:   ints.chapter_start,
        verseStart:     ints.verse_start,
        chapterEnd:     ints.chapter_end,
        verseEnd:       ints.verse_end,
        pseukim:        ints.pseukim,
        dateRead:       date_read,
        note:           cleanOrNull(note),
        location:       cleanOrNull(location),
      }).returning({ id: hosafotReadings.id }).all(), 'This hosafah reading was already recorded on that date.');
      return { id };
    },

    putHosafah: (id: number, body: { date_read: string; note?: string; location?: string }) =>
      updateDatedNote(hosafotReadings, id, body, 'Hosafah reading'),

    deleteHosafah: (id: number) => removeById(hosafotReadings, id, 'Hosafah reading'),
  };
}

export type Repository = ReturnType<typeof createRepository>;
