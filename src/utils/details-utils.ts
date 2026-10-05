import { computeStats, effectivePseukimOf, verseKeysForRange } from '../compute.js';
import type { MappedRow, SeferMeta, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah, Filters, ParshaRow } from '../types/index.js';

interface PartialSources {
  oa: MappedOccasionAliyah[];
  wa: MappedWeekdayAliyah[];
  hr: MappedHosafah[];
  totalTorahPseukim: number;
}

type Lookup = {
  TLIT: Record<string, string>;
  schedule: Record<string, string>;
  seferMap: Record<string, SeferMeta>;
  partials?: PartialSources;
};

type SpecialReadings = Pick<PartialSources, 'oa' | 'wa' | 'hr'>;

function isReadInYears<T extends { isReadPast: boolean }>(item: T, dateOf: (item: T) => string, years: number[]): boolean {
  if (!item.isReadPast) return false;
  const date = dateOf(item);
  if (!years.length || !date) return true;
  return years.includes(new Date(date + 'T00:00:00').getFullYear());
}

/**
 * The special readings that count toward one parsha: read within the selected years and either
 * touching the parsha's standard verses (so a reading that straddles two parshiot reaches both;
 * computeStats then credits each only for the pseukim inside it) or, for a hosafah outside every
 * standard verse, attributed to its first parsha.
 */
function specialReadingsForParsha(parsha: string, rows: MappedRow[], filters: Filters, seferMap: Record<string, SeferMeta>, partials: SpecialReadings): SpecialReadings {
  const { years } = filters;
  const standardKeys = new Set(rows.flatMap(r => verseKeysForRange(r, seferMap)));
  const touches = (item: Parameters<typeof verseKeysForRange>[0]): boolean =>
    verseKeysForRange(item, seferMap).some(k => standardKeys.has(k));
  return {
    oa: partials.oa.filter(o => isReadInYears(o, x => x.orig,     years) && (o.parsha  === parsha || touches(o))),
    wa: partials.wa.filter(w => isReadInYears(w, x => x.dateRead, years) && (w.parsha  === parsha || touches(w))),
    hr: partials.hr.filter(h => isReadInYears(h, x => x.dateRead, years) && (h.parsha1 === parsha || touches(h))),
  };
}

// Rows that count as read under the page's own year rule stay read; every other row is treated as
// unread so computeStats still sees its verses as standard (and so credits overlapping special
// readings only for pasuk not yet covered) without counting it as read.
function withReadStateOf(rows: MappedRow[], readRows: MappedRow[]): MappedRow[] {
  const read = new Set(readRows);
  return rows.map(r => read.has(r) ? r : { ...r, isRead: false, isReadPast: false });
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
  const { TLIT, schedule, seferMap, partials } = lookup;
  const readRows = rows.filter(r => {
    if (!r.isReadPast) return false;
    if (!filters.years.length) return true;
    return filters.includeFutureDates
      ? filters.years.some(y => r.allYears.includes(y))
      : filters.years.includes(r.yearRead as number);
  });

  // Pseukim come from computeStats, the single place that de-duplicates by pasuk, so this page can
  // never disagree with the Hero/cards. Year and sefer rules are already applied above.
  const special = specialReadingsForParsha(parsha, rows, filters, seferMap, partials ?? { oa: [], wa: [], hr: [] });
  const stats = computeStats(
    withReadStateOf(rows, readRows), special.oa, [sefer], seferMap,
    { ...filters, years: [], sefarim: [] }, special.wa, special.hr,
  );
  const totalPseukim  = stats.totalPseukim;
  const readPseukim   = effectivePseukimOf(stats);
  const totalPct      = rows.reduce((sum, r) => sum + r.pct, 0);
  const readPct       = readRows.reduce((sum, r) => sum + r.pct, 0);
  const parshaReadPct = readRows.reduce((sum, r) => sum + (r.parshaPct ?? 0), 0);
  const readSet       = new Set(readRows.map(r => r.aliyah));
  const hasFutureSet  = new Set(rows.filter(r => r.hasFuture).map(r => r.aliyah));
  const dates         = readRows.map(r => r.orig).filter(Boolean).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  const lastDate      = dates.length ? (dates.at(-1) ?? null) : null;
  const nextReadDate  = schedule[TLIT[parsha] ?? ''] ?? null;

  // Pseukim credited by special readings on top of the standard aliyot, as a share of the Torah / this parsha.
  const specialPs    = stats.specialReadPseukim;
  const partialPct   = partials && partials.totalTorahPseukim > 0 ? specialPs / partials.totalTorahPseukim * 100 : 0;
  const partialPPct  = totalPseukim > 0 ? specialPs / totalPseukim * 100 : 0;

  return {
    idx, parsha, sefer, seferOk,
    readAliyot: readRows.length,
    readPseukim,
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
