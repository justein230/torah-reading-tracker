import { describe, it, expect } from 'vitest';
import { computeStats, estimateCompletion, countPseukim, computeRing, effectivePseukimOf, committedPseukimOf, remainingPseukim, isAliyahRead, isAliyahPartial, countReadAliyot, computePairTotalPseukim, computePairReadPseukim } from '../../src/compute.js';
import type { MappedRow, MappedOccasionAliyah, MappedHosafah, Filters } from '../../src/types/index.js';

// ── shared fixtures ───────────────────────────────────────────────────────────

const SEFER_ORDER = ['Genesis', 'Exodus'];
const GENESIS_CV = [
  31,25,24,26,32,22,24,22,29,32, // ch1-10
  32,20,18,24,21,16,27,33,38,18, // ch11-20
  34,24,20,67,34,35,46,22,35,43, // ch21-30
  54,33,20,31,29,43,36,30,23,23, // ch31-40
  57,38,34,34,28,34,31,22,33,26, // ch41-50
];
const SEFER_MAP = {
  Genesis: { en: 'Genesis', color: '#000', chapterVerses: GENESIS_CV },
  Exodus:  { en: 'Exodus',  color: '#111', chapterVerses: [] },
};
const NO_FILTERS: Filters = { sefarim: [], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false };

function makeRow(overrides: Partial<MappedRow> = {}): MappedRow {
  const aliyah  = overrides.aliyah  ?? 1;
  const pseukim = overrides.pseukim ?? 100;
  const chapter = Number(aliyah);
  return {
    sefer: 'Genesis', parsha: 'Bereishit', aliyah, pairName: '', pairNameEn: '', combinedAliyah: null, pseukim, pct: 1,
    // Each aliyah gets its own chapter by default so rows in the same sefer don't overlap.
    // Explicit chapterStart/verseStart/chapterEnd/verseEnd overrides win via the spread below.
    chapterStart: chapter, verseStart: 1, chapterEnd: chapter, verseEnd: pseukim,
    isRead: false, isReadPast: false, isReadFuture: false, isFuture: false, isReread: false,
    hasFuture: false, yearRead: null, futureYear: null, allYears: [],
    orig: '', directOrig: '', readAsDouble: false, partialOrig: '', futDates: [], occasion: '', location: '', rereadCount: 0,
    ...overrides,
  };
}

// ── computeStats ──────────────────────────────────────────────────────────────

describe('computeStats — empty input', () => {
  it('returns all zeros for empty rows', () => {
    const s = computeStats([], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.totalAliyot).toBe(0);
    expect(s.readAliyot).toBe(0);
    expect(s.totalPseukim).toBe(0);
    expect(s.readPseukim).toBe(0);
    expect(s.rereadCount).toBe(0);
  });
});

