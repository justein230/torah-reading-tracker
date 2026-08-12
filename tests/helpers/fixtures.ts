import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah, SpecialReadingRecord, CalEntry } from '../../src/types/index.js';

export function makeRow(overrides: Partial<MappedRow> = {}): MappedRow {
  const row: MappedRow = {
    sefer: 'Genesis', parsha: 'Bereishit', aliyah: 1,
    pairName: '', pairNameEn: '', combinedAliyah: null,
    pseukim: 10, pct: 1,
    chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10,
    isRead: false, isReadPast: false, isReadFuture: false, isFuture: false,
    isReread: false, hasFuture: false, yearRead: null, futureYear: null, allYears: [],
    orig: '', directOrig: '', readAsDouble: false, partialOrig: '', futDates: [], occasion: '', location: '', rereadCount: 0,
    ...overrides,
  };
  // A genuinely-read standard aliyah has directOrig === orig; default to that unless a test
  // explicitly sets directOrig (e.g. '' to model a holiday-derived, suppressed row).
  if (overrides.directOrig === undefined) row.directOrig = row.orig;
  return row;
}

export function makeOA(overrides: Partial<MappedOccasionAliyah> = {}): MappedOccasionAliyah {
  return {
    id: 1, occasionId: 1, occasion: 'Pesach', occasionEn: 'Pesach', category: 'yom_tov',
    aliyahKey: '1', isShabbatVariant: false,
    parshaId: 1, parsha: 'Bereishit', parshaEn: 'Bereishit',
    sefer: 'Genesis', seferEn: 'Genesis', seferColor: '#000',
    pseukim: 5, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5,
    coversAliyahId: null,
    orig: '2024-04-22', allDates: ['2024-04-22'], readCount: 1,
    isRead: true, isReadPast: true, isReadFuture: false, hasFuture: false, partialOrig: '', isCoveredPast: false,
    ...overrides,
  };
}

export function makeWA(overrides: Partial<MappedWeekdayAliyah> = {}): MappedWeekdayAliyah {
  return {
    id: 1, parshaId: 1, aliyahNum: 1,
    parsha: 'Bereishit', parshaEn: 'Bereishit',
    sefer: 'Genesis', seferEn: 'Genesis', seferColor: '#000',
    pseukim: 5, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5,
    coversAliyahId: 1, dateRead: '2024-01-15', allDates: ['2024-01-15'], readingId: 1,
    isReadPast: true, isReadFuture: false, hasFuture: false, partialOrig: '', isCoveredPast: false, location: '', note: '',
    ...overrides,
  };
}

export function makeSpecial(overrides: Partial<SpecialReadingRecord> = {}): SpecialReadingRecord {
  return {
    id: 1, occasionAliyahId: 1, occasionId: 1,
    occasion: 'Pesach', occasionEn: 'Pesach', category: 'yom_tov',
    aliyahKey: '1', isShabbatVariant: false,
    parsha: 'Bereishit', parshaEn: 'Bereishit',
    dateRead: '2024-04-23', note: '', location: '', pseukim: 8, coversAliyahId: null,
    ...overrides,
  };
}

export function makeHosafah(overrides: Partial<MappedHosafah> = {}): MappedHosafah {
  return {
    id: 1, sefer: 'Genesis', parshaId1: 1, parshaId2: null, occasionId: null,
    isDoubleParsha: false, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5,
    pseukim: 5, dateRead: '2024-01-15', note: '', location: '',
    parsha1: 'Bereishit', parsha1En: 'Bereishit', parsha2: null, parsha2En: null,
    occasion: null, occasionEn: null,
    isReadPast: true, partialOrig: '',
    ...overrides,
    isReadFuture: overrides.isReadFuture ?? false,
  };
}

/** One reading as the calendar views consume it (the value type of a CalDayMap). */
export function makeCalEntry(overrides: Partial<CalEntry> = {}): CalEntry {
  return {
    kind: 'standard', sefer: 'Genesis', parsha: 'בראשית', aliyah: 1, pseukim: 10,
    isReread: false, isFuture: false,
    ...overrides,
  };
}
