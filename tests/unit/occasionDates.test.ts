// @vitest-environment node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  occasionDatesFromEntries, morningReadingDatesFromEntries, yomKippurDatesFromEntries,
  normalizeHolidayTitle, type HolidayEntry,
} from '../../src/utils/occasionDates.ts';
import { HOLIDAY_CACHE } from '../../src/data/holidayCache.ts';
import { drizzleMigratedDb } from '../helpers/migrations.ts';

const dates = (entries: HolidayEntry[], name: string) => occasionDatesFromEntries(entries, [name])[name];

describe('normalizeHolidayTitle', () => {
  it('folds the typographic apostrophe', () => {
    expect(normalizeHolidayTitle('Ta’anit Esther')).toBe("Ta'anit Esther");
  });
});

describe('occasionDatesFromEntries', () => {
  it('returns nothing for a name the rules do not recognise', () => {
    expect(occasionDatesFromEntries([], ['Made Up Holiday'])).toEqual({});
  });

  it('maps direct holidays and the Mincha twin of a fast to the same dates', () => {
    const e: HolidayEntry[] = [['2026-03-02', 'Ta’anit Esther', true], ['2026-03-03', 'Purim', true]];
    expect(dates(e, "Ta'anit Esther")).toEqual(['2026-03-02']);
    expect(dates(e, "Ta'anit Esther (Mincha)")).toEqual(['2026-03-02']);
    expect(dates(e, 'Purim')).toEqual(['2026-03-03']);
  });

  it('splits a festival day by whether it falls on Shabbat', () => {
    // 2026-09-12 is a Saturday; 2025-09-23 is a Tuesday.
    const e: HolidayEntry[] = [['2026-09-12', 'Rosh Hashana 5787', true], ['2025-09-23', 'Rosh Hashana 5786', true]];
    expect(dates(e, 'Rosh Hashana Day 1 (Shabbat)')).toEqual(['2026-09-12']);
    expect(dates(e, 'Rosh Hashana Day 1')).toEqual(['2025-09-23']);
  });

  it('keeps a Yom Kippur Mincha on Shabbat too', () => {
    const e: HolidayEntry[] = [['2024-10-12', 'Yom Kippur', true]];
    expect(dates(e, 'Yom Kippur')).toEqual([]);
    expect(dates(e, 'Yom Kippur (Shabbat)')).toEqual(['2024-10-12']);
    expect(dates(e, 'Yom Kippur (Mincha)')).toEqual(['2024-10-12']);
  });

  it('does not confuse Sukkot IV with Sukkot I', () => {
    const e: HolidayEntry[] = [['2026-09-26', 'Sukkot I', true], ['2026-09-29', 'Sukkot IV (CH’’M)', true]];
    expect(dates(e, 'Sukkot Day 1 (Shabbat)')).toEqual(['2026-09-26']);
    expect(dates(e, 'Sukkot Chol HaMoed Day 2')).toEqual(['2026-09-29']);
  });

  it('puts Erev Simchat Torah on the day of Shmini Atzeret', () => {
    const e: HolidayEntry[] = [['2026-10-03', 'Shmini Atzeret', true], ['2026-10-04', 'Simchat Torah', true]];
    expect(dates(e, 'Erev Simchat Torah')).toEqual(['2026-10-03']);
    expect(dates(e, 'Simchat Torah')).toEqual(['2026-10-04']);
  });

  describe('Pesach Chol HaMoed', () => {
    const pesach = (...rows: [string, string][]): HolidayEntry[] => rows.map(([d, t]) => [d, t, true]);

    it('counts days 1–3 among weekdays and always makes VI day 4 (Pesach I on Tuesday: Shabbat is V)', () => {
      const e = pesach(
        ['2024-04-23', 'Pesach I'], ['2024-04-25', 'Pesach III (CH’’M)'], ['2024-04-26', 'Pesach IV (CH’’M)'],
        ['2024-04-27', 'Pesach V (CH’’M)'], ['2024-04-28', 'Pesach VI (CH’’M)'],
      );
      expect(dates(e, 'Pesach Chol HaMoed Day 1')).toEqual(['2024-04-25']);
      expect(dates(e, 'Pesach Chol HaMoed Day 2')).toEqual(['2024-04-26']);
      expect(dates(e, 'Pesach Chol HaMoed Day 3')).toEqual([]);
      expect(dates(e, 'Pesach Chol HaMoed Day 4')).toEqual(['2024-04-28']);
      expect(dates(e, 'Pesach Shabbat Chol HaMoed')).toEqual(['2024-04-27']);
    });

    it('uses all four weekdays when there is no Shabbat in Chol HaMoed (Pesach I on Sunday)', () => {
      const e = pesach(
        ['2025-04-13', 'Pesach I'], ['2025-04-15', 'Pesach III (CH’’M)'], ['2025-04-16', 'Pesach IV (CH’’M)'],
        ['2025-04-17', 'Pesach V (CH’’M)'], ['2025-04-18', 'Pesach VI (CH’’M)'],
      );
      expect([1, 2, 3, 4].map(n => dates(e, `Pesach Chol HaMoed Day ${n}`)?.[0])).toEqual(
        ['2025-04-15', '2025-04-16', '2025-04-17', '2025-04-18'],
      );
    });

    it('restarts the count each year', () => {
      const e = pesach(
        ['2024-04-23', 'Pesach I'], ['2024-04-25', 'Pesach III (CH’’M)'],
        ['2025-04-13', 'Pesach I'], ['2025-04-15', 'Pesach III (CH’’M)'],
      );
      expect(dates(e, 'Pesach Chol HaMoed Day 1')).toEqual(['2024-04-25', '2025-04-15']);
    });
  });

  describe('Sukkot Shabbat Chol HaMoed', () => {
    it('picks the Shabbat by which day of Sukkot it is', () => {
      // 2024-10-19 (Sat) is Sukkot III; 2023-10-01 (Sun)… use explicit Saturdays on V and VI.
      const e: HolidayEntry[] = [
        ['2024-10-19', 'Sukkot III (CH’’M)', true],
        ['2025-10-11', 'Sukkot V (CH’’M)', true],
        ['2022-10-15', 'Sukkot VI (CH’’M)', true],
      ];
      expect(dates(e, 'Sukkot Shabbat Chol HaMoed')).toEqual(['2024-10-19']);
      expect(dates(e, 'Sukkot Shabbat Chol HaMoed (Day 3)')).toEqual(['2025-10-11']);
      expect(dates(e, 'Sukkot Shabbat Chol HaMoed (Day 4)')).toEqual(['2022-10-15']);
      expect(dates(e, 'Sukkot Chol HaMoed Day 1')).toEqual([]);
    });
  });

  describe('Chanukah', () => {
    // Hebcal dates "N Candles" by the evening; the morning of day N is the next calendar date.
    const chanukah2026: HolidayEntry[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n, i): HolidayEntry => [
      `2026-12-${String(4 + i).padStart(2, '0')}`, `Chanukah: ${n} Candle${n === 1 ? '' : 's'}`, false,
    ]);
    const rc: HolidayEntry[] = [['2026-12-10', 'Rosh Chodesh Tevet', true], ['2026-12-11', 'Rosh Chodesh Tevet', true]];
    const all = [...chanukah2026, ...rc];

    it('dates day N as the day after "N Candles"', () => {
      expect(dates(all, 'Chanukah Day 2')).toEqual(['2026-12-06']);
      expect(dates(all, 'Chanukah Day 6')).toEqual(['2026-12-10']);
    });

    it('sends Shabbat days to the Shabbat occasions (day 1 and 8 are Saturdays in 2026)', () => {
      expect(dates(all, 'Chanukah Day 1')).toEqual([]);
      expect(dates(all, 'Shabbat Chanukah Day 1')).toEqual(['2026-12-05']);
      expect(dates(all, 'Shabbat Chanukah Day 8')).toEqual(['2026-12-12']);
      expect(dates(all, 'Chanukah Day 8')).toEqual([]);
    });

    it('tells day 7 on Rosh Chodesh from day 7 without', () => {
      expect(dates(all, 'Chanukah Day 7 (Rosh Chodesh)')).toEqual(['2026-12-11']);
      expect(dates(all, 'Chanukah Day 7')).toEqual([]);
    });

    it('does not count Chanukah days as plain Shabbat Rosh Chodesh', () => {
      const e: HolidayEntry[] = [...chanukah2026, ['2026-12-05', 'Rosh Chodesh Tevet', true]];
      expect(dates(e, 'Shabbat Rosh Chodesh')).toEqual([]);
    });
  });

  describe('Rosh Chodesh and special Shabbatot', () => {
    it('keeps Shabbat Rosh Chodesh to Saturdays and weekday Rosh Chodesh to the rest', () => {
      const e: HolidayEntry[] = [
        ['2026-04-17', 'Rosh Chodesh Iyyar', true], ['2026-04-18', 'Rosh Chodesh Iyyar', true],
      ];
      expect(dates(e, 'Rosh Chodesh')).toEqual(['2026-04-17']);
      expect(dates(e, 'Shabbat Rosh Chodesh')).toEqual(['2026-04-18']);
    });

    it('does not report a special Shabbat that is also Rosh Chodesh as plain Shabbat Rosh Chodesh', () => {
      const e: HolidayEntry[] = [['2025-03-01', 'Shabbat Shekalim', false], ['2025-03-01', 'Rosh Chodesh Adar', true]];
      expect(dates(e, 'Shabbat Rosh Chodesh')).toEqual([]);
    });

    it('splits Shekalim/HaChodesh on whether the Shabbat is Rosh Chodesh', () => {
      const e: HolidayEntry[] = [
        ['2026-02-14', 'Shabbat Shekalim', false],
        ['2025-03-01', 'Shabbat Shekalim', false], ['2025-03-01', 'Rosh Chodesh Adar', true],
      ];
      expect(dates(e, 'Shabbat Shekalim')).toEqual(['2026-02-14']);
      expect(dates(e, 'Shabbat Shekalim (Rosh Chodesh)')).toEqual(['2025-03-01']);
    });
  });
});