describe('computeStats — unread aliyot', () => {
  it('counts totals but nothing in read', () => {
    const rows = [makeRow({ pseukim: 50 }), makeRow({ aliyah: 2, pseukim: 60 })];
    const s = computeStats(rows, [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.totalAliyot).toBe(2);
    expect(s.totalPseukim).toBe(110);
    expect(s.readAliyot).toBe(0);
    expect(s.readPseukim).toBe(0);
    expect(s.rereadCount).toBe(0);
  });
});

describe('computeStats — sefer filter', () => {
  it('excludes aliyot from filtered-out sefarim', () => {
    const rows = [
      makeRow({ sefer: 'Genesis', pseukim: 100, isReadPast: true, isRead: true, yearRead: 2023, allYears: [2023] }),
      makeRow({ sefer: 'Exodus',  pseukim: 80,  isReadPast: true, isRead: true, yearRead: 2023, allYears: [2023] }),
    ];
    const s = computeStats(rows, [], SEFER_ORDER, SEFER_MAP, { ...NO_FILTERS, sefarim: ['Genesis'] });
    expect(s.totalAliyot).toBe(1);
    expect(s.readAliyot).toBe(1);
    expect(s.readPseukim).toBe(100);
  });
});

describe('computeStats — year filter', () => {
  it('excludes readings from other years', () => {
    const rows = [
      makeRow({ isReadPast: true, isRead: true, yearRead: 2022, allYears: [2022], pseukim: 50 }),
      makeRow({ aliyah: 2, isReadPast: true, isRead: true, yearRead: 2023, allYears: [2023], pseukim: 70 }),
    ];
    const s = computeStats(rows, [], SEFER_ORDER, SEFER_MAP, { ...NO_FILTERS, years: [2023] });
    expect(s.readAliyot).toBe(1);
    expect(s.readPseukim).toBe(70);
  });
});

describe('computeStats — includeFutureDates', () => {
  it('excludes future readings when flag is false', () => {
    const rows = [makeRow({ isReadFuture: true, isRead: true, yearRead: 2026, allYears: [2026] })];
    const s = computeStats(rows, [], SEFER_ORDER, SEFER_MAP, { ...NO_FILTERS, includeFutureDates: false });
    expect(s.readAliyot).toBe(0);
  });
});

describe('computeStats — rereadCount', () => {
  it('sums rereadCount from rows', () => {
    const rows = [
      makeRow({ isReadPast: true, isRead: true, yearRead: 2023, allYears: [2023], rereadCount: 2 }),
      makeRow({ aliyah: 2, isReadPast: true, isRead: true, yearRead: 2023, allYears: [2023], rereadCount: 1 }),
    ];
    const s = computeStats(rows, [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.rereadCount).toBe(3);
  });
});

describe('computeStats — byYear chart data', () => {
  it('adds read past rows to byYear', () => {
    const rows = [
      makeRow({ isReadPast: true, isRead: true, yearRead: 2023, allYears: [2023], pseukim: 50 }),
    ];
    const s = computeStats(rows, [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.byYear[2023]).toBeDefined();
    expect(s.byYear[2023]!.aliyot).toBe(1);
  });

  it('adds future rows to byYearFuture', () => {
    const rows = [
      makeRow({ isReadFuture: true, isRead: true, yearRead: 2026, allYears: [2026], pseukim: 50 }),
    ];
    const s = computeStats(rows, [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.byYearFuture[2026]).toBeDefined();
    expect(s.byYearFuture[2026]!.aliyot).toBe(1);
  });
});

describe('computeStats — byYear newPseukim / newAliyot', () => {
  it('newPseukim and newAliyot match raw counts when there is no verse overlap', () => {
    // Two non-overlapping aliyot in different years — unique = raw
    const rows = [
      makeRow({ aliyah: 1, pseukim: 10, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10,
                isReadPast: true, isRead: true, yearRead: 2023, allYears: [2023] }),
      makeRow({ aliyah: 2, pseukim: 8,  chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 8,
                isReadPast: true, isRead: true, yearRead: 2024, allYears: [2024] }),
    ];
    const s = computeStats(rows, [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.byYear[2023]?.newPseukim).toBe(10);
    expect(s.byYear[2024]?.newPseukim).toBe(8);
    expect(s.byYear[2023]?.newAliyot).toBe(1);
    expect(s.byYear[2024]?.newAliyot).toBe(1);
  });

  it('newPseukim and uniquePseukim deduplicate overlapping aliyot in the same year; pseukim stays raw', () => {
    // aliyah7: ch7:v1–v30 (30 pseukim); maftir: ch7:v21–v30 (10 pseukim, strict subset)
    const aliyah7 = makeRow({ aliyah: 7, pseukim: 30, chapterStart: 7, verseStart: 1,  chapterEnd: 7, verseEnd: 30,
                              isReadPast: true, isRead: true, yearRead: 2024, allYears: [2024] });
    const maftir  = makeRow({ aliyah: 8, pseukim: 10, chapterStart: 7, verseStart: 21, chapterEnd: 7, verseEnd: 30,
                              isReadPast: true, isRead: true, yearRead: 2024, allYears: [2024] });
    const s = computeStats([aliyah7, maftir], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.byYear[2024]?.pseukim).toBe(40);        // raw: 30 + 10
    expect(s.byYear[2024]?.newPseukim).toBe(30);     // globally deduped: maftir's 10 overlap aliyah7
    expect(s.byYear[2024]?.uniquePseukim).toBe(30);  // within-year deduped: same result, maftir doesn't add
    expect(s.byYear[2024]?.newAliyot).toBe(2);       // both aliyot are first-reads
  });

  it('newPseukim attributes overlapping verses to the earlier year', () => {
    // Two separate aliyot covering identical verse ranges in different years (e.g. regular vs double-parsha)
    const row2023 = makeRow({ aliyah: 1, pseukim: 10, chapterStart: 5, verseStart: 1, chapterEnd: 5, verseEnd: 10,
                              isReadPast: true, isRead: true, yearRead: 2023, allYears: [2023] });
    const row2024 = makeRow({ aliyah: 2, pseukim: 10, chapterStart: 5, verseStart: 1, chapterEnd: 5, verseEnd: 10,
                              isReadPast: true, isRead: true, yearRead: 2024, allYears: [2024] });
    const s = computeStats([row2023, row2024], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.byYear[2023]?.newPseukim).toBe(10); // earlier year claims all new pseukim
    expect(s.byYear[2024]?.newPseukim).toBe(0);  // later year: already seen, contributes 0
    expect(s.byYear[2023]?.pseukim).toBe(10);    // raw still counts both
    expect(s.byYear[2024]?.pseukim).toBe(10);
  });

  it('uniquePseukim counts re-reads per year; newPseukim does not', () => {
    // One aliyah read in 2023 with a re-read in 2025 (additional reading)
    const row = makeRow({ aliyah: 1, pseukim: 10, chapterStart: 3, verseStart: 1, chapterEnd: 3, verseEnd: 10,
                          isReadPast: true, isRead: true, yearRead: 2023, allYears: [2023, 2025],
                          hasFuture: true, futDates: ['2025-06-01'] });
    const s = computeStats([row], [], SEFER_ORDER, SEFER_MAP, { ...NO_FILTERS, includeFutureDates: true });
    // raw aliyot includes re-read year
    expect(s.byYear[2023]?.aliyot).toBe(1);
    expect(s.byYear[2025]?.aliyot).toBe(1);
    // newAliyot/newPseukim: first-read year only
    expect(s.byYear[2023]?.newAliyot).toBe(1);
    expect(s.byYear[2025]?.newAliyot).toBe(0);
    expect(s.byYear[2023]?.newPseukim).toBe(10);
    expect(s.byYear[2025]?.newPseukim).toBe(0);   // globally deduped: already seen in 2023
    // uniquePseukim: counts again in re-read year (within-year dedup only)
    expect(s.byYear[2023]?.uniquePseukim).toBe(10);
    expect(s.byYear[2025]?.uniquePseukim).toBe(10); // re-read year counts its own pseukim
  });

  it('bySef uniquePseukim deduplicates overlapping maftir within the same sefer/year; bySef.pseukim stays raw', () => {
    // Same setup as the year-level maftir test above, but checking the per-sefer breakdown
    // used by the chart tooltip (this is the bug: chart was reading raw bySef.pseukim).
    const aliyah7 = makeRow({ aliyah: 7, pseukim: 30, chapterStart: 7, verseStart: 1,  chapterEnd: 7, verseEnd: 30,
                              isReadPast: true, isRead: true, yearRead: 2024, allYears: [2024] });
    const maftir  = makeRow({ aliyah: 8, pseukim: 10, chapterStart: 7, verseStart: 21, chapterEnd: 7, verseEnd: 30,
                              isReadPast: true, isRead: true, yearRead: 2024, allYears: [2024] });
    const s = computeStats([aliyah7, maftir], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.byYear[2024]?.bySef['Genesis']?.pseukim).toBe(40);       // raw: 30 + 10
    expect(s.byYear[2024]?.bySef['Genesis']?.uniquePseukim).toBe(30); // deduped: maftir's 10 overlap aliyah7
  });
});

// ── estimateCompletion ────────────────────────────────────────────────────────

describe('estimateCompletion — insufficient data', () => {
  it('returns null when fewer than 2 rows are read', () => {
    const rows = [makeRow({ isRead: true, orig: '2023-01-01', pseukim: 100 })];
    expect(estimateCompletion(rows, NO_FILTERS, { lookbackYears: null, paceOverride: null })).toBeNull();
  });

  it('returns null when no rows are read', () => {
    expect(estimateCompletion([makeRow()], NO_FILTERS, { lookbackYears: null, paceOverride: null })).toBeNull();
  });
});

describe('estimateCompletion — paceOverride', () => {
  it('uses paceOverride and returns a future completion date', () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      makeRow({ isRead: true, orig: `2023-0${(i % 9) + 1}-01`, pseukim: 100 })
    );
    const result = estimateCompletion(rows, NO_FILTERS, { lookbackYears: null, paceOverride: 500 });
    expect(result).not.toBeNull();
    expect(result!.ratePerYear).toBe(500);
    expect(result!.completion).toBeInstanceOf(Date);
  });
});

describe('estimateCompletion — lookback window', () => {
  it('excludes readings older than the window', () => {
    const recent = makeRow({ isRead: true, orig: '2024-01-01', pseukim: 200 });
    const old    = makeRow({ aliyah: 2, isRead: true, orig: '2020-01-01', pseukim: 50 });
    // With a 2-year window: old row should be excluded → only 1 row in window → returns null
    const result = estimateCompletion([recent, old], NO_FILTERS, { lookbackYears: 2, paceOverride: null });
    expect(result).toBeNull();
  });
});

describe('estimateCompletion — maftir pseukim deduplication', () => {
  it('does not double-count overlapping maftir pseukim in the reading rate', () => {
    // aliyah 7: ch7:v1-30; aliyah 2: ch2:v1-100; maftir: ch7:v21-30 (subset of aliyah 7)
    const aliyah7 = makeRow({ aliyah: 7, isRead: true, orig: '2023-01-01', pseukim: 30 });
    const aliyah2 = makeRow({ aliyah: 2, isRead: true, orig: '2024-01-01', pseukim: 100 });
    const maftir  = makeRow({ aliyah: 8, isRead: true, orig: '2023-06-01', pseukim: 10,
                              chapterStart: 7, verseStart: 21, chapterEnd: 7, verseEnd: 30 });
    const withMaftir    = estimateCompletion([aliyah7, aliyah2, maftir], NO_FILTERS, { lookbackYears: null, paceOverride: null });
    const withoutMaftir = estimateCompletion([aliyah7, aliyah2],         NO_FILTERS, { lookbackYears: null, paceOverride: null });
    expect(withMaftir).not.toBeNull();
    expect(withMaftir!.ratePerYear).toBe(withoutMaftir!.ratePerYear);
  });

  it('overlapping maftir pseukim reduce remaining proportionally', () => {
    // aliyah 7: ch7:v1-100 (unread); maftir: ch7:v1-50 (read, first half of aliyah 7)
    // unique total = 100, unique read = 50, remaining = 50
    const r1     = makeRow({ aliyah: 7, pseukim: 100 });
    const maftir = makeRow({ aliyah: 8, pseukim: 50, isRead: true, orig: '2023-06-01',
                             chapterStart: 7, verseStart: 1, chapterEnd: 7, verseEnd: 50 });
    const result = estimateCompletion([r1, maftir], NO_FILTERS, { lookbackYears: null, paceOverride: 200 });
    expect(result).not.toBeNull();
    expect(result!.remaining).toBe(50);
  });
});

describe('estimateCompletion — zero / negative rate', () => {
  it('returns null when paceOverride is 0 (treated as no override, falls through to insufficient history)', () => {
    // paceOverride <= 0 means "use history"; with only 1 read row → null
    const rows = [makeRow({ isRead: true, orig: '2023-06-01', pseukim: 100 })];
    expect(estimateCompletion(rows, NO_FILTERS, { lookbackYears: null, paceOverride: 0 })).toBeNull();
  });

  it('returns null when paceOverride is negative', () => {
    const rows = [makeRow({ isRead: true, orig: '2023-06-01', pseukim: 100 })];
    expect(estimateCompletion(rows, NO_FILTERS, { lookbackYears: null, paceOverride: -100 })).toBeNull();
  });
});

// ── remainingPseukim (Forecast.tsx target-year calculator) ────────────────────

describe('remainingPseukim', () => {
  it('is standard total minus standard read when there are no special pseukim', () => {
    const r1 = makeRow({ pseukim: 100, isRead: true });
    const r2 = makeRow({ aliyah: 2, pseukim: 100 });
    const remaining = remainingPseukim([r1, r2], { specialTotalPseukim: 0, specialReadPseukim: 0 });
    expect(remaining).toBe(100);
  });

  it('subtracts specialReadPseukim and adds specialTotalPseukim, matching estimateCompletion.remaining', () => {
    const r1 = makeRow({ pseukim: 100, isRead: true, orig: '2023-01-01' });
    const r2 = makeRow({ aliyah: 2, pseukim: 100 });
    const stats = { specialTotalPseukim: 50, specialReadPseukim: 20 };
    const remaining = remainingPseukim([r1, r2], stats);
    // (200 standard + 50 special) - (100 standard read + 20 special read) = 130
    expect(remaining).toBe(130);

    const forecastResult = estimateCompletion(
      [r1, r2], NO_FILTERS, { lookbackYears: null, paceOverride: 200 },
      stats.specialTotalPseukim, stats.specialReadPseukim,
    );
    expect(forecastResult!.remaining).toBe(remaining);
  });
});

// ── maftir (aliyah 8) ─────────────────────────────────────────────────────────

describe('computeStats — maftir (aliyah 8)', () => {
  // aliyah 7: ch7:v1-30; maftir: ch7:v21-30 (last 10 verses, a strict subset)
  const aliyah7Read = () => makeRow({ aliyah: 7, pseukim: 30, isRead: true, isReadPast: true, yearRead: 2024, allYears: [2024], orig: '2024-01-01' });
  const maftirRead  = () => makeRow({ aliyah: 8, pseukim: 10, chapterStart: 7, verseStart: 21, chapterEnd: 7, verseEnd: 30, isRead: true, isReadPast: true, yearRead: 2024, allYears: [2024], orig: '2024-01-01' });

  it('counts maftir as a separate aliyah; overlapping pseukim are deduplicated', () => {
    const s = computeStats([aliyah7Read(), maftirRead()], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.totalAliyot).toBe(2);
    expect(s.totalPseukim).toBe(30);   // maftir's 10 are already inside aliyah 7's 30
    expect(s.readAliyot).toBe(2);
    expect(s.readPseukim).toBe(30);
  });

  it('counts maftir in totalAliyot even when unread; pseukim still deduplicated', () => {
    const s = computeStats([makeRow({ aliyah: 7, pseukim: 30 }), makeRow({ aliyah: 8, pseukim: 10, chapterStart: 7, verseStart: 21, chapterEnd: 7, verseEnd: 30 })], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.totalAliyot).toBe(2);
    expect(s.totalPseukim).toBe(30);
    expect(s.readAliyot).toBe(0);
    expect(s.readPseukim).toBe(0);
  });

  it('counts maftir in committedAliyot; overlapping committedPseukim deduplicated', () => {
    const s = computeStats([aliyah7Read(), maftirRead()], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.committedAliyot).toBe(2);
    expect(s.committedPseukim).toBe(30);
  });

  it('counts maftir in byYear aliyot; chart pseukim use raw row values (not deduplicated)', () => {
    const s = computeStats([aliyah7Read(), maftirRead()], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.byYear[2024]?.aliyot).toBe(2);
    expect(s.byYear[2024]?.pseukim).toBe(40);  // 30 + 10 raw, chart is an activity metric
  });

  it('includes maftir in filteredRows', () => {
    const s = computeStats([aliyah7Read(), maftirRead()], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.filteredRows).toHaveLength(2);
  });

  it('includes maftir rereadCount in totals', () => {
    const a7 = aliyah7Read();
    const m  = { ...maftirRead(), rereadCount: 3 };
    const s = computeStats([a7, m], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.rereadCount).toBe(3);
  });
});

// ── special/occasion pseukim ──────────────────────────────────────────────────

function makeOA(overrides: Partial<MappedOccasionAliyah> = {}): MappedOccasionAliyah {
  return {
    id: 1, occasionId: 1, occasion: 'פסח', occasionEn: 'Pesach Day 1',
    category: 'yom_tov', aliyahKey: '1', isShabbatVariant: false,
    parshaId: 1, parsha: 'בא', parshaEn: 'Bo',
    sefer: 'Genesis', seferEn: 'Genesis', seferColor: '#000',
    pseukim: 10, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10,
    coversAliyahId: null, orig: '', allDates: [], readCount: 0,
    isRead: false, isReadPast: false, isReadFuture: false, hasFuture: false, partialOrig: '', isCoveredPast: false,
    ...overrides,
  };
}

describe('computeStats — special/occasion pseukim', () => {
  it('skips oa when coversAliyahId is set, even if read', () => {
    const oa = makeOA({ coversAliyahId: 5, isReadPast: true, isRead: true });
    const s = computeStats([], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.specialTotalPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(0);
  });

  it('skips oa from specialTotal but credits read pseukim when std contains oa and std is unread (direction 1)', () => {
    // std: ch1:1–1:10 (unread); oa: ch1:3–1:7 (read, fully inside std)
    // oa pseukim are already in the standard total, so specialTotal stays 0
    // but std wasn't fully read — partial credit flows into specialRead
    const std = makeRow({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10 });
    const oa  = makeOA({ chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 7, isReadPast: true, isRead: true });
    const s = computeStats([std], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.specialTotalPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(5); // only the exact unread overlapping pseukim
  });

  it('skips oa from both total and read when oa fully contains std and std is already read (direction 2)', () => {
    // std: ch1:3–1:7, isRead=true (SQL marks it read when oa fully contains it)
    // oa: ch1:1–1:10; std readPseukim already captured — skip specialRead too
    const std = makeRow({ chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 7, isRead: true, isReadPast: true, orig: '2024-01-01' });
    const oa  = makeOA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10, isReadPast: true, isRead: true });
    const s = computeStats([std], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.specialTotalPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(0);
  });

  it('does NOT double-count oa that straddles left boundary of standard aliyah', () => {
    // std: ch1:5–1:10 (unread, 10 pseukim); oa: ch1:3–1:8 (6 pseukim, read)
    // oa starts before std and ends inside it — partial overlap.
    // Old code missed this (used full-containment check) and counted oa in specialTotal.
    const std = makeRow({ chapterStart: 1, verseStart: 5, chapterEnd: 1, verseEnd: 10 });
    const oa  = makeOA({ chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 8, pseukim: 6, isReadPast: true, isRead: true });
    const s = computeStats([std], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.specialTotalPseukim).toBe(0);  // overlap detected — excluded from special total
    expect(s.specialReadPseukim).toBe(4);   // only 1:5-1:8 overlap the unread standard range
  });

  it('does NOT double-count oa that straddles right boundary of standard aliyah', () => {
    // std: ch1:1–1:5 (unread, 10 pseukim); oa: ch1:3–1:8 (6 pseukim, read)
    // oa starts inside std and extends past it — partial overlap.
    const std = makeRow({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const oa  = makeOA({ chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 8, pseukim: 6, isReadPast: true, isRead: true });
    const s = computeStats([std], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.specialTotalPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(3);
  });

  it('adds to specialTotal but not specialRead when oa is unread', () => {
    const oa = makeOA({ pseukim: 15 }); // isReadPast defaults to false
    const s = computeStats([], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.specialTotalPseukim).toBe(15);
    expect(s.specialReadPseukim).toBe(0);
  });

  it('adds to both specialTotal and specialRead when oa is read and not contained', () => {
    const oa = makeOA({ pseukim: 15, isReadPast: true, isRead: true });
    const s = computeStats([], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.specialTotalPseukim).toBe(15);
    expect(s.specialReadPseukim).toBe(15);
  });

  it('skips oa when sefer filter excludes its sefer', () => {
    const oa = makeOA({ sefer: 'Exodus', pseukim: 20, isReadPast: true, isRead: true });
    const s = computeStats([], [oa], SEFER_ORDER, SEFER_MAP, { ...NO_FILTERS, sefarim: ['Genesis'] });
    expect(s.specialTotalPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(0);
  });

  it('treats maftir as standard for OA containment; credits OA pseukim that maftir left unread', () => {
    // maftir (aliyah 8, unread) covers ch1:1-10 → those keys are in standardVerseKeys but not readVerseKeys
    // OA covers ch1:1-10 (pseukim: 8, read) → overlaps standard, so not in specialTotal;
    // but the keys are unread standard pseukim → credited via creditOccasionOverlap
    const maftir = makeRow({ aliyah: 8, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10 });
    const oa     = makeOA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 8,  pseukim: 8, isReadPast: true, isRead: true });
    const s = computeStats([maftir], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.specialTotalPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(8);
  });

  it('credits only the unique pseukim when Chol Hamoed overlaps a read Ki Tisa aliyah', () => {
    const unreadBefore = makeRow({
      sefer: 'Exodus', parsha: 'Ki Tisa', aliyah: 5, pseukim: 6,
      chapterStart: 34, verseStart: 4, chapterEnd: 34, verseEnd: 9,
    });
    const readKiTisa = makeRow({
      sefer: 'Exodus', parsha: 'Ki Tisa', aliyah: 6, pseukim: 17,
      chapterStart: 34, verseStart: 10, chapterEnd: 34, verseEnd: 26,
      isRead: true, isReadPast: true, yearRead: 2024, allYears: [2024],
    });
    const cholHamoed = makeOA({
      sefer: 'Exodus', seferEn: 'Exodus', parsha: 'Ki Tisa',
      occasion: 'סוכות חוה"מ', occasionEn: 'Shabbat Chol Hamoed Sukkot',
      pseukim: 7, chapterStart: 34, verseStart: 4, chapterEnd: 34, verseEnd: 10,
      isRead: true, isReadPast: true,
    });
    const s = computeStats([unreadBefore, readKiTisa], [cholHamoed], SEFER_ORDER, SEFER_MAP, NO_FILTERS);

    expect(s.readPseukim).toBe(17);
    expect(s.specialReadPseukim).toBe(6);
    expect(s.specialTotalPseukim).toBe(0);
  });

  it('dedupes occasion pseukim inside a long standard aliyah spanning three chapters', () => {
    const vayera = makeRow({
      sefer: 'Genesis', parsha: 'Vayera', aliyah: 4, pseukim: 40,
      chapterStart: 19, verseStart: 21, chapterEnd: 21, verseEnd: 4,
    });
    const pesach = makeOA({
      sefer: 'Genesis', parsha: 'Vayera', pseukim: 4,
      chapterStart: 21, verseStart: 1, chapterEnd: 21, verseEnd: 4,
      isRead: true, isReadPast: true,
    });
    const s = computeStats([vayera], [pesach], SEFER_ORDER, SEFER_MAP, NO_FILTERS);

    expect(s.specialTotalPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(4);
  });

  it('specialReadPseukim is passed through to estimateCompletion and reduces remaining', () => {
    // r1 (ch1) and r2 (ch2) are read; OA is in ch3 (no overlap with standard) so it contributes
    // specialTotalPseukim=50 and specialReadPseukim=50.
    // remaining = (totalStd + specialTotal) - (readStd + specialRead) = (200+50) - (200+50) = 0
    const r1 = makeRow({ isRead: true, orig: '2023-01-01', pseukim: 100 });
    const r2 = makeRow({ aliyah: 2, isRead: true, orig: '2024-01-01', pseukim: 100 });
    const oa = makeOA({ chapterStart: 3, verseStart: 1, chapterEnd: 3, verseEnd: 10, pseukim: 50, isReadPast: true, isRead: true });
    const { specialReadPseukim, specialTotalPseukim } = computeStats([r1, r2], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    const result = estimateCompletion([r1, r2], NO_FILTERS, { lookbackYears: null, paceOverride: 200 }, specialTotalPseukim, specialReadPseukim);
    expect(result).not.toBeNull();
    expect(result!.remaining).toBe(0);
  });
});

// ── hosafot pseukim ───────────────────────────────────────────────────────────

function makeHR(overrides: Partial<MappedHosafah> = {}): MappedHosafah {
  return {
    id: 1, sefer: 'Genesis',
    parshaId1: null, parshaId2: null, occasionId: null,
    isDoubleParsha: false,
    chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 10,
    pseukim: 10, dateRead: '2024-03-01',
    note: '', location: '',
    parsha1: '', parsha1En: '', parsha2: null, parsha2En: null,
    occasion: null, occasionEn: null,
    isReadPast: true, partialOrig: '',
    ...overrides,
    isReadFuture: overrides.isReadFuture ?? false,
  };
}

describe('computeStats — hosafot pseukim', () => {
  it('credits full pseukim when hosafah does not overlap any standard aliyah', () => {
    // hosafah in ch3, standard aliyot in ch1 — no overlap
    const hr = makeHR({ chapterStart: 3, verseStart: 1, chapterEnd: 3, verseEnd: 8, pseukim: 8 });
    const s = computeStats([], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [], [hr]);
    expect(s.specialTotalPseukim).toBe(8);
    expect(s.specialReadPseukim).toBe(8);
  });

  it('adds to specialTotal but not specialRead when hosafah is unread and outside standard', () => {
    const hr = makeHR({ chapterStart: 3, verseStart: 1, chapterEnd: 3, verseEnd: 8, pseukim: 8, isReadPast: false, dateRead: '2099-01-01' });
    const s = computeStats([], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [], [hr]);
    expect(s.specialTotalPseukim).toBe(8);
    expect(s.specialReadPseukim).toBe(0);
  });

  it('does not double-count hosafah that fully overlaps a read standard aliyah', () => {
    const std = makeRow({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10, isRead: true, isReadPast: true, orig: '2024-01-01' });
    const hr  = makeHR({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10, pseukim: 10 });
    const s = computeStats([std], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [], [hr]);
    expect(s.specialTotalPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(0); // already counted in standard readPseukim
  });

  it('credits only unique pseukim when hosafah partially overlaps an unread standard aliyah', () => {
    // std: ch1:5–1:10 (unread); hosafah: ch1:1–1:7 (read, 7 pseukim)
    // overlap is ch1:5–1:7 (3 pseukim) — those get credited; ch1:1–1:4 (4 pseukim) outside standard
    // Since hosafah overlaps standard, it goes through creditHosafahOverlap — no specialTotal credit
    const std = makeRow({ chapterStart: 1, verseStart: 5, chapterEnd: 1, verseEnd: 10 });
    const hr  = makeHR({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 7, pseukim: 7 });
    const s = computeStats([std], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [], [hr]);
    expect(s.specialTotalPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(3); // only ch1:5–1:7 (3 pseukim) credited
  });

  it('does not double-count hosafah when same verses already credited via standard Shabbat', () => {
    // std ch1:1–1:10 is read; hosafah also covers ch1:1–1:10
    const std = makeRow({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10, isRead: true, isReadPast: true, orig: '2024-01-01' });
    const hr  = makeHR({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10, pseukim: 10 });
    const s = computeStats([std], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [], [hr]);
    expect(s.specialReadPseukim).toBe(0);
  });

  it('skips hosafah when sefer filter excludes its sefer', () => {
    const hr = makeHR({ sefer: 'Exodus', chapterStart: 3, verseStart: 1, chapterEnd: 3, verseEnd: 5, pseukim: 5 });
    const s = computeStats([], [], SEFER_ORDER, SEFER_MAP, { ...NO_FILTERS, sefarim: ['Genesis'] }, [], [hr]);
    expect(s.specialTotalPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(0);
  });
});

// ── countPseukim ──────────────────────────────────────────────────────────────

// Small fixture: ch1=10 verses, ch2=8 verses, ch3=15 verses
const CV = [10, 8, 15];

describe('countPseukim — single chapter', () => {
  it('returns ve - vs + 1 when cs === ce', () => {
    expect(countPseukim(CV, 1, 3, 1, 7)).toBe(5); // ch1 v3–v7
  });

  it('returns 1 for a single verse', () => {
    expect(countPseukim(CV, 2, 4, 2, 4)).toBe(1);
  });

  it('returns the full chapter when vs=1 and ve=max', () => {
    expect(countPseukim(CV, 2, 1, 2, 8)).toBe(8);
  });
});

describe('countPseukim — multi-chapter', () => {
  it('sums partial first chapter + full middle + partial last', () => {
    // ch1: v6–v10 = 5; ch2: v1–v8 = 8; ch3: v1–v5 = 5 → total 18
    expect(countPseukim(CV, 1, 6, 3, 5)).toBe(18);
  });

  it('handles two adjacent chapters', () => {
    // ch1: v8–v10 = 3; ch2: v1–v3 = 3 → total 6
    expect(countPseukim(CV, 1, 8, 2, 3)).toBe(6);
  });
});

describe('countPseukim — missing chapter data', () => {
  it('returns null when chapterVerses is empty', () => {
    expect(countPseukim([], 1, 1, 2, 5)).toBeNull();
  });

  it('returns null when a mid-range chapter is not in the array', () => {
    // CV only has 3 chapters; requesting ch4 should return null
    expect(countPseukim(CV, 3, 1, 4, 5)).toBeNull();
  });
});

// ── computeRing ───────────────────────────────────────────────────────────────

function makeRingItem(overrides: Partial<{ sefer: string; isReadPast: boolean; isCoveredPast: boolean; isReadFuture: boolean }> = {}) {
  return { sefer: 'Genesis', isReadPast: false, isCoveredPast: false, isReadFuture: false, ...overrides };
}

describe('computeRing — no sefer filter', () => {
  it('returns zeros for empty items', () => {
    const r = computeRing([], []);
    expect(r).toEqual({ total: 0, read: 0, commit: 0, pct: 0, cPct: 0 });
  });

  it('counts isReadPast as read', () => {
    const items = [makeRingItem({ isReadPast: true }), makeRingItem()];
    const r = computeRing(items, []);
    expect(r.total).toBe(2);
    expect(r.read).toBe(1);
    expect(r.pct).toBeCloseTo(50);
  });

  it('counts isCoveredPast as read', () => {
    const items = [makeRingItem({ isCoveredPast: true }), makeRingItem()];
    const r = computeRing(items, []);
    expect(r.read).toBe(1);
  });

  it('counts isReadFuture (not already read/covered) as committed but not read', () => {
    const items = [
      makeRingItem({ isReadPast: true }),
      makeRingItem({ isReadFuture: true }),
      makeRingItem(),
    ];
    const r = computeRing(items, []);
    expect(r.read).toBe(1);
    expect(r.commit).toBe(2);
    expect(r.cPct).toBeCloseTo(200 / 3);
  });

  it('does not double-count future that is also past', () => {
    const items = [makeRingItem({ isReadPast: true, isReadFuture: true })];
    const r = computeRing(items, []);
    expect(r.read).toBe(1);
    expect(r.commit).toBe(1);
  });

  it('does not double-count future that is also coveredPast', () => {
    const items = [makeRingItem({ isCoveredPast: true, isReadFuture: true })];
    const r = computeRing(items, []);
    expect(r.read).toBe(1);
    expect(r.commit).toBe(1);
  });
});

describe('computeRing — with sefer filter', () => {
  it('filters out items not in the seferFilter', () => {
    const items = [
      makeRingItem({ sefer: 'Genesis', isReadPast: true }),
      makeRingItem({ sefer: 'Exodus',  isReadPast: true }),
    ];
    const r = computeRing(items, ['Genesis']);
    expect(r.total).toBe(1);
    expect(r.read).toBe(1);
  });

  it('returns zeros when filter matches nothing', () => {
    const items = [makeRingItem({ sefer: 'Genesis', isReadPast: true })];
    const r = computeRing(items, ['Exodus']);
    expect(r).toEqual({ total: 0, read: 0, commit: 0, pct: 0, cPct: 0 });
  });
});

// ── double-parsha pair aggregation (DoubleParshaGrid.tsx) ──────────────────────

const DP_ALIYOT = [1, 2, 3, 4, 5, 6, 7];

describe('isAliyahRead / isAliyahPartial', () => {
  it('is read only when a readAsDouble row is past-read', () => {
    const rows = [makeRow({ readAsDouble: true, isReadPast: true })];
    expect(isAliyahRead(rows)).toBe(true);
    expect(isAliyahPartial(rows)).toBe(false);
  });

  it('a readAsDouble row that is only scheduled (future) does not count as read', () => {
    const rows = [makeRow({ readAsDouble: true, isReadFuture: true })];
    expect(isAliyahRead(rows)).toBe(false);
  });

  it('is partial when unread but has a past reading or partialOrig, and not fully read', () => {
    expect(isAliyahPartial([makeRow({ isReadPast: true, readAsDouble: false })])).toBe(true);
    expect(isAliyahPartial([makeRow({ partialOrig: '2024-01-01' })])).toBe(true);
    expect(isAliyahPartial([makeRow()])).toBe(false);
  });

  it('fully read (readAsDouble + isReadPast) takes precedence over partial', () => {
    const rows = [makeRow({ readAsDouble: true, isReadPast: true, partialOrig: '2024-01-01' })];
    expect(isAliyahRead(rows)).toBe(true);
    expect(isAliyahPartial(rows)).toBe(false);
  });
});

describe('countReadAliyot / computePairTotalPseukim / computePairReadPseukim', () => {
  it('counts only combined aliyot marked read, and sums pseukim across all rows in the pair', () => {
    const pairRows: Record<number, ReturnType<typeof makeRow>[]> = {
      1: [makeRow({ combinedAliyah: 1, pseukim: 10, readAsDouble: true, isReadPast: true })],
      2: [makeRow({ combinedAliyah: 2, pseukim: 20 })],
    };
    expect(countReadAliyot(pairRows, DP_ALIYOT)).toBe(1);
    expect(computePairTotalPseukim(pairRows, DP_ALIYOT)).toBe(30);
    expect(computePairReadPseukim(pairRows, DP_ALIYOT)).toBe(10);
  });

  it('sums pseukim across multiple rows sharing one combined aliyah (e.g. split verse ranges)', () => {
    const pairRows: Record<number, ReturnType<typeof makeRow>[]> = {
      1: [
        makeRow({ combinedAliyah: 1, pseukim: 4, readAsDouble: true, isReadPast: true }),
        makeRow({ combinedAliyah: 1, pseukim: 6, readAsDouble: true, isReadPast: true }),
      ],
    };
    expect(computePairTotalPseukim(pairRows, DP_ALIYOT)).toBe(10);
    expect(computePairReadPseukim(pairRows, DP_ALIYOT)).toBe(10);
  });

  it('missing combined aliyot (no rows for that slot) contribute zero, not an error', () => {
    expect(countReadAliyot({}, DP_ALIYOT)).toBe(0);
    expect(computePairTotalPseukim({}, DP_ALIYOT)).toBe(0);
    expect(computePairReadPseukim({}, DP_ALIYOT)).toBe(0);
  });
});

// ── effectivePseukimOf / committedPseukimOf ───────────────────────────────────
// Regression coverage: SeferCards.tsx once computed its own "committed" total inline as
// `committedPseukim + specialFuturePseukim`, omitting specialReadPseukim. Since a partial
// holiday reading never marks its underlying standard aliyah as committed (see the
// specialReadPseukim tests above), that left already-read pseukim missing from the
// "committed" bucket — an aliyah's true remaining pseukim gap read as smaller than it
// actually was. All call sites now share these two helpers instead of re-deriving the sum.

describe('committedPseukimOf', () => {
  it('includes specialReadPseukim so committed never falls below effective', () => {
    // std A: ch1:1-10, unread. oa reads ch1:3-1:7 (5 pseukim) => specialReadPseukim=5,
    // but std A's own row is never marked committed (shouldCountCommitted is false).
    // std B: ch2:1-37 (a separate, unrelated future-scheduled aliyah).
    const stdA = makeRow({ aliyah: 1, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10 });
    const oa   = makeOA({ chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 7, isReadPast: true, isRead: true });
    const stdB = makeRow({ aliyah: 2, chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 37, pseukim: 37, isRead: true, isReadFuture: true, orig: '2999-01-01' });

    const s = computeStats([stdA, stdB], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.specialReadPseukim).toBe(5);
    expect(s.committedPseukim).toBe(37); // only stdB's future range — the OA credit isn't in here

    const effective = effectivePseukimOf(s);
    const committed = committedPseukimOf(s);
    expect(effective).toBe(5); // 0 read + 5 special-read
    expect(committed).toBe(42); // 37 committed + 5 special-read that a naive sum would drop
    expect(committed).toBeGreaterThanOrEqual(effective);
    expect(committed - effective).toBe(37); // the true remaining gap: stdB's full 37 pseukim
  });

  it('per-sefer bySefer entries need the same fix as the top-level stats', () => {
    const stdA = makeRow({ aliyah: 1, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10 });
    const oa   = makeOA({ chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 7, isReadPast: true, isRead: true });
    const stdB = makeRow({ aliyah: 2, chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 37, pseukim: 37, isRead: true, isReadFuture: true, orig: '2999-01-01' });

    const s = computeStats([stdA, stdB], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    const bs = s.bySefer.Genesis!;
    expect(committedPseukimOf(bs) - effectivePseukimOf(bs)).toBe(37);
  });
});
