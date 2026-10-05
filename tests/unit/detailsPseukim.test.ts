import { describe, it, expect } from 'vitest';
import { buildParshaRow } from '../../src/utils/details-utils.js';
import { computeStats, effectivePseukimOf } from '../../src/compute.js';
import type { Filters, MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah } from '../../src/types/index.js';
import { makeRow, makeOA, makeWA, makeHosafah } from '../helpers/fixtures.js';

// Per-parsha read/total pseukim on the Details page must never count a pasuk twice, however
// many standard aliyot, holiday readings, weekday readings or hosafot cover it.

const NO_FILTERS: Filters = { sefarim: [], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false };

// Exodus 10–13 verse counts (index = chapter − 1); only the chapters these tests cross matter.
const EXODUS_VERSES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 29, 10, 51, 22];
const SEFER_MAP = {
  Exodus:  { en: 'Exodus',  color: '#000', chapterVerses: EXODUS_VERSES },
  Genesis: { en: 'Genesis', color: '#000', chapterVerses: [10, 10] },
};

const EMPTY_PARTIALS = { oa: [] as MappedOccasionAliyah[], wa: [] as MappedWeekdayAliyah[], hr: [] as MappedHosafah[], totalTorahPseukim: 1000 };

function build(rows: MappedRow[], parsha: string, sefer: string, partials: Partial<typeof EMPTY_PARTIALS> = {}, filters: Filters = NO_FILTERS) {
  return buildParshaRow(rows, parsha, sefer, true, filters, {
    TLIT: {}, schedule: {}, seferMap: SEFER_MAP, partials: { ...EMPTY_PARTIALS, ...partials },
  }, 1);
}

// ── Bo, as it appears in torah.db ─────────────────────────────────────────────

const bo = (aliyah: number, cs: number, vs: number, ce: number, ve: number, pseukim: number, read: boolean): MappedRow =>
  makeRow({
    sefer: 'Exodus', parsha: 'Bo', aliyah, chapterStart: cs, verseStart: vs, chapterEnd: ce, verseEnd: ve, pseukim,
    isRead: read, isReadPast: read, orig: read ? '2025-02-01' : '', yearRead: read ? 2025 : null, allYears: read ? [2025] : [],
  });

// Aliyah 4 was read directly; aliyah 5 counts as read because Pesach occasion aliyot 1+2 cover it.
const boRows = (): MappedRow[] => [
  bo(1, 10, 1, 10, 11, 11, false),
  bo(2, 10, 12, 10, 23, 12, false),
  bo(3, 10, 24, 11, 3, 9, false),
  bo(4, 11, 4, 12, 20, 27, true),
  bo(5, 12, 21, 12, 28, 8, true),
  bo(6, 12, 29, 12, 51, 23, false),
  bo(7, 13, 1, 13, 16, 16, false),
  bo(8, 13, 14, 13, 16, 3, false), // maftir, overlaps aliyah 7
];

const boOccasion = (id: number, key: string, cs: number, vs: number, ce: number, ve: number, pseukim: number, orig: string) =>
  makeOA({ id, aliyahKey: key, parsha: 'Bo', sefer: 'Exodus', chapterStart: cs, verseStart: vs, chapterEnd: ce, verseEnd: ve, pseukim, orig, allDates: [orig] });

describe('buildParshaRow pseukim — Bo (regression: showed 83, true figure is 35)', () => {
  const pesachOccasions = [
    boOccasion(106, '1', 12, 21, 12, 24, 4, '2025-04-09'),
    boOccasion(107, '2', 12, 21 + 4, 12, 28, 4, '2025-04-09'),
    // Maftir 12:1–20 sits inside the directly-read aliyah 4, so it inherits that aliyah's date.
    boOccasion(192, 'M', 12, 1, 12, 20, 20, '2025-02-01'),
    boOccasion(291, 'M', 12, 1, 12, 20, 20, '2025-02-01'),
  ];

  it('counts each pasuk once across standard rows and holiday readings', () => {
    const p = build(boRows(), 'Bo', 'Exodus', { oa: pesachOccasions });
    expect(p.readPseukim).toBe(35); // Exodus 11:4–12:28
  });

  it('counts total pseukim once although aliyah 8 overlaps aliyah 7', () => {
    const p = build(boRows(), 'Bo', 'Exodus');
    expect(p.totalPseukim).toBe(106); // Exodus 10:1–13:16: 29 + 10 + 51 + 16
  });

  it('does not change when the same holiday readings are listed twice', () => {
    const once  = build(boRows(), 'Bo', 'Exodus', { oa: pesachOccasions });
    const twice = build(boRows(), 'Bo', 'Exodus', { oa: [...pesachOccasions, ...pesachOccasions] });
    expect(twice.readPseukim).toBe(once.readPseukim);
  });
});

// ── overlap between standard rows ─────────────────────────────────────────────

describe('buildParshaRow pseukim — overlapping standard aliyot', () => {
  it('counts a read maftir inside a read aliyah 7 once', () => {
    const rows = [bo(7, 13, 1, 13, 16, 16, true), bo(8, 13, 14, 13, 16, 3, true)];
    expect(build(rows, 'Bo', 'Exodus').readPseukim).toBe(16);
  });
});

// ── special readings vs standard rows ─────────────────────────────────────────

