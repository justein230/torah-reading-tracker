import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
import { and, eq } from 'drizzle-orm';
import { createNativeDb } from './drizzle-native.js';
import { sefarim, parshiot, parshaPairs, aliyot, readings, occasionAliyot as occasionAliyotTable, specialReadings as specialReadingsTable, weekdayAliyot as weekdayAliyotTable, weekdayReadings as weekdayReadingsTable, torahChapters } from './schema.js';
import { ALIYOT_SQL, READINGS_SQL, LOCATION_STATS_SQL, OCCASIONS_SQL, OCCASION_ALIYOT_SQL, SPECIAL_READINGS_SQL, WEEKDAY_ALIYOT_SQL } from './queries.js';
import type { MetaResult, RawRow, ReadingRecord, LocationStat, PostReadingBody, PutReadingBody, OccasionRecord, RawOccasionAliyahRow, RawSpecialReadingRow, PostSpecialReadingBody, RawWeekdayAliyahRow, PostWeekdayReadingBody } from '../types/index.js';
import { scheduleFromEntries } from '../utils/sedra.js';
import { SEDRA_CACHE } from '../data/sedraCache.js';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let dbPromise: Promise<Awaited<ReturnType<typeof sqlite.createConnection>>> | null = null;

function getConn() {
  dbPromise ??= (async () => {
    await sqlite.copyFromAssets(false);
    const conn = await sqlite.createConnection('torah', false, 'no-encryption', 1, false);
    await conn.open();
    return conn;
  })();
  return dbPromise;
}

const db = createNativeDb(getConn);

export async function fetchCanWrite(): Promise<boolean> {
  return true;
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

export async function postReading({ parsha, aliyah, date_read, occasion = '', location = '' }: PostReadingBody): Promise<{ id: number; reading_type: string }> {
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
    .where(and(eq(readings.aliyahId, aliyahRow.id), eq(readings.readingType, 'original')))
    .get();
  const reading_type = existing ? 'additional' : 'original';

  const [inserted] = await db.insert(readings).values({
    aliyahId: aliyahRow.id,
    dateRead: date_read,
    occasion: occasion || null,
    location: location || null,
    readingType: reading_type,
  }).returning({ id: readings.id });
  if (!inserted) throw new Error('Insert failed unexpectedly');

  return { id: inserted.id, reading_type };
}

export async function putReading(id: number, { occasion = '', location = '' }: PutReadingBody): Promise<{ id: number }> {
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

export async function deleteReading(id: number): Promise<void> {
  const exists = await db
    .select({ id: readings.id })
    .from(readings)
    .where(eq(readings.id, id))
    .get();
  if (!exists) throw Object.assign(new Error('Reading not found'), { detail: 'Reading not found' });

  await db.delete(readings).where(eq(readings.id, id));
}

// The upcoming-parsha dates come from the baked cache (src/data/sedraCache.ts, generated
// from the Hebcal.com REST API — CC BY 4.0). Native builds are cache-only and offline:
// no library, no network. The cache runs through SEDRA_YEARS[1].
export async function fetchHebcal(): Promise<{ schedule: Record<string, string> }> {
  const parshaRows = await db.select({ name_en: parshiot.nameEn }).from(parshiot).all();
  const known = new Set(parshaRows.map(r => r.name_en));
  const today = new Date().toISOString().slice(0, 10);
  return { schedule: scheduleFromEntries(SEDRA_CACHE, known, today) };
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

export async function postSpecialReading({ occasion_aliyah_id, date_read, note = '', location = '' }: PostSpecialReadingBody): Promise<{ id: number }> {
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

export async function deleteSpecialReading(id: number): Promise<void> {
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

export async function postWeekdayReading({ weekday_aliyah_id, date_read, note = '', location = '' }: PostWeekdayReadingBody): Promise<{ id: number }> {
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

export async function putWeekdayReading(id: number, body: { date_read: string; note?: string; location?: string }): Promise<void> {
  const exists = await db.select({ id: weekdayReadingsTable.id }).from(weekdayReadingsTable).where(eq(weekdayReadingsTable.id, id)).get();
  if (!exists) throw Object.assign(new Error('Weekday reading not found'), { detail: 'Weekday reading not found' });
  await db.update(weekdayReadingsTable).set({ dateRead: body.date_read, note: body.note ?? null, location: body.location ?? null }).where(eq(weekdayReadingsTable.id, id));
}

export async function deleteWeekdayReading(id: number): Promise<void> {
  const exists = await db
    .select({ id: weekdayReadingsTable.id })
    .from(weekdayReadingsTable)
    .where(eq(weekdayReadingsTable.id, id))
    .get();
  if (!exists) throw Object.assign(new Error('Weekday reading not found'), { detail: 'Weekday reading not found' });
  await db.delete(weekdayReadingsTable).where(eq(weekdayReadingsTable.id, id));
}
