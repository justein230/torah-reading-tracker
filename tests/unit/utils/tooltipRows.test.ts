import { describe, it, expect } from 'vitest';
import { standardTip, occasionTip, weekdayTip, doublePairTip } from '../../../src/utils/tooltipRows.js';
import { fmtDate } from '../../../src/utils/format.js';
import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, SeferMeta, TipData } from '../../../src/types/index.js';

const TODAY = '2025-01-01';
const SEFER_MAP = { בראשית: { en: 'Genesis', color: '#4a7c59' } } as unknown as Record<string, SeferMeta>;
const TLIT = { נח: 'Noach' };

const row = (over: Partial<MappedRow> = {}): MappedRow => ({
  sefer: 'בראשית', parsha: 'נח', aliyah: 3, pairName: '', pairNameEn: '', combinedAliyah: null,
  pseukim: 20, pct: 1.25, parshaPct: 10,
  chapterStart: 1, verseStart: 1, chapterEnd: 2, verseEnd: 5,
  orig: '2024-01-01', directOrig: '2024-01-01', readAsDouble: false, partialOrig: '', futurePartialOrig: '',
  isCoveredPast: false, futDates: [], isRead: true, isReadPast: true, isReadFuture: false, hasFuture: false,
  isFuture: false, isReread: false, yearRead: 2024, futureYear: null, allYears: [2024],
  occasion: '', location: '', rereadCount: 0, ...over,
}) as MappedRow;

const occasion = (over: Partial<MappedOccasionAliyah> = {}): MappedOccasionAliyah => ({
  id: 1, occasionId: 1, occasion: 'פורים', occasionEn: 'Purim', category: 'holiday',
  aliyahKey: 'purim-1', isShabbatVariant: false, parshaId: 1, parsha: 'נח', parshaEn: 'Noach',
  sefer: 'בראשית', seferEn: 'Genesis', seferColor: '#4a7c59', pseukim: 15,
  chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 15,
  coversAliyahId: null, orig: '2024-03-01', allDates: ['2024-03-01'], readCount: 1,
  isRead: true, isReadPast: true, isReadFuture: false, hasFuture: false, partialOrig: '', futurePartialOrig: '', isCoveredPast: false,
  ...over,
});

const weekday = (over: Partial<MappedWeekdayAliyah> = {}): MappedWeekdayAliyah => ({
  id: 1, parshaId: 1, aliyahNum: 1, parsha: 'נח', parshaEn: 'Noach',
  sefer: 'בראשית', seferEn: 'Genesis', seferColor: '#4a7c59', pseukim: 8,
  chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 8,
  coversAliyahId: null, dateRead: '2024-01-04', allDates: ['2024-01-04'], readingId: 1,
  isReadPast: true, isReadFuture: false, hasFuture: false, partialOrig: '', futurePartialOrig: '', isCoveredPast: false,
  location: '', note: '', ...over,
});

const value = (tip: TipData, k: string) => tip._tipRows.find(r => r.k === k)?.v;
const keys  = (tip: TipData) => tip._tipRows.map(r => r.k);

describe('standardTip', () => {
  it('titles the tip with the transliterated parsha and aliyah, in the sefer’s colour', () => {
    const tip = standardTip(row(), SEFER_MAP, TLIT);
    expect(tip).toMatchObject({ _color: '#4a7c59', _tlit: 'Noach', _aliyah: 'Aliyah 3' });
    expect(value(tip, 'Pseukim')).toBe(20);
    expect(value(tip, '% of Parsha')).toBe('10.0%');
    expect(value(tip, '% of Torah')).toBe('1.25%');
    expect(value(tip, 'Verses')).toBe('1:1–2:5');
  });

  it('falls back to a default colour and the Hebrew name when the sefer / transliteration is unknown', () => {
    const tip = standardTip(row({ sefer: 'unknown', parsha: 'zzz' }), SEFER_MAP, TLIT);
    expect(tip).toMatchObject({ _color: '#888', _tlit: 'zzz' });
  });

  it.each([
    ['a past reading is "Read"',            { isReadFuture: false },                                'Read'],
    ['a scheduled reading is "Upcoming"',   { isReadFuture: true, isReadPast: false },              'Upcoming'],
  ])('%s', (_label, over, label) => {
    expect(keys(standardTip(row(over), SEFER_MAP, TLIT))).toContain(label);
  });

  it('shows partial rows only while unread', () => {
    const unread = row({ isRead: false, isReadPast: false, orig: '', partialOrig: '2023-05-01', futurePartialOrig: '2026-05-01' });
    expect(value(standardTip(unread, SEFER_MAP, TLIT), 'Partial read')).not.toBeUndefined();
    expect(value(standardTip(unread, SEFER_MAP, TLIT), 'Scheduled Partial')).not.toBeUndefined();
    const read = { ...unread, isRead: true };
    expect(keys(standardTip(read, SEFER_MAP, TLIT))).not.toContain('Partial read');
    expect(keys(standardTip(read, SEFER_MAP, TLIT))).not.toContain('Scheduled Partial');
  });

  it('adds occasion, re-read dates and double-parsha rows when present, and omits Verses without a range', () => {
    const tip = standardTip(row({ occasion: 'Bar Mitzvah', hasFuture: true, futDates: ['2026-01-01'], pairName: 'נצבים-וילך', chapterStart: -1 }), SEFER_MAP, TLIT);
    expect(value(tip, 'Occasion')).toBe('Bar Mitzvah');
    expect(keys(tip)).toEqual(expect.arrayContaining(['Re-read on', 'Double Parsha']));
    expect(keys(tip)).not.toContain('Verses');
  });
});

