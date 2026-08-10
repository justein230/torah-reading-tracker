import { describe, it, expect } from 'vitest';
import { buildParshaRow, sortParshas } from '../../src/utils/details-utils.js';

const NO_FILTERS = { sefarim: [], years: [], includeFutureDates: false };
const TLIT = { 'בְּרֵאשִׁית': 'Bereishit' };
const SCHEDULE = { Bereishit: '2026-10-03' };

function makeRow(overrides) {
  return {
    parsha: 'בְּרֵאשִׁית', aliyah: 1, pseukim: 100, pct: 1.5, parshaPct: 100,
    isReadPast: false, isRead: false, hasFuture: false,
    orig: '', yearRead: null, allYears: [],
    ...overrides,
  };
}

// ── buildParshaRow ────────────────────────────────────────────────────────────

describe('buildParshaRow — unread parsha', () => {
  it('reports zero read aliyot and pseukim', () => {
    const rows = [makeRow({ aliyah: 1 }), makeRow({ aliyah: 2 })];
    const p = buildParshaRow(rows, 'בְּרֵאשִׁית', 'Genesis', true, NO_FILTERS, { TLIT, schedule: SCHEDULE }, 1);
    expect(p.readAliyot).toBe(0);
    expect(p.readPseukim).toBe(0);
    expect(p.lastDate).toBeNull();
  });

  it('sums total pseukim across all rows', () => {
    const rows = [makeRow({ pseukim: 60 }), makeRow({ aliyah: 2, pseukim: 40 })];
    const p = buildParshaRow(rows, 'בְּרֵאשִׁית', 'Genesis', true, NO_FILTERS, { TLIT, schedule: SCHEDULE }, 1);
    expect(p.totalPseukim).toBe(100);
  });
});

describe('buildParshaRow — fully read parsha', () => {
  it('reports parshaReadPct ~100 when all aliyot are read', () => {
    const rows = [
      makeRow({ aliyah: 1, isReadPast: true, orig: '2023-01-01', pseukim: 60, parshaPct: 60 }),
      makeRow({ aliyah: 2, isReadPast: true, orig: '2023-02-01', pseukim: 40, parshaPct: 40 }),
    ];
    const p = buildParshaRow(rows, 'בְּרֵאשִׁית', 'Genesis', true, NO_FILTERS, { TLIT, schedule: SCHEDULE }, 1);
    expect(p.parshaReadPct).toBeCloseTo(100);
    expect(p.readAliyot).toBe(2);
  });

  it('sets lastDate to the most recent read date', () => {
    const rows = [
      makeRow({ aliyah: 1, isReadPast: true, orig: '2023-01-01' }),
      makeRow({ aliyah: 2, isReadPast: true, orig: '2023-06-15' }),
    ];
    const p = buildParshaRow(rows, 'בְּרֵאשִׁית', 'Genesis', true, NO_FILTERS, { TLIT, schedule: SCHEDULE }, 1);
    expect(p.lastDate).toBe('2023-06-15');
  });
});

describe('buildParshaRow — year filter', () => {
  it('excludes rows not matching the year filter', () => {
    const rows = [
      makeRow({ aliyah: 1, isReadPast: true, orig: '2022-01-01', yearRead: 2022, allYears: [2022] }),
      makeRow({ aliyah: 2, isReadPast: true, orig: '2023-06-01', yearRead: 2023, allYears: [2023] }),
    ];
    const p = buildParshaRow(rows, 'בְּרֵאשִׁית', 'Genesis', true,
      { ...NO_FILTERS, years: [2023] }, { TLIT, schedule: SCHEDULE }, 1);
    expect(p.readAliyot).toBe(1);
  });
});

describe('buildParshaRow — nextReadDate from schedule', () => {
  it('looks up next reading date via TLIT transliteration', () => {
    const p = buildParshaRow([], 'בְּרֵאשִׁית', 'Genesis', true, NO_FILTERS, { TLIT, schedule: SCHEDULE }, 1);
    expect(p.nextReadDate).toBe('2026-10-03');
  });

  it('returns null when parsha not in schedule', () => {
    const p = buildParshaRow([], 'בְּרֵאשִׁית', 'Genesis', true, NO_FILTERS, { TLIT: {}, schedule: SCHEDULE }, 1);
    expect(p.nextReadDate).toBeNull();
  });
});

// ── sortParshas ────────────────────────────────────────────────────────────────

function makeParshaEntry(parsha, readAliyot, readPseukim, lastDate) {
  return { parsha, readAliyot, readPseukim, lastDate };
}

describe('sortParshas — order mode', () => {
  it('leaves array in original order', () => {
    const parshas = [makeParshaEntry('א', 3, 300, null), makeParshaEntry('ב', 7, 700, null)];
    sortParshas(parshas, 'order');
    expect(parshas[0].parsha).toBe('א');
    expect(parshas[1].parsha).toBe('ב');
  });
});

describe('sortParshas — complete mode', () => {
  it('puts most-read parsha first', () => {
    const parshas = [makeParshaEntry('few', 1, 100, null), makeParshaEntry('many', 5, 500, null)];
    sortParshas(parshas, 'complete');
    expect(parshas[0].parsha).toBe('many');
  });

  it('breaks ties by readPseukim', () => {
    const parshas = [
      makeParshaEntry('low-pseukim', 3, 100, null),
      makeParshaEntry('hi-pseukim',  3, 300, null),
    ];
    sortParshas(parshas, 'complete');
    expect(parshas[0].parsha).toBe('hi-pseukim');
  });
});

describe('sortParshas — recent mode', () => {
  it('puts most recently read parsha first', () => {
    const parshas = [
      makeParshaEntry('old',    1, 100, '2021-01-01'),
      makeParshaEntry('recent', 1, 100, '2024-06-01'),
    ];
    sortParshas(parshas, 'recent');
    expect(parshas[0].parsha).toBe('recent');
  });

  it('sinks unread parshas (null lastDate) to the end', () => {
    const parshas = [
      makeParshaEntry('unread', 0, 0, null),
      makeParshaEntry('read',   1, 100, '2023-03-01'),
    ];
    sortParshas(parshas, 'recent');
    expect(parshas[0].parsha).toBe('read');
    expect(parshas[1].parsha).toBe('unread');
  });

  it('keeps two unread parshas in stable order', () => {
    const parshas = [makeParshaEntry('א', 0, 0, null), makeParshaEntry('ב', 0, 0, null)];
    sortParshas(parshas, 'recent');
    expect(parshas[0].parsha).toBe('א');
    expect(parshas[1].parsha).toBe('ב');
  });
});
