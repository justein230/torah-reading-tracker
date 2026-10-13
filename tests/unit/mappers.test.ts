import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mapOccasionAliyahRow, mapSpecialReadingRow, mapWeekdayAliyahRow, mapHosafahRow,
} from '../../src/api.js';

// ── mapOccasionAliyahRow ────────────────────────────────────────────────────

const OCCASION_BASE = {
  id: 1, occasion_id: 10, occasion: 'Pesach', occasion_en: 'Passover',
  category: 'Holiday', aliyah_key: 'P1', is_shabbat_variant: false,
  parsha_id: 5, parsha: 'בא', parsha_en: 'Bo',
  sefer: 'שמות', sefer_en: 'Exodus', sefer_color: '#fff',
  pseukim: 12, chapter_start: 1, verse_start: 1, chapter_end: 2, verse_end: 5,
  covers_aliyah_id: null, orig: '', all_dates: '', read_count: 0,
};

// Every mapper derives isReadPast / isReadFuture with deriveReadState (tested in mapRow.test.ts);
// this table only checks that each one feeds it the right date field.
describe('read state is derived from each record kind’s own date field', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2025-01-01T12:00:00')); });
  afterEach(() => { vi.useRealTimers(); });

  const mappers = {
    occasion: (date: string) => mapOccasionAliyahRow({ ...OCCASION_BASE, orig: date }),
    weekday:  (date: string) => mapWeekdayAliyahRow({ ...WEEKDAY_BASE, all_dates: date }),
    hosafah:  (date: string) => mapHosafahRow({ ...HOSAFAH_BASE, date_read: date }),
  };

  it.each(Object.keys(mappers) as (keyof typeof mappers)[])('%s', kind => {
    const map = mappers[kind];
    expect(map('')).toMatchObject({ isReadPast: false, isReadFuture: false });
    expect(map('2023-01-01')).toMatchObject({ isReadPast: true, isReadFuture: false });
    expect(map('2025-01-01')).toMatchObject({ isReadPast: true, isReadFuture: false });
    expect(map('2025-06-01')).toMatchObject({ isReadPast: false, isReadFuture: true });
  });
});

describe('mapOccasionAliyahRow — hasFuture re-reads', () => {
  it.each([
    ['a past orig and a future date',         '2023-01-01', '2023-01-01,2099-01-01', true],
    ['unread, even with a future date',       '',           '2099-01-01',            false],
    ['only past dates',                       '2020-01-01', '2020-01-01,2021-01-01', false],
  ])('%s → %s', (_label, orig, all_dates, expected) => {
    const r = mapOccasionAliyahRow({ ...OCCASION_BASE, orig, all_dates });
    expect(r.hasFuture).toBe(expected);
    expect(r.allDates).toEqual(all_dates.split(','));
  });
});

describe('mapOccasionAliyahRow — flags and projection', () => {
  it('coerces is_shabbat_variant to boolean', () => {
    expect(mapOccasionAliyahRow({ ...OCCASION_BASE, is_shabbat_variant: 1 as unknown as boolean }).isShabbatVariant).toBe(true);
    expect(mapOccasionAliyahRow({ ...OCCASION_BASE, is_shabbat_variant: 0 as unknown as boolean }).isShabbatVariant).toBe(false);
  });

  it('maps snake_case fields to camelCase', () => {
    const r = mapOccasionAliyahRow(OCCASION_BASE);
    expect(r.occasionId).toBe(10);
    expect(r.occasionEn).toBe('Passover');
    expect(r.aliyahKey).toBe('P1');
    expect(r.parshaId).toBe(5);
    expect(r.parshaEn).toBe('Bo');
    expect(r.seferEn).toBe('Exodus');
    expect(r.seferColor).toBe('#fff');
    expect(r.coversAliyahId).toBeNull();
    expect(r.readCount).toBe(0);
  });

  it('defaults readCount to 0 when read_count is absent', () => {
    const { read_count: _read_count, ...rest } = OCCASION_BASE;
    expect(mapOccasionAliyahRow(rest as typeof OCCASION_BASE).readCount).toBe(0);
  });
});

