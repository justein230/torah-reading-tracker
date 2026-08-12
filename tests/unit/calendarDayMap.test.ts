import { describe, it, expect } from 'vitest';
import { buildDayMap } from '../../src/components/Calendar.js';
import type {
  MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah, Filters,
} from '../../src/types/index.js';

// buildDayMap reads only a handful of fields per source; partial fixtures keep the
// tests focused on the aggregation logic rather than every mapped field.
const PAST   = '2023-04-10'; // well before any plausible test-run date
const FUTURE = '2099-04-10'; // well after
const PAST2  = '2024-04-10';

function filters(over: Partial<Filters> = {}): Filters {
  return { sefarim: [], years: [], includeFutureDates: false, pctMode: '', showHolidayRing: false, showWeekdayRing: false, ...over };
}

const stdRow = (o: Partial<MappedRow> = {}): MappedRow => ({
  sefer: 'שמות', parsha: 'בא', aliyah: 1, pseukim: 10,
  orig: PAST, isRead: true, isFuture: false, hasFuture: false, futDates: [], yearRead: 2023, ...o,
} as unknown as MappedRow);

const occ = (o: Partial<MappedOccasionAliyah> = {}): MappedOccasionAliyah => ({
  sefer: 'שמות', parsha: 'בא', aliyahKey: '1', pseukim: 8, occasion: 'Pesach',
  orig: PAST, allDates: [PAST], isRead: true, ...o,
} as unknown as MappedOccasionAliyah);

const wkd = (o: Partial<MappedWeekdayAliyah> = {}): MappedWeekdayAliyah => ({
  sefer: 'שמות', parsha: 'בא', aliyahNum: 1, pseukim: 4, dateRead: PAST, allDates: [PAST], ...o,
} as unknown as MappedWeekdayAliyah);

const hos = (o: Partial<MappedHosafah> = {}): MappedHosafah => ({
  sefer: 'שמות', parsha1: 'בא', parsha2: null, pseukim: 3, dateRead: PAST, occasion: null, ...o,
} as unknown as MappedHosafah);

describe('buildDayMap — source aggregation', () => {
  it('includes standard, occasion, weekday, and hosafah readings on their dates', () => {
    const map = buildDayMap([stdRow()], [occ()], [wkd()], [hos()], filters());
    const kinds = (map[PAST] ?? []).map(e => e.kind).sort();
    expect(kinds).toEqual(['hosafah', 'occasion', 'standard', 'weekday']);
  });

  it('tags each entry with its source kind and display fields', () => {
    const map = buildDayMap([], [occ({ aliyahKey: 'M' })], [], [], filters());
    expect(map[PAST]).toEqual([
      expect.objectContaining({ kind: 'occasion', aliyah: 'M', parsha: 'בא', pseukim: 8, isReread: false, isFuture: false }),
    ]);
  });

  it('joins a double-parsha hosafah name', () => {
    const map = buildDayMap([], [], [], [hos({ parsha2: 'בשלח' })], filters());
    expect(map[PAST]?.[0]?.parsha).toBe('בא־בשלח');
  });

  it('skips occasion aliyot that were never read', () => {
    const map = buildDayMap([], [occ({ isRead: false, allDates: [], orig: '' })], [], [], filters());
    expect(map[PAST]).toBeUndefined();
  });
});

describe('buildDayMap — reread and future handling', () => {
  it('marks the earliest date as the original and later dates as rereads', () => {
    const map = buildDayMap([], [occ({ allDates: [PAST2, PAST] })], [], [], filters());
    expect(map[PAST]?.[0]?.isReread).toBe(false);
    expect(map[PAST2]?.[0]?.isReread).toBe(true);
  });

  it('hides future dates unless includeFutureDates is on', () => {
    const off = buildDayMap([], [occ({ allDates: [PAST, FUTURE] })], [], [], filters());
    expect(off[FUTURE]).toBeUndefined();
    const on = buildDayMap([], [occ({ allDates: [PAST, FUTURE] })], [], [], filters({ includeFutureDates: true }));
    expect(on[FUTURE]?.[0]).toMatchObject({ isFuture: true, isReread: true });
  });

  // A standard aliyah carries its scheduled re-readings in futDates rather than allDates,
  // so it takes a separate path through addStandardRow than the other three sources.
  it('places a standard row on both its original date and its scheduled future dates', () => {
    const row = stdRow({ hasFuture: true, futDates: [FUTURE] });
    const map = buildDayMap([row], [], [], [], filters({ includeFutureDates: true }));

    expect(map[PAST]?.[0]).toMatchObject({ isReread: false, isFuture: false });
    expect(map[FUTURE]?.[0]).toMatchObject({ isReread: true, isFuture: true });
  });

  it('drops a standard row future date when includeFutureDates is off', () => {
    const row = stdRow({ hasFuture: true, futDates: [FUTURE] });
    const map = buildDayMap([row], [], [], [], filters());

    expect(map[PAST]).toBeDefined();
    expect(map[FUTURE]).toBeUndefined();
  });

  it('applies the year filter to a standard row future date', () => {
    const row = stdRow({ hasFuture: true, futDates: [FUTURE] });
    const map = buildDayMap([row], [], [], [], filters({ includeFutureDates: true, years: [2023] }));

    expect(map[PAST]).toBeDefined();          // 2023 — kept
    expect(map[FUTURE]).toBeUndefined();      // 2099 — filtered out
  });
});

describe('buildDayMap — filters', () => {
  it('filters every source by sefer', () => {
    const map = buildDayMap([stdRow()], [occ()], [wkd()], [hos()], filters({ sefarim: ['בראשית'] }));
    expect(map[PAST]).toBeUndefined();
  });

  it('filters by year across sources', () => {
    const map = buildDayMap([stdRow()], [occ()], [], [], filters({ years: [2099] }));
    expect(map[PAST]).toBeUndefined();
  });
});
