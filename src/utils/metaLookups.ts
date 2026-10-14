import type { MetaResult, MappedRow, ParshaPair, SeferMeta } from '../types/index.js';

/** The lookup tables the whole UI reads, derived once from /api/meta and the aliyot rows. */
export interface MetaLookups {
  SEFER_ORDER: string[];
  SEFER_MAP: Record<string, SeferMeta>;
  TLIT: Record<string, string>;
  pairs: ParshaPair[];
  parshaById: Record<number, string>;
  /** sefer → its parshiot in reading order. */
  parshaIndex: Record<string, string[]>;
  /** Every year with a reading (past or scheduled), ascending. */
  allYears: number[];
}

export const EMPTY_LOOKUPS: MetaLookups = {
  SEFER_ORDER: [], SEFER_MAP: {}, TLIT: {}, pairs: [], parshaById: {}, parshaIndex: {}, allYears: [],
};

export function buildMetaLookups(meta: MetaResult, rows: MappedRow[]): MetaLookups {
  const SEFER_ORDER = meta.sefarim.map(s => s.name);
  const SEFER_MAP: Record<string, SeferMeta> = {};
  for (const s of meta.sefarim) SEFER_MAP[s.name] = { en: s.name_en, color: s.color, chapterVerses: s.chapter_verses };

  const TLIT: Record<string, string> = {};
  const parshaById: Record<number, string> = {};
  for (const p of meta.parshiot) { TLIT[p.name] = p.name_en; parshaById[p.id] = p.name; }

  const parshaIndex: Record<string, string[]> = {};
  for (const s of SEFER_ORDER) parshaIndex[s] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const key = r.sefer + '|' + r.parsha;
    if (!seen.has(key)) { seen.add(key); parshaIndex[r.sefer]?.push(r.parsha); }
  }

  const years = new Set<number>();
  for (const r of rows) {
    if (r.yearRead)   years.add(r.yearRead);
    if (r.futureYear) years.add(r.futureYear);
  }

  return { SEFER_ORDER, SEFER_MAP, TLIT, pairs: meta.pairs ?? [], parshaById, parshaIndex, allYears: [...years].sort((a, b) => a - b) };
}
