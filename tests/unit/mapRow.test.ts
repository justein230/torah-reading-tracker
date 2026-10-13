import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mapRow, enrichRows, deriveReadState } from '../../src/api.js';

// ── mapRow ────────────────────────────────────────────────────────────────────

const BASE = {
  sefer: 'בְּרֵאשִׁית', parsha: 'בְּרֵאשִׁית', aliyah: 1,
  pseukim: 50, pct: 1.5,
  orig: '', fut: '', occasion: '', location: '', reread_count: 0,
};

// The one place the past / future / today / unread rules are tested; every mapper derives its
// flags through deriveReadState, and tests/unit/mappers.test.ts checks each one passes the right date.
describe('deriveReadState', () => {
  it.each([
    ['unread',            '',           { isRead: false, isReadPast: false, isReadFuture: false }],
    ['a past date',       '2024-12-31', { isRead: true,  isReadPast: true,  isReadFuture: false }],
    ['today (counts as past)', '2025-01-01', { isRead: true, isReadPast: true, isReadFuture: false }],
    ['a future date',     '2025-01-02', { isRead: true,  isReadPast: false, isReadFuture: true }],
  ])('%s', (_label, date, expected) => {
    expect(deriveReadState(date, '2025-01-01')).toEqual(expected);
  });
});

describe('mapRow — read dates', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2025-01-01T12:00:00')); });
  afterEach(() => { vi.useRealTimers(); });

  it.each([
    ['unread',      '',           null, false],
    ['a past date', '2023-03-15', 2023, false],
    ['today',       '2025-01-01', 2025, false],
    ['a future date', '2025-06-01', 2025, true],
  ])('%s → yearRead %s, isFuture %s', (_label, orig, yearRead, isFuture) => {
    const r = mapRow({ ...BASE, orig });
    expect(r).toMatchObject({ isRead: orig !== '', isReadFuture: isFuture, isFuture, yearRead });
    expect(r.futDates).toEqual([]);
    expect(r.hasFuture).toBe(false);
  });
});

describe('mapRow — projection', () => {
  it('passes through pseukim, pct, rereadCount and directOrig', () => {
    const r = mapRow({ ...BASE, pseukim: 42, pct: 2.5, reread_count: 3, direct_orig: '2023-03-15' });
    expect(r).toMatchObject({ pseukim: 42, pct: 2.5, rereadCount: 3, directOrig: '2023-03-15', isReread: false });
  });

  it('defaults directOrig to empty when absent', () => {
    expect(mapRow(BASE).directOrig).toBe('');
  });
});

describe('mapRow — future re-reads (fut field)', () => {
  it('parses comma-separated future re-read dates', () => {
    const r = mapRow({ ...BASE, orig: '2023-01-01', fut: '2025-03-01,2026-04-15' });
    expect(r.hasFuture).toBe(true);
    expect(r.futDates).toEqual(['2025-03-01', '2026-04-15']);
    expect(r.futureYear).toBe(2025);
  });

  it('hasFuture is false when fut is empty string', () => {
    const r = mapRow({ ...BASE, orig: '2023-01-01', fut: '' });
    expect(r.hasFuture).toBe(false);
    expect(r.futureYear).toBeNull();
  });
});

describe('mapRow — year attribution near Jan 1', () => {
  it('does not misattribute a Jan 1 reading to the prior year (regression: yearRead used new Date(orig).getFullYear(), which parses the date-only string as UTC and can roll back a day in negative-UTC-offset timezones)', () => {
    const r = mapRow({ ...BASE, orig: '2025-01-01', fut: '2026-01-01' });
    expect(r.yearRead).toBe(2025);
    expect(r.futureYear).toBe(2026);
  });
});

describe('mapRow — allYears', () => {
  it.each([
    ['deduplicates when yearRead equals futureYear', '2025-06-01', '2025-09-15', [2025]],
    ['includes both years when different',           '2023-06-01', '2025-09-15', [2023, 2025]],
    ['is empty when unread with no future dates',    '',           '',           []],
  ])('%s', (_label, orig, fut, expected) => {
    expect(mapRow({ ...BASE, orig, fut }).allYears).toEqual(expected);
  });
});

describe('mapRow — occasion and location', () => {
  it('passes them through, defaulting to empty string when absent', () => {
    expect(mapRow({ ...BASE, occasion: 'Bar Mitzvah', location: 'Shul' })).toMatchObject({ occasion: 'Bar Mitzvah', location: 'Shul' });
    expect(mapRow(BASE)).toMatchObject({ occasion: '', location: '' });
  });
});

// ── mapRow — double-parsha fields ─────────────────────────────────────────────

describe('mapRow — double-parsha fields', () => {
  it('maps pair_name, pair_name_en and combined_aliyah through', () => {
    const r = mapRow({ ...BASE, pair_name: 'וַיַּקְהֵל-פְקוּדֵי', pair_name_en: 'Vayakhel-Pekudei', combined_aliyah: 3 });
    expect(r).toMatchObject({ pairName: 'וַיַּקְהֵל-פְקוּדֵי', pairNameEn: 'Vayakhel-Pekudei', combinedAliyah: 3 });
  });

  it('defaults them to empty strings / null when absent', () => {
    expect(mapRow(BASE)).toMatchObject({ pairName: '', pairNameEn: '', combinedAliyah: null });
  });
});

// ── mapRow — partialOrig ──────────────────────────────────────────────────────

describe('mapRow — partialOrig', () => {
  it('always returns empty string — partialOrig is computed by enrichPartialOrig, not mapRow', () => {
    expect(mapRow(BASE).partialOrig).toBe('');
    expect(mapRow({ ...BASE, orig: '2024-01-01' }).partialOrig).toBe('');
  });
});

// ── enrichRows ────────────────────────────────────────────────────────────────

describe('enrichRows', () => {
  it('sets parshaPct proportional to pseukim within the parsha', () => {
    const rows = enrichRows([
      mapRow({ ...BASE, parsha: 'א', aliyah: 1, pseukim: 30, orig: '', fut: '' }),
      mapRow({ ...BASE, parsha: 'א', aliyah: 2, pseukim: 70, orig: '', fut: '' }),
    ]);
    expect(rows[0]!.parshaPct).toBeCloseTo(30);
    expect(rows[1]!.parshaPct).toBeCloseTo(70);
  });

  it('returns 100% for a single-aliyah parsha', () => {
    const rows = enrichRows([
      mapRow({ ...BASE, parsha: 'solo', pseukim: 50, orig: '', fut: '' }),
    ]);
    expect(rows[0]!.parshaPct).toBeCloseTo(100);
  });

  it('keeps rows from different parshiot independent', () => {
    const rows = enrichRows([
      mapRow({ ...BASE, parsha: 'א', aliyah: 1, pseukim: 60, orig: '', fut: '' }),
      mapRow({ ...BASE, parsha: 'ב', aliyah: 1, pseukim: 40, orig: '', fut: '' }),
    ]);
    expect(rows[0]!.parshaPct).toBeCloseTo(100);
    expect(rows[1]!.parshaPct).toBeCloseTo(100);
  });
});
