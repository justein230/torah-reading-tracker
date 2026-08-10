import { describe, it, expect } from 'vitest';
import { computeStats } from '../../src/compute.js';
import {
  standardRowKey, withHypotheticalRowDate, withHypotheticalOccasionDate,
  withHypotheticalWeekdayDate, withHypotheticalHosafahDate, applyWhatIfPicks, revertRow,
  revertOccasion, revertWeekday, revertHosafah,
} from '../../src/utils/whatIf.js';
import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah, Filters } from '../../src/types/index.js';

const SEFER_ORDER = ['Genesis'];
const SEFER_MAP = { Genesis: { en: 'Genesis', color: '#000', chapterVerses: [] } };
const NO_FILTERS: Filters = { sefarim: [], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false };

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

describe('standardRowKey', () => {
  it('combines parsha and aliyah', () => {
    expect(standardRowKey({ parsha: 'Bereishit', aliyah: 3 })).toBe('Bereishit|3');
  });
});

describe('withHypotheticalRowDate', () => {
  it('flips an unread row to a future read', () => {
    const row = makeRow();
    const hyp = withHypotheticalRowDate(row, '2099-06-01');
    expect(hyp.isRead).toBe(true);
    expect(hyp.isReadPast).toBe(false);
    expect(hyp.isReadFuture).toBe(true);
    expect(hyp.orig).toBe('2099-06-01');
    expect(hyp.yearRead).toBe(2099);
    expect(hyp.allYears).toEqual([2099]);
  });

  it('does not mutate the original row', () => {
    const row = makeRow();
    withHypotheticalRowDate(row, '2099-06-01');
    expect(row.isRead).toBe(false);
  });
});

describe('withHypotheticalOccasionDate / WeekdayDate / HosafahDate', () => {
  it('flips an occasion aliyah to future-read', () => {
    const hyp = withHypotheticalOccasionDate(makeOA(), '2099-06-01');
    expect(hyp.isRead).toBe(true);
    expect(hyp.isReadPast).toBe(false);
    expect(hyp.isReadFuture).toBe(true);
  });

  it('flips a weekday aliyah to future-read', () => {
    const hyp = withHypotheticalWeekdayDate(makeWA(), '2099-06-01');
    expect(hyp.dateRead).toBe('2099-06-01');
    expect(hyp.isReadPast).toBe(false);
    expect(hyp.isReadFuture).toBe(true);
  });

  it('flips a hosafah to future-read', () => {
    const hyp = withHypotheticalHosafahDate(makeHR(), '2099-06-01');
    expect(hyp.dateRead).toBe('2099-06-01');
    expect(hyp.isReadPast).toBe(false);
    expect(hyp.isReadFuture).toBe(true);
  });
});

