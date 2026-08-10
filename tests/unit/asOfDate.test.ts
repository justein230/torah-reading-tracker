import { describe, it, expect } from 'vitest';
import { computeStats } from '../../src/compute.js';
import { applyAsOfDate } from '../../src/utils/asOfDate.js';
import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah, Filters } from '../../src/types/index.js';

const SEFER_ORDER = ['Genesis'];
const SEFER_MAP = { Genesis: { en: 'Genesis', color: '#000', chapterVerses: [] } };
const NO_FILTERS: Filters = { sefarim: [], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false };
const CUTOFF = '2024-06-01';

function makeRow(overrides: Partial<MappedRow> = {}): MappedRow {
  const aliyah  = overrides.aliyah  ?? 1;
  const pseukim = overrides.pseukim ?? 100;
  const chapter = Number(aliyah);
  return {
    sefer: 'Genesis', parsha: 'Bereishit', aliyah, pairName: '', pairNameEn: '', combinedAliyah: null, pseukim, pct: 1,
    chapterStart: chapter, verseStart: 1, chapterEnd: chapter, verseEnd: pseukim,
    isRead: false, isReadPast: false, isReadFuture: false, isFuture: false, isReread: false,
    hasFuture: false, yearRead: null, futureYear: null, allYears: [],
    orig: '', directOrig: '', readAsDouble: false, partialOrig: '', futDates: [], occasion: '', location: '', rereadCount: 0,
    ...overrides,
  };
}

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

function makeWA(overrides: Partial<MappedWeekdayAliyah> = {}): MappedWeekdayAliyah {
  return {
    id: 1, parshaId: 1, aliyahNum: 1, parsha: 'Bereishit', parshaEn: 'Bereishit',
    sefer: 'Genesis', seferEn: 'Genesis', seferColor: '#000', pseukim: 5,
    chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5, coversAliyahId: null,
    dateRead: '', allDates: [], readingId: 1,
    isReadPast: false, isReadFuture: false, hasFuture: false, partialOrig: '', isCoveredPast: false,
    location: '', note: '',
    ...overrides,
  };
}

function makeHR(overrides: Partial<MappedHosafah> = {}): MappedHosafah {
  return {
    id: 1, sefer: 'Genesis', parshaId1: null, parshaId2: null, occasionId: null, isDoubleParsha: false,
    chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 10, pseukim: 10, dateRead: '',
    note: '', location: '', parsha1: '', parsha1En: '', parsha2: null, parsha2En: null,
    occasion: null, occasionEn: null, isReadPast: false, isReadFuture: false, partialOrig: '',
    ...overrides,
  };
}

describe('applyAsOfDate', () => {
  it('keeps a row read on or before the cutoff', () => {
    const row = makeRow({ isRead: true, isReadPast: true, orig: '2024-01-01', yearRead: 2024, allYears: [2024] });
    const snap = applyAsOfDate([row], [], [], [], CUTOFF);
    expect(snap.allRows[0]?.isRead).toBe(true);
    expect(snap.allRows[0]?.isReadPast).toBe(true);
    expect(snap.allRows[0]?.orig).toBe('2024-01-01');
  });

  it('reverts a row read after the cutoff to unread', () => {
    const row = makeRow({ isRead: true, isReadPast: true, orig: '2024-09-01', yearRead: 2024, allYears: [2024] });
    const snap = applyAsOfDate([row], [], [], [], CUTOFF);
    expect(snap.allRows[0]?.isRead).toBe(false);
    expect(snap.allRows[0]?.isReadPast).toBe(false);
    expect(snap.allRows[0]?.orig).toBe('');
  });

  it('reverts a scheduled-future row (relative to real today) to unread as of a past cutoff', () => {
    const row = makeRow({ isRead: true, isReadFuture: true, orig: '2099-01-01', yearRead: 2099, allYears: [2099] });
    const snap = applyAsOfDate([row], [], [], [], CUTOFF);
    expect(snap.allRows[0]?.isRead).toBe(false);
    expect(snap.allRows[0]?.isReadFuture).toBe(false);
  });

  it('reverts occasion/weekday/hosafah readings dated after the cutoff', () => {
    const oa = makeOA({ orig: '2024-09-01', isRead: true, isReadPast: true });
    const wa = makeWA({ dateRead: '2024-09-01', isReadPast: true });
    const hr = makeHR({ dateRead: '2024-09-01', isReadPast: true });
    const snap = applyAsOfDate([], [oa], [wa], [hr], CUTOFF);
    expect(snap.occasionAliyot[0]?.isRead).toBe(false);
    expect(snap.weekdayAliyot[0]?.isReadPast).toBe(false);
    expect(snap.hosafotReadings[0]?.isReadPast).toBe(false);
  });

  it('drops a stale partialOrig once the row that caused it falls after the cutoff', () => {
    // Standard aliyah ch1:1-10, partially covered by a weekday reading dated before AND after cutoff variants.
    const row = makeRow({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10 });
    const waAfterCutoff = makeWA({
      chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5, pseukim: 5,
      dateRead: '2024-09-01', isReadPast: true,
    });
    const snap = applyAsOfDate([row], [], [waAfterCutoff], [], CUTOFF);
    // The weekday reading is reverted (after cutoff), so it can no longer partially cover the standard row.
    expect(snap.allRows[0]?.partialOrig).toBe('');
  });

  it('percent complete as of the cutoff excludes rows read after it', () => {
    const rows = [
      makeRow({ aliyah: 1, pseukim: 50, isRead: true, isReadPast: true, orig: '2024-01-01', yearRead: 2024, allYears: [2024] }),
      makeRow({ aliyah: 2, pseukim: 50, isRead: true, isReadPast: true, orig: '2024-09-01', yearRead: 2024, allYears: [2024] }),
    ];
    const snap = applyAsOfDate(rows, [], [], [], CUTOFF);
    const s = computeStats(snap.allRows, snap.occasionAliyot, SEFER_ORDER, SEFER_MAP, NO_FILTERS, snap.weekdayAliyot, snap.hosafotReadings);
    expect(s.readPseukim).toBe(50);
  });
});