describe('morningReadingDatesFromEntries / yomKippurDatesFromEntries', () => {
  const e: HolidayEntry[] = [
    ['2026-09-14', 'Tzom Gedaliah', true], ['2026-09-20', 'Erev Yom Kippur', false],
    ['2026-09-21', 'Yom Kippur', true], ['2026-09-14', 'Another', true],
  ];

  it('lists each morning-reading date once, sorted, excluding days without a Torah reading', () => {
    expect(morningReadingDatesFromEntries(e)).toEqual(['2026-09-14', '2026-09-21']);
  });

  it('finds Yom Kippur only', () => {
    expect(yomKippurDatesFromEntries(e)).toEqual(['2026-09-21']);
  });
});

describe('against the real cache and the seeded occasions', () => {
  const dbFile = path.join(os.tmpdir(), `torah-occasion-dates-${process.pid}.db`);
  const db = drizzleMigratedDb(dbFile);
  const names = (db.prepare('SELECT name_en FROM occasions').all() as { name_en: string }[]).map(r => r.name_en);
  db.close();
  fs.rmSync(dbFile, { force: true });

  const result = occasionDatesFromEntries(HOLIDAY_CACHE, names);

  it('seeds a meaningful number of occasions', () => {
    expect(names.length).toBeGreaterThan(60);
  });

  it('has a rule for every seeded occasion, so a new one cannot silently skip autofill', () => {
    expect(names.filter(n => !(n in result))).toEqual([]);
  });

  it('finds at least one date for every occasion', () => {
    expect(names.filter(n => result[n]?.length === 0)).toEqual([]);
  });

  it('puts each date list in ascending order', () => {
    for (const list of Object.values(result)) expect(list).toEqual([...list].sort((a, b) => a.localeCompare(b)));
  });

  it('places known 2026 dates', () => {
    const in2026 = (n: string) => result[n]?.filter(d => d.startsWith('2026'));
    expect(in2026('Purim')).toEqual(['2026-03-03']);
    expect(in2026('Yom Kippur')).toEqual(['2026-09-21']);
    expect(in2026('Shabbat Zachor')).toEqual(['2026-02-28']);
    expect(in2026('Shmini Atzeret (Shabbat)')).toEqual(['2026-10-03']);
    expect(in2026('Chanukah Day 2')).toEqual(['2026-12-06']);
  });
});
