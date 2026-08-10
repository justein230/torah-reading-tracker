// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { scheduleFromEntries, normalizeParshaName, entriesFromHebcalItems } from '../../src/utils/sedra.ts';

const KNOWN = new Set(['Bereshit', 'Noach', 'Lech-Lecha', 'Vayakhel', 'Pekudei', "Sh'lach", "Re'eh"]);

describe('normalizeParshaName', () => {
  it('strips the "Parashat " prefix', () => {
    expect(normalizeParshaName('Parashat Bereshit')).toBe('Bereshit');
  });

  it('folds the typographic apostrophe (U+2019) to ASCII', () => {
    expect(normalizeParshaName('Parashat Sh’lach')).toBe("Sh'lach");
    expect(normalizeParshaName('Parashat Re’eh')).toBe("Re'eh");
  });

  it('leaves a plain hyphenated name untouched', () => {
    expect(normalizeParshaName('Parashat Vayakhel-Pekudei')).toBe('Vayakhel-Pekudei');
  });
});

describe('entriesFromHebcalItems', () => {
  it('keeps only parashat items and normalizes their names', () => {
    const items = [
      { title: 'Parashat Sh’lach', date: '2026-06-13T00:00:00', category: 'parashat' },
      { title: 'Rosh Hashana',     date: '2026-09-12T00:00:00', category: 'holiday'  },
    ];
    expect(entriesFromHebcalItems(items)).toEqual([['2026-06-13', "Sh'lach"]]);
  });
});

describe('scheduleFromEntries', () => {
  const entries = [
    ['2026-01-03', 'Bereshit'],
    ['2027-01-02', 'Bereshit'],          // later occurrence — must not overwrite
    ['2026-02-14', 'Vayakhel-Pekudei'],
    ['2025-12-01', 'Noach'],             // before `today` — ignored
  ] as const;

  it('maps each parsha to its first date on or after today', () => {
    const s = scheduleFromEntries(entries, KNOWN, '2026-01-01');
    expect(s['Bereshit']).toBe('2026-01-03');
  });

  it('ignores entries before today', () => {
    const s = scheduleFromEntries(entries, KNOWN, '2026-01-01');
    expect(s).not.toHaveProperty('Noach');
  });

  it('credits both halves of a combined parsha when both are known', () => {
    const s = scheduleFromEntries(entries, KNOWN, '2026-01-01');
    expect(s['Vayakhel-Pekudei']).toBe('2026-02-14');
    expect(s['Vayakhel']).toBe('2026-02-14');
    expect(s['Pekudei']).toBe('2026-02-14');
  });

  it('does not split a hyphenated name whose halves are not known parshiot', () => {
    const s = scheduleFromEntries([['2026-05-02', 'Lech-Lecha']] as const, KNOWN, '2026-01-01');
    expect(s['Lech-Lecha']).toBe('2026-05-02');
    expect(s).not.toHaveProperty('Lech');
    expect(s).not.toHaveProperty('Lecha');
  });
});