describe('buildParshaRow pseukim — special readings', () => {
  it('adds nothing for a weekday reading inside an already-read aliyah', () => {
    const rows = [bo(1, 10, 1, 10, 11, 11, true)];
    const wa   = makeWA({ parsha: 'Bo', sefer: 'Exodus', chapterStart: 10, verseStart: 1, chapterEnd: 10, verseEnd: 3, pseukim: 3, coversAliyahId: null });
    expect(build(rows, 'Bo', 'Exodus', { wa: [wa] }).readPseukim).toBe(11);
  });

  it('credits only the not-yet-read part of a holiday reading overlapping an unread aliyah', () => {
    const rows = [bo(1, 10, 1, 10, 11, 11, false)];
    const oa   = boOccasion(1, '1', 10, 5, 10, 14, 10, '2025-04-09'); // 10:5–14; aliyah 1 ends at 10:11
    expect(build(rows, 'Bo', 'Exodus', { oa: [oa] }).readPseukim).toBe(7); // 10:5–11; 10:12–14 is outside this parsha's aliyot
  });

  it('credits only the not-yet-read part when a read aliyah and a hosafah partly overlap', () => {
    const rows = [bo(1, 10, 1, 10, 11, 11, true)];
    const hr   = makeHosafah({ sefer: 'Exodus', parsha1: 'Bo', chapterStart: 10, verseStart: 9, chapterEnd: 10, verseEnd: 14, pseukim: 6 });
    expect(build(rows, 'Bo', 'Exodus', { hr: [hr] }).readPseukim).toBe(11); // 10:12–14 lies outside this parsha's aliyot
  });

  it('ignores special readings outside the selected years', () => {
    const rows = [bo(1, 10, 1, 10, 11, 11, false)];
    const oa   = boOccasion(1, '1', 10, 1, 10, 5, 5, '2024-04-09');
    expect(build(rows, 'Bo', 'Exodus', { oa: [oa] }, { ...NO_FILTERS, years: [2025] }).readPseukim).toBe(0);
    expect(build(rows, 'Bo', 'Exodus', { oa: [oa] }, { ...NO_FILTERS, years: [2024] }).readPseukim).toBe(5);
  });

  it('ignores unread (future-only) special readings', () => {
    const rows = [bo(1, 10, 1, 10, 11, 11, false)];
    const oa   = makeOA({ parsha: 'Bo', sefer: 'Exodus', chapterStart: 10, verseStart: 1, chapterEnd: 10, verseEnd: 5, pseukim: 5, isRead: true, isReadPast: false, isReadFuture: true, orig: '2099-01-01' });
    expect(build(rows, 'Bo', 'Exodus', { oa: [oa] }).readPseukim).toBe(0);
  });

  it('credits a hosafah outside any standard aliyah once, to its first parsha', () => {
    const hr = makeHosafah({ sefer: 'Genesis', parsha1: 'Bereishit', chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 4, pseukim: 4 });
    const p  = build([], 'Bereishit', 'Genesis', { hr: [hr] });
    expect(p.readPseukim).toBe(4);
  });
});

// ── a reading spanning two parshiot ───────────────────────────────────────────

describe('buildParshaRow pseukim — hosafah spanning two parshiot', () => {
  // Genesis 1:1–10 is parsha A, 2:1–10 is parsha B (both unread). The hosafah reads 1:8–2:3.
  const rowsA = [makeRow({ sefer: 'Genesis', parsha: 'A', chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10 })];
  const rowsB = [makeRow({ sefer: 'Genesis', parsha: 'B', chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 10 })];
  const hr    = makeHosafah({ sefer: 'Genesis', parsha1: 'A', parshaId1: 1, parsha2: 'B', parshaId2: 2, isDoubleParsha: true, chapterStart: 1, verseStart: 8, chapterEnd: 2, verseEnd: 3, pseukim: 6 });

  it('credits each parsha only for the pseukim inside it', () => {
    expect(build(rowsA, 'A', 'Genesis', { hr: [hr] }).readPseukim).toBe(3); // 1:8–10
    expect(build(rowsB, 'B', 'Genesis', { hr: [hr] }).readPseukim).toBe(3); // 2:1–3
  });

  it('per-parsha figures add up to the overall figure from computeStats', () => {
    const stats = computeStats([...rowsA, ...rowsB], [], ['Genesis'], SEFER_MAP, NO_FILTERS, [], [hr]);
    const perParsha = build(rowsA, 'A', 'Genesis', { hr: [hr] }).readPseukim + build(rowsB, 'B', 'Genesis', { hr: [hr] }).readPseukim;
    expect(perParsha).toBe(effectivePseukimOf(stats));
  });
});

// ── consistency with computeStats ─────────────────────────────────────────────

describe('buildParshaRow pseukim — agrees with computeStats', () => {
  it('matches the overall read figure for Bo with its holiday readings', () => {
    const oas = [
      boOccasion(106, '1', 12, 21, 12, 24, 4, '2025-04-09'),
      boOccasion(107, '2', 12, 25, 12, 28, 4, '2025-04-09'),
      boOccasion(192, 'M', 12, 1, 12, 20, 20, '2025-02-01'),
      boOccasion(291, 'M', 12, 1, 12, 20, 20, '2025-02-01'),
    ];
    const stats = computeStats(boRows(), oas, ['Exodus'], SEFER_MAP, NO_FILTERS);
    expect(build(boRows(), 'Bo', 'Exodus', { oa: oas }).readPseukim).toBe(effectivePseukimOf(stats));
  });
});
