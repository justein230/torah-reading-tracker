import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah } from '../types/index.js';

/**
 * A hypothetical future reading the user is considering scheduling, identified
 * by the same key used to look up its base row (see rowKey/occasionKey/etc below).
 */
export interface WhatIfPick {
  kind: 'standard' | 'occasion' | 'weekday' | 'hosafah';
  key: string;
  date: string; /* YYYY-MM-DD, expected to be strictly after today */
}

export function standardRowKey(r: { parsha: string; aliyah: string | number }): string {
  return `${r.parsha}|${r.aliyah}`;
}

/**
 * Returns a copy of a standard MappedRow as if it had been read on `date`
 * (a future date), re-deriving the same fields mapRow() would set from `orig`.
 */
export function withHypotheticalRowDate(r: MappedRow, date: string): MappedRow {
  const yearRead = new Date(date).getFullYear();
  return {
    ...r,
    orig: date,
    isRead: true,
    isReadPast: false,
    isReadFuture: true,
    yearRead,
    allYears: [...new Set([...r.allYears, yearRead])],
  };
}

/**
 * Reverts a standard row that is currently scheduled for a future date back to
 * unread, as if it had never been scheduled. Used when a real future-scheduled
 * row is deliberately left out of a what-if pick list (the user "un-scheduled" it
 * in the preview).
 */
export function revertRow(r: MappedRow): MappedRow {
  return {
    ...r,
    orig: '',
    isRead: false,
    isReadPast: false,
    isReadFuture: false,
    yearRead: null,
    allYears: r.futureYear === null ? [] : [r.futureYear],
  };
}

export function withHypotheticalOccasionDate(oa: MappedOccasionAliyah, date: string): MappedOccasionAliyah {
  return { ...oa, orig: date, isRead: true, isReadPast: false, isReadFuture: true };
}

export function withHypotheticalWeekdayDate(wa: MappedWeekdayAliyah, date: string): MappedWeekdayAliyah {
  return { ...wa, dateRead: date, isReadPast: false, isReadFuture: true };
}

export function withHypotheticalHosafahDate(hr: MappedHosafah, date: string): MappedHosafah {
  return { ...hr, dateRead: date, isReadPast: false, isReadFuture: true };
}

/* Inverses of the withHypothetical* helpers: revert a future-scheduled special reading back to
   unread, used when a real future reading is deliberately left out of a what-if pick list (the
   user "un-scheduled" it in the preview). Mirrors revertRow for standard aliyot. */
export function revertOccasion(oa: MappedOccasionAliyah): MappedOccasionAliyah {
  return { ...oa, orig: '', isRead: false, isReadPast: false, isReadFuture: false };
}

export function revertWeekday(wa: MappedWeekdayAliyah): MappedWeekdayAliyah {
  return { ...wa, dateRead: '', isReadPast: false, isReadFuture: false };
}

export function revertHosafah(hr: MappedHosafah): MappedHosafah {
  return { ...hr, dateRead: '', isReadPast: false, isReadFuture: false };
}

export interface WhatIfArrays {
  allRows: MappedRow[];
  occasionAliyot: MappedOccasionAliyah[];
  weekdayAliyot: MappedWeekdayAliyah[];
  hosafotReadings: MappedHosafah[];
}

/**
 * Merges a set of hypothetical picks into the real row arrays, without mutating
 * them or touching the database. The result can be fed straight into
 * computeStats()/computeRing() to preview the resulting committed percentage.
 *
 * Every kind is treated as the *complete* set of future-scheduled readings for the
 * preview: any row (standard, occasion, weekday, or hosafah) that is really scheduled
 * for a future date but has no matching pick is reverted to unread (see revertRow /
 * revertOccasion / revertWeekday / revertHosafah). This lets a caller seed picks from
 * all real future-scheduled readings and let the user remove entries to preview
 * un-scheduling them. Past-read rows are never touched.
 */
export function applyWhatIfPicks(
  allRows: MappedRow[],
  occasionAliyot: MappedOccasionAliyah[],
  weekdayAliyot: MappedWeekdayAliyah[],
  hosafotReadings: MappedHosafah[],
  picks: WhatIfPick[],
): WhatIfArrays {
  const dateByKey: Record<WhatIfPick['kind'], Map<string, string>> = {
    standard: new Map(), occasion: new Map(), weekday: new Map(), hosafah: new Map(),
  };
  for (const p of picks) dateByKey[p.kind].set(p.key, p.date);

  return {
    allRows: allRows.map(r => {
      const date = dateByKey.standard.get(standardRowKey(r));
      if (date) return withHypotheticalRowDate(r, date);
      return r.isReadFuture ? revertRow(r) : r;
    }),
    occasionAliyot: occasionAliyot.map(oa => {
      const date = dateByKey.occasion.get(String(oa.id));
      if (date) return withHypotheticalOccasionDate(oa, date);
      return oa.isReadFuture ? revertOccasion(oa) : oa;
    }),
    weekdayAliyot: weekdayAliyot.map(wa => {
      const date = dateByKey.weekday.get(String(wa.id));
      if (date) return withHypotheticalWeekdayDate(wa, date);
      return wa.isReadFuture ? revertWeekday(wa) : wa;
    }),
    hosafotReadings: hosafotReadings.map(hr => {
      const date = dateByKey.hosafah.get(String(hr.id));
      if (date) return withHypotheticalHosafahDate(hr, date);
      return hr.isReadFuture ? revertHosafah(hr) : hr;
    }),
  };
}
