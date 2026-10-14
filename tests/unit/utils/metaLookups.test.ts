import { describe, it, expect } from 'vitest';
import { buildMetaLookups } from '../../../src/utils/metaLookups.js';
import type { MetaResult, MappedRow } from '../../../src/types/index.js';

const META = {
  sefarim: [
    { name: 'בראשית', name_en: 'Genesis', color: '#111', chapter_verses: [31, 25] },
    { name: 'שמות',   name_en: 'Exodus',  color: '#222', chapter_verses: [22] },
  ],
  parshiot: [
    { id: 1, name: 'בראשית', name_en: 'Bereshit' },
    { id: 2, name: 'נח',     name_en: 'Noach' },
    { id: 3, name: 'שמות',   name_en: 'Shemot' },
  ],
  pairs: [{ id: 9, name: 'a-b', name_en: 'A-B', parsha1_id: 1, parsha2_id: 2 }],
} as unknown as MetaResult;

const row = (sefer: string, parsha: string, yearRead: number | null, futureYear: number | null = null) =>
  ({ sefer, parsha, yearRead, futureYear }) as MappedRow;

describe('buildMetaLookups', () => {
  it('derives the sefer order and map, transliterations, and parsha ids', () => {
    const l = buildMetaLookups(META, []);
    expect(l.SEFER_ORDER).toEqual(['בראשית', 'שמות']);
    expect(l.SEFER_MAP['שמות']).toEqual({ en: 'Exodus', color: '#222', chapterVerses: [22] });
    expect(l.TLIT).toEqual({ בראשית: 'Bereshit', נח: 'Noach', שמות: 'Shemot' });
    expect(l.parshaById).toEqual({ 1: 'בראשית', 2: 'נח', 3: 'שמות' });
    expect(l.pairs).toEqual(META.pairs);
  });

  it('lists each sefer’s parshiot once, in row order, with empty seferim kept', () => {
    const rows = [row('בראשית', 'בראשית', null), row('בראשית', 'בראשית', null), row('בראשית', 'נח', null)];
    expect(buildMetaLookups(META, rows).parshaIndex).toEqual({ בראשית: ['בראשית', 'נח'], שמות: [] });
  });

  it('collects read and scheduled years, deduplicated and ascending', () => {
    const rows = [row('בראשית', 'נח', 2025, 2027), row('בראשית', 'נח', 2023), row('בראשית', 'נח', 2025), row('בראשית', 'נח', null)];
    expect(buildMetaLookups(META, rows).allYears).toEqual([2023, 2025, 2027]);
  });

  it('defaults pairs to an empty list when the server sends none', () => {
    expect(buildMetaLookups({ ...META, pairs: undefined } as unknown as MetaResult, []).pairs).toEqual([]);
  });
});
