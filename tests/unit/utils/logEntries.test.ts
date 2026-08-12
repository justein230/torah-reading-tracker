import { describe, it, expect } from 'vitest';
import {
  collectReadings, collectSpecialEntries, collectWeekdayEntries, collectHosafotEntries,
  groupDoubleParsha, type DisplayEntry,
} from '../../../src/utils/logEntries.js';
import { makeRow, makeOA, makeWA, makeHosafah, makeSpecial } from '../../helpers/fixtures.js';
import type { Filters, Stats } from '../../../src/types/index.js';

const FILTERS: Filters = { sefarim: [], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false };
const STATS = { totalPseukim: 100 } as Stats;

describe('collectReadings — holiday-derived suppression', () => {
  it('keeps a genuinely-read standard aliyah (directOrig set)', () => {
    const row = makeRow({ isRead: true, orig: '2024-03-01', directOrig: '2024-03-01', yearRead: 2024 });
    const out = collectReadings([row], FILTERS);
    expect(out).toHaveLength(1);
    expect(out[0]!.displayDate).toBe('2024-03-01');
    expect(out[0]!.displayYear).toBe(2024);
  });

  it('suppresses a row whose read date came only from holiday coverage (orig set, directOrig empty)', () => {
    const row = makeRow({ isRead: true, orig: '2024-04-23', directOrig: '', yearRead: 2024 });
    expect(collectReadings([row], FILTERS)).toHaveLength(0);
  });

  it('uses directOrig (not orig) as the display date when they differ', () => {
    const row = makeRow({ isRead: true, orig: '2024-04-23', directOrig: '2024-05-10', yearRead: 2024 });
    const out = collectReadings([row], FILTERS);
    expect(out[0]!.displayDate).toBe('2024-05-10');
  });

  it('respects the sefer filter', () => {
    const row = makeRow({ sefer: 'Genesis', isRead: true, orig: '2024-03-01', directOrig: '2024-03-01' });
    expect(collectReadings([row], { ...FILTERS, sefarim: ['Exodus'] })).toHaveLength(0);
  });

  it('respects the year filter', () => {
    const row = makeRow({ isRead: true, orig: '2024-03-01', directOrig: '2024-03-01' });
    expect(collectReadings([row], { ...FILTERS, years: [2023] })).toHaveLength(0);
  });

  it('still emits future re-reads even when the base read is holiday-derived', () => {
    const row = makeRow({
      isRead: true, orig: '2024-04-23', directOrig: '', hasFuture: true, futDates: ['2099-06-01'],
    });
    const out = collectReadings([row], { ...FILTERS, includeFutureDates: true });
    expect(out).toHaveLength(1);
    expect(out[0]!.reread).toBe(true);
    expect(out[0]!.displayDate).toBe('2099-06-01');
  });
});

describe('collectSpecialEntries', () => {
  it('maps a holiday reading using its occasion aliyah for the verse range', () => {
    const oa = makeOA({ id: 7, sefer: 'Genesis', chapterStart: 12, verseStart: 1, chapterEnd: 12, verseEnd: 8 });
    const sr = makeSpecial({ occasionAliyahId: 7, occasionEn: 'Pesach', pseukim: 8, dateRead: '2024-04-23' });
    const out = collectSpecialEntries([sr], [oa], STATS, FILTERS);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      occasion: 'Pesach', pseukim: 8, pct: 8, displayDate: '2024-04-23',
      chapterStart: 12, verseEnd: 8,
    });
  });

  it('skips a holiday reading with no dateRead', () => {
    const sr = makeSpecial({ dateRead: '' });
    expect(collectSpecialEntries([sr], [], STATS, FILTERS)).toHaveLength(0);
  });

  it('filters by the occasion aliyah sefer', () => {
    const oa = makeOA({ id: 7, sefer: 'Genesis' });
    const sr = makeSpecial({ occasionAliyahId: 7 });
    expect(collectSpecialEntries([sr], [oa], STATS, { ...FILTERS, sefarim: ['Exodus'] })).toHaveLength(0);
  });
});

describe('collectWeekdayEntries', () => {
  it('maps a weekday reading and skips entries with an empty dateRead', () => {
    const read    = makeWA({ id: 1, dateRead: '2024-01-15', pseukim: 5, aliyahNum: 3 });
    const notRead = makeWA({ id: 2, dateRead: '' });
    const out = collectWeekdayEntries([read, notRead], STATS, FILTERS);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ aliyah: 3, pseukim: 5, pct: 5, displayDate: '2024-01-15' });
  });
});

describe('collectHosafotEntries', () => {
  it('maps a hosafah and respects the sefer filter', () => {
    const hr = makeHosafah({ sefer: 'Genesis', dateRead: '2024-02-01', pseukim: 4 });
    expect(collectHosafotEntries([hr], STATS, FILTERS)).toHaveLength(1);
    expect(collectHosafotEntries([hr], STATS, { ...FILTERS, sefarim: ['Exodus'] })).toHaveLength(0);
  });
});

