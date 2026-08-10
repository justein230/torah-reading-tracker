import type { RawRow, MappedRow, RawOccasionAliyahRow, MappedOccasionAliyah, RawSpecialReadingRow, SpecialReadingRecord, RawWeekdayAliyahRow, MappedWeekdayAliyah, RawWeekdayReadingRow, WeekdayReadingRecord, RawHosafahRow, MappedHosafah } from './types/index.js';

export const getTodayStr = (): string => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// Static snapshot used by components; mapRow calls getTodayStr() for fresh evaluation.
export const TODAY_STR = getTodayStr();

/**
 * Transforms a raw database row into the shape used throughout the app.
 * Key derived fields:
 *   isRead        — has an original reading date
 *   isReadPast    — read date is today or earlier
 *   isReadFuture  — read date is in the future
 *   hasFuture     — has at least one scheduled future re-reading date
 *   yearRead      — year of the original reading (null if unread)
 *   futureYear    — year of the first future re-reading (null if none)
 *   allYears      — union of yearRead + futureYear, used for year-filter matching
 *   rereadCount   — number of times this aliyah has been re-read
 */
export function mapRow(r: RawRow): MappedRow {
  const orig        = r.orig || '';
  const directOrig  = r.direct_orig || '';
  const readAsDouble = r.read_type === 'double_parsha';
  const partialOrig = '';
  const futDates  = r.fut ? r.fut.split(',') : [];
  const today        = getTodayStr();
  const isRead       = orig !== '';
  const isReadPast   = isRead && orig <= today;
  const isReadFuture = isRead && orig > today;
  const hasFuture    = futDates.length > 0;
  const yearRead     = isRead    ? new Date(orig).getFullYear()                          : null;
  const futureYear   = hasFuture ? new Date(futDates[0] as string).getFullYear()         : null;
  const allYears     = [...new Set([yearRead, futureYear].filter((y): y is number => y !== null))];
  return {
    sefer: r.sefer, parsha: r.parsha, aliyah: r.aliyah,
    pairName: r.pair_name || '', pairNameEn: r.pair_name_en || '', combinedAliyah: r.combined_aliyah ?? null,
    pseukim: r.pseukim,
    chapterStart: r.chapter_start ?? -1, verseStart: r.verse_start ?? -1,
    chapterEnd: r.chapter_end ?? -1,     verseEnd: r.verse_end ?? -1,
    orig, directOrig, readAsDouble, partialOrig, futDates, isRead, isReadPast, isReadFuture, hasFuture,
    isFuture: isReadFuture, /* alias for isReadFuture; consistent with isFuture on calendar/log entries */
    isReread: false,        /* base rows are never re-reads; synthetic calendar/log entries override this */
    yearRead, futureYear, allYears,
    occasion: r.occasion || '', location: r.location || '', pct: r.pct, rereadCount: r.reread_count || 0,
  };
}

/**
 * Stamps parshaPct (this aliyah's share of its parsha's total pseukim) onto
 * each row. Must run after all rows are mapped so the parsha totals are known.
 */
export function enrichRows(rows: MappedRow[]): MappedRow[] {
  const totals: Record<string, number> = {};
  for (const r of rows) totals[r.parsha] = (totals[r.parsha] ?? 0) + r.pseukim;
  return rows.map(r => ({ ...r, parshaPct: (totals[r.parsha] ?? 0) > 0 ? (r.pseukim / (totals[r.parsha] as number) * 100) : 0 }));
}

export function mapOccasionAliyahRow(r: RawOccasionAliyahRow): MappedOccasionAliyah {
  const today  = getTodayStr();
  const orig   = r.orig || '';
  const isRead = orig !== '';
  return {
    id: r.id, occasionId: r.occasion_id, occasion: r.occasion, occasionEn: r.occasion_en,
    category: r.category, aliyahKey: r.aliyah_key, isShabbatVariant: Boolean(r.is_shabbat_variant),
    parshaId: r.parsha_id, parsha: r.parsha, parshaEn: r.parsha_en,
    sefer: r.sefer, seferEn: r.sefer_en, seferColor: r.sefer_color,
    pseukim: r.pseukim,
    chapterStart: r.chapter_start, verseStart: r.verse_start,
    chapterEnd: r.chapter_end, verseEnd: r.verse_end,
    coversAliyahId: r.covers_aliyah_id,
    orig, allDates: r.all_dates ? r.all_dates.split(',') : [],
    readCount: r.read_count || 0, isRead,
    isReadPast: isRead && orig <= today,
    isReadFuture: isRead && orig > today,
    hasFuture: isRead && orig <= today && (r.all_dates ? r.all_dates.split(',') : []).some(d => d > today),
    partialOrig: '', isCoveredPast: false,
  };
}