describe('applyWhatIfPicks — merges into computeStats', () => {
  it('leaves stats unchanged with no picks', () => {
    const rows = [makeRow({ aliyah: 1, pseukim: 50 }), makeRow({ aliyah: 2, pseukim: 60 })];
    const merged = applyWhatIfPicks(rows, [], [], [], []);
    const s = computeStats(merged.allRows, merged.occasionAliyot, SEFER_ORDER, SEFER_MAP, NO_FILTERS, merged.weekdayAliyot, merged.hosafotReadings);
    expect(s.committedPseukim).toBe(0);
  });

  it('increases committedPseukim for a picked standard aliyah', () => {
    const rows = [makeRow({ aliyah: 1, pseukim: 50 }), makeRow({ aliyah: 2, pseukim: 60 })];
    const picks = [{ kind: 'standard' as const, key: standardRowKey(rows[0] as MappedRow), date: '2099-01-01' }];
    const merged = applyWhatIfPicks(rows, [], [], [], picks);
    const s = computeStats(merged.allRows, merged.occasionAliyot, SEFER_ORDER, SEFER_MAP, NO_FILTERS, merged.weekdayAliyot, merged.hosafotReadings);
    expect(s.committedPseukim).toBe(50);
    expect(s.committedAliyot).toBe(1);
    expect(s.readPseukim).toBe(0); // future, not past
  });

  it('does not affect rows not in the pick list', () => {
    const rows = [makeRow({ aliyah: 1, pseukim: 50 }), makeRow({ aliyah: 2, pseukim: 60 })];
    const picks = [{ kind: 'standard' as const, key: standardRowKey(rows[0] as MappedRow), date: '2099-01-01' }];
    const merged = applyWhatIfPicks(rows, [], [], [], picks);
    expect(merged.allRows[1]).toEqual(rows[1]);
  });

  it('a hypothetical future weekday pick is credited via specialFuturePseukim like any other future special reading', () => {
    // Standard aliyah (already scheduled future) covers ch1:1-10; weekday aliyah picked as hypothetical covers the same verses.
    // computeStats only dedupes special-future against *past* standard reads (readVerseKeys), not other future
    // reads — this mirrors existing behavior for two real overlapping future readings, not something whatIf.ts changes.
    const std = makeRow({ aliyah: 1, pseukim: 10, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10,
                           isRead: true, isReadFuture: true, orig: '2099-01-01', yearRead: 2099, allYears: [2099] });
    const wa = makeWA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10, pseukim: 10 });
    const picks = [
      { kind: 'standard' as const, key: standardRowKey(std), date: '2099-01-01' },
      { kind: 'weekday' as const, key: String(wa.id), date: '2099-02-01' },
    ];
    const merged = applyWhatIfPicks([std], [], [wa], [], picks);
    const s = computeStats(merged.allRows, merged.occasionAliyot, SEFER_ORDER, SEFER_MAP, NO_FILTERS, merged.weekdayAliyot, merged.hosafotReadings);
    expect(s.committedPseukim).toBe(10);
    expect(s.specialFuturePseukim).toBe(10);
  });

  it('a hypothetical future hosafah contributes new specialFuturePseukim when it does not overlap standard aliyot', () => {
    const hr = makeHR({ chapterStart: 5, verseStart: 1, chapterEnd: 5, verseEnd: 8, pseukim: 8 });
    const picks = [{ kind: 'hosafah' as const, key: String(hr.id), date: '2099-03-01' }];
    const merged = applyWhatIfPicks([], [], [], [hr], picks);
    const s = computeStats(merged.allRows, merged.occasionAliyot, SEFER_ORDER, SEFER_MAP, NO_FILTERS, merged.weekdayAliyot, merged.hosafotReadings);
    expect(s.specialFuturePseukim).toBe(8);
    expect(s.specialTotalPseukim).toBe(8);
  });

  it('a hypothetical future occasion aliyah contributes to specialFuturePseukim, not specialReadPseukim', () => {
    const oa = makeOA({ pseukim: 12 });
    const picks = [{ kind: 'occasion' as const, key: String(oa.id), date: '2099-04-01' }];
    const merged = applyWhatIfPicks([], [oa], [], [], picks);
    const s = computeStats(merged.allRows, merged.occasionAliyot, SEFER_ORDER, SEFER_MAP, NO_FILTERS, merged.weekdayAliyot, merged.hosafotReadings);
    expect(s.specialFuturePseukim).toBe(12);
    expect(s.specialReadPseukim).toBe(0);
  });

  it('leaving a real future standard row out of the picks reverts it to unread (revertRow)', () => {
    const futureRow = makeRow({ aliyah: 1, pseukim: 50, isRead: true, isReadFuture: true, orig: '2099-01-01', yearRead: 2099, allYears: [2099] });
    const merged = applyWhatIfPicks([futureRow], [], [], [], []);
    expect(merged.allRows[0]).toEqual(revertRow(futureRow));
    const s = computeStats(merged.allRows, merged.occasionAliyot, SEFER_ORDER, SEFER_MAP, NO_FILTERS, merged.weekdayAliyot, merged.hosafotReadings);
    expect(s.committedPseukim).toBe(0);
  });

  it('a real future standard row present in the picks with its own date is unaffected', () => {
    const futureRow = makeRow({ aliyah: 1, pseukim: 50, isRead: true, isReadFuture: true, orig: '2099-01-01', yearRead: 2099, allYears: [2099] });
    const picks = [{ kind: 'standard' as const, key: standardRowKey(futureRow), date: '2099-01-01' }];
    const merged = applyWhatIfPicks([futureRow], [], [], [], picks);
    const s = computeStats(merged.allRows, merged.occasionAliyot, SEFER_ORDER, SEFER_MAP, NO_FILTERS, merged.weekdayAliyot, merged.hosafotReadings);
    expect(s.committedPseukim).toBe(50);
  });

  it('reverts real future occasion/weekday/hosafah rows left out of the picks (complete-set)', () => {
    const oa = makeOA({ pseukim: 12, isRead: true, isReadFuture: true, orig: '2099-04-01' });
    const wa = makeWA({ pseukim: 5, isReadFuture: true, dateRead: '2099-04-01' });
    const hr = makeHR({ pseukim: 8, chapterStart: 5, verseStart: 1, chapterEnd: 5, verseEnd: 8, isReadFuture: true, dateRead: '2099-04-01' });
    const merged = applyWhatIfPicks([], [oa], [wa], [hr], []);
    expect(merged.occasionAliyot[0]).toEqual(revertOccasion(oa));
    expect(merged.weekdayAliyot[0]).toEqual(revertWeekday(wa));
    expect(merged.hosafotReadings[0]).toEqual(revertHosafah(hr));
    const s = computeStats(merged.allRows, merged.occasionAliyot, SEFER_ORDER, SEFER_MAP, NO_FILTERS, merged.weekdayAliyot, merged.hosafotReadings);
    expect(s.specialFuturePseukim).toBe(0);
  });

  it('leaves past-read occasion/weekday/hosafah rows untouched when left out of the picks', () => {
    const oa = makeOA({ pseukim: 12, isRead: true, isReadPast: true, orig: '2020-04-01' });
    const wa = makeWA({ pseukim: 5, isReadPast: true, dateRead: '2020-04-01' });
    const hr = makeHR({ pseukim: 8, chapterStart: 5, verseStart: 1, chapterEnd: 5, verseEnd: 8, isReadPast: true, dateRead: '2020-04-01' });
    const merged = applyWhatIfPicks([], [oa], [wa], [hr], []);
    expect(merged.occasionAliyot[0]).toEqual(oa);
    expect(merged.weekdayAliyot[0]).toEqual(wa);
    expect(merged.hosafotReadings[0]).toEqual(hr);
  });
});