// ── groupDoubleParsha — the totals-sensitive core ────────────────────────────

function dpComponent(over: Partial<DisplayEntry>): DisplayEntry {
  return {
    sefer: 'Leviticus', parsha: 'Tazria', aliyah: 1,
    pairName: 'תזריע-מצורע', pairNameEn: 'Tazria-Metzora', combinedAliyah: 1, readAsDouble: true,
    pseukim: 0, pct: 0, occasion: '', location: '', reread: false,
    displayDate: '2024-04-13', displayYear: 2024,
    ...over,
    kind: over.kind ?? 'standard',
  };
}

describe('groupDoubleParsha', () => {
  it('collapses the components of one combined aliyah into a single summed summary', () => {
    const day = [
      dpComponent({ aliyah: 1, pseukim: 13, pct: 3 }),
      dpComponent({ aliyah: 2, pseukim: 12, pct: 2 }),
      dpComponent({ aliyah: 3, pseukim: 6,  pct: 1 }),
    ];
    const { combined, singles } = groupDoubleParsha(day);
    expect(singles).toHaveLength(0);
    expect(combined).toHaveLength(1);
    expect(combined[0]!.components).toHaveLength(3);
    expect(combined[0]!.summary).toMatchObject({
      isDoubleParsha: true, pairNameEn: 'Tazria-Metzora', combinedAliyah: 1,
      pseukim: 31, pct: 6,
    });
  });

  it('keeps distinct combined aliyot read on the same date as separate groups', () => {
    const day = [
      dpComponent({ combinedAliyah: 1, aliyah: 1, pseukim: 10 }),
      dpComponent({ combinedAliyah: 2, aliyah: 4, pseukim: 5 }),
    ];
    const { combined } = groupDoubleParsha(day);
    expect(combined).toHaveLength(2);
    expect(combined.map(c => c.summary.combinedAliyah)).toEqual([1, 2]);
  });

  it('marks the summary re-read only when every component is a re-read', () => {
    const allReread = groupDoubleParsha([
      dpComponent({ aliyah: 1, reread: true }),
      dpComponent({ aliyah: 2, reread: true }),
    ]);
    expect(allReread.combined[0]!.summary.reread).toBe(true);

    const mixed = groupDoubleParsha([
      dpComponent({ aliyah: 1, reread: true }),
      dpComponent({ aliyah: 2, reread: false }),
    ]);
    expect(mixed.combined[0]!.summary.reread).toBe(false);
  });

  it('groups a partially-read combined aliyah from only the components present', () => {
    const { combined } = groupDoubleParsha([dpComponent({ aliyah: 1, pseukim: 13, pct: 3 })]);
    expect(combined).toHaveLength(1);
    expect(combined[0]!.components).toHaveLength(1);
    expect(combined[0]!.summary.pseukim).toBe(13);
  });

  it('does NOT group a pairable parsha read standalone (carries pair metadata but readAsDouble is false)', () => {
    // Balak belongs to the Chukat-Balak pair, so its aliyot have pairName/combinedAliyah set even
    // when read on their own in a regular year. Only readAsDouble should trigger grouping.
    const standalone = dpComponent({ parsha: 'Balak', pairNameEn: 'Chukat-Balak', readAsDouble: false });
    const { combined, singles } = groupDoubleParsha([standalone]);
    expect(combined).toHaveLength(0);
    expect(singles).toEqual([standalone]);
  });

  it('leaves non-double-parsha entries as singles', () => {
    const single: DisplayEntry = {
      sefer: 'Genesis', parsha: 'Bereishit', aliyah: 1, pairName: '', pairNameEn: '', combinedAliyah: null,
      pseukim: 10, pct: 1, occasion: '', location: '', reread: false, displayDate: '2024-04-13', displayYear: 2024, kind: 'standard',
    };
    const { combined, singles } = groupDoubleParsha([single]);
    expect(combined).toHaveLength(0);
    expect(singles).toEqual([single]);
  });

  it('does not double-count: summed summary pseukim equal the raw component total exactly once', () => {
    const day = [
      dpComponent({ aliyah: 1, pseukim: 13, pct: 3 }),
      dpComponent({ aliyah: 2, pseukim: 12, pct: 2 }),
    ];
    const { combined, singles } = groupDoubleParsha(day);
    const topTotal = [...combined.map(c => c.summary), ...singles]
      .reduce((s, r) => s + (Number(r.aliyah) === 8 ? 0 : r.pseukim), 0);
    expect(topTotal).toBe(25); // 13 + 12, components not counted on top of the summary
  });
});