export function mapSpecialReadingRow(r: RawSpecialReadingRow): SpecialReadingRecord {
  return {
    id: r.id,
    occasionAliyahId: r.occasion_aliyah_id,
    occasionId:       r.occasion_id,
    occasion:         r.occasion,
    occasionEn:       r.occasion_en,
    category:         r.category,
    aliyahKey:        r.aliyah_key,
    isShabbatVariant: Boolean(r.is_shabbat_variant),
    parsha:           r.parsha,
    parshaEn:         r.parsha_en,
    dateRead:         r.date_read,
    note:             r.note,
    location:         r.location,
    pseukim:          r.pseukim,
    coversAliyahId:   r.covers_aliyah_id,
  };
}

export function mapWeekdayAliyahRow(r: RawWeekdayAliyahRow): MappedWeekdayAliyah {
  const today    = getTodayStr();
  const allDates = r.all_dates ? r.all_dates.split(',') : [];
  const dateRead = allDates[0] ?? '';
  return {
    id: r.id,
    parshaId: r.parsha_id,
    aliyahNum: r.aliyah_num,
    parsha: r.parsha,
    parshaEn: r.parsha_en,
    sefer: r.sefer,
    seferEn: r.sefer_en,
    seferColor: r.sefer_color,
    pseukim: r.pseukim,
    chapterStart: r.chapter_start,
    verseStart: r.verse_start,
    chapterEnd: r.chapter_end,
    verseEnd: r.verse_end,
    coversAliyahId: r.covers_aliyah_id,
    dateRead,
    allDates,
    readingId: r.reading_id,
    isReadPast:   dateRead !== '' && dateRead <= today,
    isReadFuture: dateRead !== '' && dateRead >  today,
    hasFuture:    dateRead !== '' && dateRead <= today && allDates.some(d => d > today),
    partialOrig: '', isCoveredPast: false,
    location: r.location,
    note: r.note,
  };
}

export function mapHosafahRow(r: RawHosafahRow): MappedHosafah {
  const today = getTodayStr();
  return {
    id: r.id,
    sefer: r.sefer,
    parshaId1: r.parsha_id_1,
    parshaId2: r.parsha_id_2,
    occasionId: r.occasion_id,
    isDoubleParsha: Boolean(r.is_double_parsha),
    chapterStart: r.chapter_start,
    verseStart: r.verse_start,
    chapterEnd: r.chapter_end,
    verseEnd: r.verse_end,
    pseukim: r.pseukim,
    dateRead: r.date_read,
    note: r.note,
    location: r.location,
    parsha1: r.parsha1,
    parsha1En: r.parsha1_en,
    parsha2: r.parsha2,
    parsha2En: r.parsha2_en,
    occasion: r.occasion,
    occasionEn: r.occasion_en,
    isReadPast:   r.date_read !== '' && r.date_read <= today,
    isReadFuture: r.date_read !== '' && r.date_read >  today,
    partialOrig: '',
  };
}

export function mapWeekdayReadingRow(r: RawWeekdayReadingRow): WeekdayReadingRecord {
  return {
    id: r.id,
    weekdayAliyahId: r.weekday_aliyah_id,
    parshaId: r.parsha_id,
    parsha: r.parsha,
    parshaEn: r.parsha_en,
    sefer: r.sefer,
    dateRead: r.date_read,
    note: r.note,
    location: r.location,
  };
}

export {
  fetchCanWrite,
  fetchMeta,
  fetchAliyot,
  fetchReadings,
  fetchLocationStats,
  fetchHebcal,
  postReading,
  putReading,
  deleteReading,
  fetchOccasions,
  fetchOccasionAliyot,
  fetchSpecialReadings,
  postSpecialReading,
  deleteSpecialReading,
  fetchWeekdayAliyot,
  postWeekdayReading,
  putWeekdayReading,
  deleteWeekdayReading,
} from './db/index.js';