describe('occasionTip', () => {
  it('uses the occasion name as the title', () => {
    const tip = occasionTip(occasion(), 'Purim', 1000, TODAY);
    expect(tip).toMatchObject({ _tlit: 'Purim', _color: '#4a7c59' });
    expect(keys(tip)).toContain('Read');
  });

  it('shows — for % of Torah when the total is zero', () => {
    expect(value(occasionTip(occasion(), 'Purim', 0, TODAY), '% of Torah')).toBe('—');
  });

  it('lists only future dates under Re-read on, judged against the given today', () => {
    const oa = occasion({ hasFuture: true, allDates: ['2024-03-01', '2025-01-01', '2025-01-02'] });
    expect(value(occasionTip(oa, 'Purim', 1000, TODAY), 'Re-read on')).toBe(fmtDate('2025-01-02'));
    expect(value(occasionTip(oa, 'Purim', 1000, '2099-01-01'), 'Re-read on')).toBe('');
  });

  it('labels a scheduled reading Upcoming rather than Read', () => {
    const keysOf = keys(occasionTip(occasion({ isReadPast: false, isReadFuture: true }), 'Purim', 1000, TODAY));
    expect(keysOf).toContain('Upcoming');
    expect(keysOf).not.toContain('Read');
  });
});

describe('weekdayTip', () => {
  it('titles with the parsha and "Weekday N", and shows the read date', () => {
    const tip = weekdayTip(weekday(), 1000, TODAY);
    expect(tip).toMatchObject({ _tlit: 'Noach', _aliyah: 'Weekday 1' });
    expect(keys(tip)).toContain('Read');
  });

  it('shows the coveredBy row when unread but covered by another reading', () => {
    const tip = weekdayTip(weekday({ isReadPast: false, dateRead: '' }), 1000, TODAY, { date: '2024-02-01', label: 'Covered by Shabbat' });
    expect(keys(tip)).toContain('Covered by Shabbat');
    expect(keys(tip)).not.toContain('Partial read');
  });

  it('shows partial rows when unread and not covered', () => {
    const tip = weekdayTip(weekday({ isReadPast: false, dateRead: '', partialOrig: '2023-01-01', futurePartialOrig: '2026-01-01' }), 1000, TODAY);
    expect(keys(tip)).toEqual(expect.arrayContaining(['Partial read', 'Scheduled Partial']));
  });
});

describe('doublePairTip', () => {
  const build = (rows: MappedRow[], pairTotal = 40) => doublePairTip('ניצבים-וילך', 'Nitzavim-Vayeilech', 7, rows, '#123456', pairTotal, TLIT);

  it('sums pseukim and Torah % over the rows and lists the regular aliyot', () => {
    const tip = build([row({ pseukim: 10, pct: 1 }), row({ aliyah: 4, pseukim: 15, pct: 0.5 })]);
    expect(tip).toMatchObject({ _tlit: 'Nitzavim-Vayeilech', _aliyah: 'Aliyah 7', _color: '#123456' });
    expect(value(tip, 'Pseukim')).toBe(25);
    expect(value(tip, '% of Torah')).toBe('1.50%');
    expect(value(tip, '% of Double Parsha')).toBe('62.5%');
    expect(value(tip, 'Regular Aliyot')).toBe('Noach 3, Noach 4');
  });

  it('shows — for % of Double Parsha with a zero total, and — for Verses with no rows', () => {
    const tip = build([], 0);
    expect(value(tip, '% of Double Parsha')).toBe('—');
    expect(value(tip, 'Verses')).toBe('—');
  });

  it('reports Read / Upcoming only from rows read as a double', () => {
    const tip = build([row({ readAsDouble: true }), row({ readAsDouble: true, isReadPast: false, isReadFuture: true, orig: '2026-01-01' })]);
    expect(keys(tip)).toEqual(expect.arrayContaining(['Read', 'Upcoming']));
    expect(keys(tip)).not.toContain('Partial read');
  });

  it('otherwise shows the earliest partial and scheduled-partial dates', () => {
    const tip = build([
      row({ readAsDouble: false, orig: '2023-06-01', partialOrig: '2022-01-01', futurePartialOrig: '2027-01-01' }),
      row({ readAsDouble: false, isReadPast: false, orig: '', partialOrig: '', futurePartialOrig: '2026-01-01' }),
    ]);
    expect(value(tip, 'Partial read')).toBe(fmtDate('2022-01-01'));
    expect(value(tip, 'Scheduled Partial')).toBe(fmtDate('2026-01-01'));
  });

  it('merges re-read dates across rows without duplicates', () => {
    const tip = build([row({ futDates: ['2026-01-01', '2027-01-01'] }), row({ futDates: ['2026-01-01'] })]);
    expect(value(tip, 'Re-read on')).toBe(`${fmtDate('2026-01-01')}, ${fmtDate('2027-01-01')}`);
  });
});
