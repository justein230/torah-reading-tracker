import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah, Filters, ParshaRow } from '../types/index.js';

export interface PartialSources {
  oa: MappedOccasionAliyah[];
  wa: MappedWeekdayAliyah[];
  hr: MappedHosafah[];
  totalTorahPseukim: number;
}

type Lookup = { TLIT: Record<string, string>; schedule: Record<string, string>; partials?: PartialSources };

function sumPartialPseukim(parsha: string, filters: Filters, partials: PartialSources): number {
  const { years } = filters;
  function yearOk(dateStr: string): boolean {
    if (!years.length || !dateStr) return true;
    return years.includes(new Date(dateStr + 'T00:00:00').getFullYear());
  }
  let sum = 0;
  for (const o of partials.oa) {
    if (o.parsha === parsha && o.isReadPast && yearOk(o.orig)) sum += o.pseukim;
  }
  for (const w of partials.wa) {
    if (w.parsha === parsha && w.isReadPast && yearOk(w.dateRead)) sum += w.pseukim;
  }
  for (const h of partials.hr) {
    if (h.parsha1 === parsha && h.isReadPast && yearOk(h.dateRead)) sum += h.pseukim;
  }
  return sum;
}

export function buildParshaRow(
  rows: MappedRow[],
  parsha: string,
  sefer: string,
  seferOk: boolean,
  filters: Filters,
  lookup: Lookup,
  idx: number,
): ParshaRow {
  const { TLIT, schedule, partials } = lookup;
  const readRows = rows.filter(r => {
    if (!r.isReadPast) return false;
    if (!filters.years.length) return true;
    return filters.includeFutureDates
      ? filters.years.some(y => r.allYears.includes(y))
      : filters.years.includes(r.yearRead as number);
  });

  const totalPseukim  = rows.reduce((sum, r) => sum + r.pseukim, 0);
  const totalPct      = rows.reduce((sum, r) => sum + r.pct, 0);
  const readPseukim   = readRows.reduce((sum, r) => sum + r.pseukim, 0);
  const readPct       = readRows.reduce((sum, r) => sum + r.pct, 0);
  const parshaReadPct = readRows.reduce((sum, r) => sum + (r.parshaPct ?? 0), 0);
  const readSet       = new Set(readRows.map(r => r.aliyah));
  const hasFutureSet  = new Set(rows.filter(r => r.hasFuture).map(r => r.aliyah));
  const dates         = readRows.map(r => r.orig).filter(Boolean).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const lastDate      = dates.length ? (dates[dates.length - 1] ?? null) : null;
  const nextReadDate  = schedule[TLIT[parsha] ?? ''] ?? null;

  const partialPs    = partials ? sumPartialPseukim(parsha, filters, partials) : 0;
  const partialPct   = partials && partials.totalTorahPseukim > 0 ? partialPs / partials.totalTorahPseukim * 100 : 0;
  const partialPPct  = totalPseukim > 0 ? partialPs / totalPseukim * 100 : 0;

  return {
    idx, parsha, sefer, seferOk,
    readAliyot: readRows.length,
    readPseukim: readPseukim + partialPs,
    readPct: readPct + partialPct,
    parshaReadPct: parshaReadPct + partialPPct,
    totalPseukim, totalPct,
    readSet, hasFutureSet, lastDate, nextReadDate, rows,
  };
}

/**
 * Sorts a parshas array in-place according to sortMode.
 * 'order'    — natural Torah order (no-op; caller builds in order)
 * 'complete' — most-read aliyot first, then most pseukim
 * 'recent'   — most recently read first; unread parshas sink to end
 */
export function sortParshas(parshas: ParshaRow[], sortMode: string): ParshaRow[] {
  if (sortMode === 'complete') {
    parshas.sort((a, b) => b.readAliyot - a.readAliyot || b.readPseukim - a.readPseukim);
  } else if (sortMode === 'recent') {
    parshas.sort((a, b) => {
      if (!a.lastDate && !b.lastDate) return 0;
      if (!a.lastDate) return 1;
      if (!b.lastDate) return -1;
      return new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime();
    });
  }
  return parshas;
}