// ── mapWeekdayAliyahRow ──────────────────────────────────────────────────────

const WEEKDAY_BASE = {
  id: 1, parsha_id: 3, aliyah_num: 2, parsha: 'נח', parsha_en: 'Noach',
  sefer: 'בראשית', sefer_en: 'Genesis', sefer_color: '#abc',
  pseukim: 8, chapter_start: 6, verse_start: 1, chapter_end: 6, verse_end: 8,
  covers_aliyah_id: null, all_dates: '', reading_id: 0, location: '', note: '',
};

describe('mapWeekdayAliyahRow — dates', () => {
  it('derives an empty dateRead and no flags when all_dates is empty', () => {
    expect(mapWeekdayAliyahRow(WEEKDAY_BASE)).toMatchObject({ dateRead: '', allDates: [], hasFuture: false });
  });

  it('takes dateRead from the first date; hasFuture when a later one is ahead', () => {
    const r = mapWeekdayAliyahRow({ ...WEEKDAY_BASE, all_dates: '2023-01-01,2099-01-01' });
    expect(r).toMatchObject({ dateRead: '2023-01-01', hasFuture: true });
  });
});

describe('mapWeekdayAliyahRow — projection', () => {
  it('maps snake_case fields to camelCase', () => {
    const r = mapWeekdayAliyahRow(WEEKDAY_BASE);
    expect(r.parshaId).toBe(3);
    expect(r.aliyahNum).toBe(2);
    expect(r.parshaEn).toBe('Noach');
    expect(r.seferEn).toBe('Genesis');
    expect(r.seferColor).toBe('#abc');
    expect(r.readingId).toBe(0);
  });
});

// ── mapHosafahRow ─────────────────────────────────────────────────────────────

const HOSAFAH_BASE = {
  id: 1, sefer: 'במדבר', parsha_id_1: 1, parsha_id_2: 2, occasion_id: null,
  is_double_parsha: 0, chapter_start: 1, verse_start: 1, chapter_end: 1, verse_end: 10,
  pseukim: 10, date_read: '', note: '', location: '',
  parsha1: 'מטות', parsha1_en: 'Matot', parsha2: 'מסעי', parsha2_en: "Masei",
  occasion: '', occasion_en: '',
};

describe('mapHosafahRow — flags and projection', () => {
  it('coerces is_double_parsha to boolean', () => {
    expect(mapHosafahRow({ ...HOSAFAH_BASE, is_double_parsha: 1 }).isDoubleParsha).toBe(true);
    expect(mapHosafahRow({ ...HOSAFAH_BASE, is_double_parsha: 0 }).isDoubleParsha).toBe(false);
  });

  it('maps both parsha fields and occasion fields through', () => {
    const r = mapHosafahRow(HOSAFAH_BASE);
    expect(r.parshaId1).toBe(1);
    expect(r.parshaId2).toBe(2);
    expect(r.parsha1).toBe('מטות');
    expect(r.parsha2En).toBe('Masei');
  });
});

// ── mapSpecialReadingRow — projection only ──────────────────────────────────

describe('mapSpecialReadingRow', () => {
  it('maps snake_case fields to camelCase', () => {
    const r = mapSpecialReadingRow({
      id: 1, occasion_aliyah_id: 2, occasion_id: 3, occasion: 'Sukkot', occasion_en: 'Sukkot',
      category: 'Holiday', aliyah_key: 'S1', is_shabbat_variant: 1 as unknown as boolean,
      parsha: '', parsha_en: '', date_read: '2024-10-01', note: 'n', location: 'loc',
      pseukim: 5, covers_aliyah_id: null,
    });
    expect(r.occasionAliyahId).toBe(2);
    expect(r.occasionId).toBe(3);
    expect(r.isShabbatVariant).toBe(true);
    expect(r.dateRead).toBe('2024-10-01');
    expect(r.coversAliyahId).toBeNull();
  });
});

