import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah, Filters, ForecastConfig, ForecastResult, Stats, SeferStats, SeferMeta, YearEntry } from './types/index.js';
import { versesOverlap } from './utils.js';

/**
 * Computes partialOrig for each Shabbat aliyah: the earliest date a holiday or weekday
 * reading covered part (but not all) of the aliyah's verse range. Runs in TypeScript after
 * all data is fetched so the overlap logic is testable without a database.
 */
export function enrichPartialOrig(
  rows: MappedRow[],
  occasionAliyot: MappedOccasionAliyah[],
  weekdayAliyot: MappedWeekdayAliyah[],
  hosafotReadings: MappedHosafah[] = [],
): MappedRow[] {
  return rows.map(r => {
    if (r.chapterStart < 0) return r;
    const dates = [
      ...occasionAliyot
        .filter(oa => oa.isRead && oa.coversAliyahId == null && oa.parsha === r.parsha && partiallyOverlaps(oa, r))
        .map(oa => oa.orig),
      ...weekdayAliyot
        .filter(wa => wa.isReadPast && wa.parsha === r.parsha && versesOverlap(wa, r))
        .map(wa => wa.dateRead),
      ...hosafotReadings
        .filter(hr => hr.isReadPast && hr.sefer === r.sefer && versesOverlap(hr, r))
        .map(hr => hr.dateRead),
    ];
    if (!dates.length) return r;
    return { ...r, partialOrig: earliestDate(dates) };
  });
}

type VerseRange = { chapterStart: number; verseStart: number; chapterEnd: number; verseEnd: number };

function partiallyOverlaps(a: VerseRange, b: VerseRange): boolean {
  const aStart = a.chapterStart * 1000 + a.verseStart;
  const aEnd   = a.chapterEnd   * 1000 + a.verseEnd;
  const bStart = b.chapterStart * 1000 + b.verseStart;
  const bEnd   = b.chapterEnd   * 1000 + b.verseEnd;
  return versesOverlap(a, b) && !(aStart <= bStart && aEnd >= bEnd);
}

/* True when a's verse range wholly contains b's — meaning b is fully covered by a. */
function fullyContains(a: VerseRange, b: VerseRange): boolean {
  return (a.chapterStart * 1000 + a.verseStart) <= (b.chapterStart * 1000 + b.verseStart)
      && (a.chapterEnd   * 1000 + a.verseEnd)   >= (b.chapterEnd   * 1000 + b.verseEnd);
}

function earliestDate(dates: string[]): string {
  return [...dates].sort((a, b) => a.localeCompare(b))[0] as string;
}

export function enrichOccasionPartialOrig(
  occasionAliyot: MappedOccasionAliyah[],
  shabbatRows: MappedRow[],
  weekdayAliyot: MappedWeekdayAliyah[],
  hosafotReadings: MappedHosafah[] = [],
): MappedOccasionAliyah[] {
  return occasionAliyot.map(oa => {
    if (oa.isReadPast || oa.chapterStart < 0) return oa;
    const isCoveredPast =
      shabbatRows.some(r  => r.isReadPast  && r.parsha  === oa.parsha && fullyContains(r,  oa)) ||
      weekdayAliyot.some(wa => wa.isReadPast && wa.parsha === oa.parsha && fullyContains(wa, oa)) ||
      hosafotReadings.some(hr => hr.isReadPast && hr.sefer === oa.sefer  && fullyContains(hr, oa));
    const dates = [
      ...shabbatRows.filter(r  => r.isReadPast  && r.parsha  === oa.parsha && partiallyOverlaps(r,  oa)).map(r  => r.orig),
      ...weekdayAliyot.filter(wa => wa.isReadPast && wa.parsha === oa.parsha && versesOverlap(wa, oa)).map(wa => wa.dateRead),
      ...hosafotReadings.filter(hr => hr.isReadPast && hr.sefer === oa.sefer  && versesOverlap(hr, oa)).map(hr => hr.dateRead),
    ];
    if (!dates.length && !isCoveredPast) return oa;
    return { ...oa, partialOrig: dates.length ? earliestDate(dates) : '', isCoveredPast };
  });
}

export function enrichWeekdayPartialOrig(
  weekdayAliyot: MappedWeekdayAliyah[],
  shabbatRows: MappedRow[],
  occasionAliyot: MappedOccasionAliyah[],
  hosafotReadings: MappedHosafah[] = [],
): MappedWeekdayAliyah[] {
  return weekdayAliyot.map(wa => {
    if (wa.dateRead || wa.chapterStart < 0) return wa;
    const isCoveredPast =
      shabbatRows.some(r    => r.isReadPast    && r.parsha    === wa.parsha && fullyContains(r,    wa)) ||
      occasionAliyot.some(oa => oa.isReadPast  && oa.parsha   === wa.parsha && fullyContains(oa,   wa)) ||
      hosafotReadings.some(hr => hr.isReadPast && hr.sefer    === wa.sefer  && fullyContains(hr,   wa));
    const dates = [
      ...shabbatRows.filter(r    => r.isReadPast    && r.parsha    === wa.parsha && partiallyOverlaps(r,    wa)).map(r    => r.orig),
      ...occasionAliyot.filter(oa => oa.isReadPast  && oa.parsha   === wa.parsha && partiallyOverlaps(oa,   wa)).map(oa   => oa.orig),
      ...hosafotReadings.filter(hr => hr.isReadPast && hr.sefer    === wa.sefer  && versesOverlap(hr,   wa)).map(hr   => hr.dateRead),
    ];
    if (!dates.length && !isCoveredPast) return wa;
    return { ...wa, partialOrig: dates.length ? earliestDate(dates) : '', isCoveredPast };
  });
}

export function enrichHosafotPartialOrig(
  hosafotReadings: MappedHosafah[],
  shabbatRows: MappedRow[],
  occasionAliyot: MappedOccasionAliyah[],
  weekdayAliyot: MappedWeekdayAliyah[],
): MappedHosafah[] {
  return hosafotReadings.map(hr => {
    if (hr.isReadPast || hr.chapterStart < 0) return hr;
    const dates = [
      ...shabbatRows.filter(r => r.isReadPast && r.sefer === hr.sefer && partiallyOverlaps(r, hr)).map(r => r.orig),
      ...occasionAliyot.filter(oa => oa.isReadPast && oa.sefer === hr.sefer && partiallyOverlaps(oa, hr)).map(oa => oa.orig),
      ...weekdayAliyot.filter(wa => wa.isReadPast && wa.sefer === hr.sefer && partiallyOverlaps(wa, hr)).map(wa => wa.dateRead),
    ];
    if (!dates.length) return hr;
    return { ...hr, partialOrig: earliestDate(dates) };
  });
}

/**
 * Projects a completion date for the full Torah based on historical reading pace.
 * Uses a rolling lookback window (or a manual pace override) to derive pseukim/year,
 * then extrapolates from remaining pseukim. Returns { completion, ratePerYear, remaining }
 * or null if there isn't enough data to project.
 */
function buildVerseKeySets(allRows: MappedRow[], seferMap: Record<string, SeferMeta>): { allKeys: Set<string>; readKeys: Set<string> } {
  const allKeys  = new Set<string>();
  const readKeys = new Set<string>();
  for (const r of allRows) {
    for (const k of verseKeysForRange(r, seferMap)) {
      allKeys.add(k);
      if (r.isRead) readKeys.add(k);
    }
  }
  return { allKeys, readKeys };
}

function computeReadingRate(allRows: MappedRow[], forecastConfig: ForecastConfig, today: Date, seferMap: Record<string, SeferMeta>): number | null {
  const { lookbackYears, paceOverride } = forecastConfig;
  if (paceOverride && paceOverride > 0) return paceOverride;

  const cutoff = lookbackYears
    ? new Date(today.getFullYear() - lookbackYears, today.getMonth(), today.getDate())
    : null;
  const windowRows = allRows.filter(r => r.isRead && r.orig && (!cutoff || new Date(r.orig) >= cutoff));
  if (windowRows.length < 2) return null;
  const dates          = windowRows.map(r => new Date(r.orig)).sort((a, b) => a.getTime() - b.getTime());
  const daysSinceFirst = (today.getTime() - (dates[0] as Date).getTime()) / 86400000;
  if (daysSinceFirst <= 0) return null;
  const windowKeys = new Set<string>();
  for (const r of windowRows) for (const k of verseKeysForRange(r, seferMap)) windowKeys.add(k);
  const rate = (windowKeys.size / daysSinceFirst) * 365.25;
  return rate > 0 ? rate : null;
}

// Used by estimateCompletion below and by Forecast.tsx's reverse target-year calculator —
// both need the same total-minus-read pseukim figure, adjusted for special-reading credit.
export function remainingPseukim(allRows: MappedRow[], stats: Pick<Stats, 'specialTotalPseukim' | 'specialReadPseukim'>, seferMap: Record<string, SeferMeta> = {}): number {
  const { allKeys, readKeys } = buildVerseKeySets(allRows, seferMap);
  const totalPseukim     = allKeys.size  + stats.specialTotalPseukim;
  const committedPseukim = readKeys.size + stats.specialReadPseukim;
  return totalPseukim - committedPseukim;
}

export function estimateCompletion(allRows: MappedRow[], _filters: Filters, forecastConfig: ForecastConfig, specialTotalPseukim = 0, specialReadPseukim = 0, seferMap: Record<string, SeferMeta> = {}): ForecastResult | null {
  const today            = new Date();
  const remaining        = remainingPseukim(allRows, { specialTotalPseukim, specialReadPseukim }, seferMap);
  const ratePerYear      = computeReadingRate(allRows, forecastConfig, today, seferMap);
  if (ratePerYear === null) return null;
  const daysLeft   = (remaining / ratePerYear) * 365.25;
  const completion = new Date(today.getTime() + daysLeft * 86400000);
  return { completion, ratePerYear: Math.round(ratePerYear), remaining };
}

export function estimateCompletionFromStats(
  allRows: MappedRow[],
  filters: Filters,
  forecastConfig: ForecastConfig,
  stats: Pick<Stats, 'specialReadPseukim' | 'specialFuturePseukim'>,
  seferMap: Record<string, SeferMeta> = {},
): ForecastResult | null {
  return estimateCompletion(allRows, filters, forecastConfig, 0, stats.specialReadPseukim + stats.specialFuturePseukim, seferMap);
}

function addToYear(
  byYear: Record<number, YearEntry>,
  SEFER_MAP: Record<string, SeferMeta>,
  yr: number,
  sefer: string,
  pseukim: number,
  pct: number,
  occasion: string | null,
): void {
  const en = SEFER_MAP[sefer]?.en ?? sefer;
  byYear[yr] ??= { aliyot: 0, pseukim: 0, newAliyot: 0, newPseukim: 0, uniquePseukim: 0, pct: 0, occasions: [], bySef: {} };
  const yearEntry = byYear[yr];
  yearEntry.aliyot++;
  yearEntry.pseukim += pseukim;
  yearEntry.pct     += pct;
  yearEntry.bySef[en] ??= { aliyot: 0, pseukim: 0, uniquePseukim: 0, pct: 0 };
  const sefEntry = yearEntry.bySef[en];
  sefEntry.aliyot++;
  sefEntry.pseukim += pseukim;
  sefEntry.pct     += pct;
  if (occasion && !yearEntry.occasions.includes(occasion))
    yearEntry.occasions.push(occasion);
}

function isCountRead(r: MappedRow, seferOk: boolean, isRead: boolean, filters: Filters): boolean {
  if (!isRead || !seferOk)   return false;
  if (!filters.years.length) return true;
  return r.yearRead !== null && filters.years.includes(r.yearRead);
}

function isCommittedYearOk(r: MappedRow, filters: Filters): boolean {
  if (!filters.years.length) return true;
  return filters.years.some(y => r.allYears.includes(y));
}

function processChartEntries(
  byYear: Record<number, YearEntry>,
  byYearFuture: Record<number, YearEntry>,
  SEFER_MAP: Record<string, SeferMeta>,
  r: MappedRow,
  filters: Filters,
): void {
  if (r.isReadPast)   processChartYears(byYear,       SEFER_MAP, r, filters);
  if (r.isReadFuture) processChartYears(byYearFuture, SEFER_MAP, r, filters);
}

function processChartYears(
  byYear: Record<number, YearEntry>,
  SEFER_MAP: Record<string, SeferMeta>,
  r: MappedRow,
  filters: Filters,
): void {
  if (r.yearRead === null) return;
  addToYear(byYear, SEFER_MAP, r.yearRead, r.sefer, r.pseukim, r.pct, r.occasion);
  if (filters.includeFutureDates && r.hasFuture) {
    for (const dateStr of r.futDates)
      addToYear(byYear, SEFER_MAP, new Date(dateStr).getFullYear(), r.sefer, r.pseukim, r.pct, null);
  }
}

type ReadableRange = {
  sefer: string;
  chapterStart: number;
  verseStart: number;
  chapterEnd: number;
  verseEnd: number;
  pseukim: number;
};


export function countPseukim(chapterVerses: number[], cs: number, vs: number, ce: number, ve: number): number | null {
  if (cs === ce) return ve - vs + 1;
  let total = 0;
  for (let ch = cs; ch <= ce; ch++) {
    const max = chapterVerses[ch - 1];
    if (max === undefined) return null;
    total += (ch === ce ? ve : max) - (ch === cs ? vs : 1) + 1;
  }
  return total;
}

function verseKey(sefer: string, chapter: number, verse: number): string {
  return `${sefer}|${chapter}|${verse}`;
}

function addChapterKeys(keys: string[], sefer: string, chapter: number, startVerse: number, endVerse: number): void {
  for (let verse = startVerse; verse <= endVerse; verse++)
    keys.push(verseKey(sefer, chapter, verse));
}

function verseKeysForRange(range: ReadableRange, seferMap: Record<string, SeferMeta>): string[] {
  if (range.chapterStart < 0 || range.verseStart < 0 || range.chapterEnd < 0 || range.verseEnd < 0)
    return [];

  const chapterVerses = seferMap[range.sefer]?.chapterVerses ?? [];
  const keys: string[] = [];
  if (range.chapterStart === range.chapterEnd) {
    addChapterKeys(keys, range.sefer, range.chapterStart, range.verseStart, range.verseEnd);
    return keys;
  }

  for (let chapter = range.chapterStart; chapter <= range.chapterEnd; chapter++) {
    const startVerse = chapter === range.chapterStart ? range.verseStart : 1;
    const endVerse   = chapter === range.chapterEnd ? range.verseEnd : (chapterVerses[chapter - 1] ?? null);
    if (endVerse === null || endVerse < startVerse) return [];
    addChapterKeys(keys, range.sefer, chapter, startVerse, endVerse);
  }

  return keys;
}

export function isSeferAllowed(sefer: string, filters: Filters): boolean {
  return !filters.sefarim.length || filters.sefarim.includes(sefer);
}

// ── double-parsha pair aggregation (used by DoubleParshaGrid.tsx) ─────────────
// A double-parsha pair's 7 combined aliyot can each be satisfied by either its own
// standard reading or a reading marked readAsDouble; these helpers determine read/partial
// state per combined aliyah and roll pseukim totals up across a pair.

export function isAliyahRead(rows: MappedRow[]): boolean {
  return rows.some(r => r.readAsDouble && r.isReadPast);
}

export function isAliyahPartial(rows: MappedRow[]): boolean {
  return !isAliyahRead(rows) && rows.some(r => r.isReadPast || r.partialOrig);
}

export function countReadAliyot(pairRows: Record<number, MappedRow[]>, combinedAliyot: number[]): number {
  let count = 0;
  for (const ca of combinedAliyot) {
    if (isAliyahRead(pairRows[ca] ?? [])) count++;
  }
  return count;
}

export function computePairTotalPseukim(pairRows: Record<number, MappedRow[]>, combinedAliyot: number[]): number {
  return combinedAliyot.reduce((sum, ca) => sum + (pairRows[ca] ?? []).reduce((s, r) => s + r.pseukim, 0), 0);
}

export function computePairReadPseukim(pairRows: Record<number, MappedRow[]>, combinedAliyot: number[]): number {
  return combinedAliyot.reduce((sum, ca) => {
    const rows = pairRows[ca] ?? [];
    return sum + (isAliyahRead(rows) ? rows.reduce((s, r) => s + r.pseukim, 0) : 0);
  }, 0);
}

export interface RingStats { total: number; read: number; commit: number; pct: number; cPct: number }

export function computeRing(
  items: { sefer: string; isReadPast: boolean; isCoveredPast: boolean; isReadFuture: boolean }[],
  seferFilter: string[],
): RingStats {
  const arr    = seferFilter.length ? items.filter(x => seferFilter.includes(x.sefer)) : items;
  const total  = arr.length;
  const read   = arr.filter(x => x.isReadPast || x.isCoveredPast).length;
  const commit = read + arr.filter(x => x.isReadFuture && !x.isReadPast && !x.isCoveredPast).length;
  return { total, read, commit, pct: total ? read / total * 100 : 0, cPct: total ? commit / total * 100 : 0 };
}

function shouldCountCommitted(r: MappedRow, seferOk: boolean, filters: Filters): boolean {
  return r.isRead && seferOk && isCommittedYearOk(r, filters);
}

function addNewKeysToSet(keys: string[], set: Set<string>): number {
  let count = 0;
  for (const key of keys) {
    if (!set.has(key)) { set.add(key); count++; }
  }
  return count;
}

function hasAnyKey(keys: string[], set: Set<string>): boolean {
  return keys.some(key => set.has(key));
}

function countNewReadKeys(keys: string[], readVerseKeys: Set<string>, standardVerseKeys: Set<string>): number {
  let credit = 0;
  for (const key of keys) {
    if (!standardVerseKeys.has(key) || readVerseKeys.has(key)) continue;
    readVerseKeys.add(key);
    credit++;
  }
  return credit;
}

// Standard-read pseukim are tracked as canonical keys like "Exodus|34|10".
// Holiday and weekday readings that touch standard Torah only receive credit
// for keys not already read, so the same pasuk cannot be counted twice.
function creditSpecialKeys(
  keys: string[], sefer: string,
  readVerseKeys: Set<string>, standardVerseKeys: Set<string>,
  bs: Record<string, SeferStats>,
): number {
  const credit = countNewReadKeys(keys, readVerseKeys, standardVerseKeys);
  if (credit <= 0) return 0;
  const seferBs = bs[sefer];
  if (seferBs) seferBs.specialReadPseukim += credit;
  return credit;
}

// Like creditSpecialKeys but for future-scheduled reads: credits verses not yet
// past-read and not already credited to another future read, without adding to readVerseKeys.
function creditFutureKeys(
  keys: string[], sefer: string,
  futureVerseKeys: Set<string>, readVerseKeys: Set<string>, standardVerseKeys: Set<string>,
  bs: Record<string, SeferStats>,
): number {
  let credit = 0;
  for (const key of keys) {
    if (!standardVerseKeys.has(key) || readVerseKeys.has(key) || futureVerseKeys.has(key)) continue;
    futureVerseKeys.add(key);
    credit++;
  }
  if (credit > 0) {
    const seferBs = bs[sefer];
    if (seferBs) seferBs.specialFuturePseukim += credit;
  }
  return credit;
}

type SpecialItem = { sefer: string; pseukim: number; isReadPast: boolean; isReadFuture: boolean };

function creditSpecialOverlap(
  item: SpecialItem, verseKeys: string[],
  readVerseKeys: Set<string>, futureVerseKeys: Set<string>, standardVerseKeys: Set<string>,
  bs: Record<string, SeferStats>,
): { read: number; future: number } {
  if (item.isReadPast)   return { read: creditSpecialKeys(verseKeys, item.sefer, readVerseKeys, standardVerseKeys, bs), future: 0 };
  if (item.isReadFuture) return { read: 0, future: creditFutureKeys(verseKeys, item.sefer, futureVerseKeys, readVerseKeys, standardVerseKeys, bs) };
  return { read: 0, future: 0 };
}

function creditSpecialNonStandard(
  item: SpecialItem,
  bs: Record<string, SeferStats>,
): { read: number; future: number; total: number } {
  const seferBs = bs[item.sefer];
  if (item.isReadPast) {
    if (seferBs) seferBs.specialReadPseukim   += item.pseukim;
    return { read: item.pseukim, future: 0, total: item.pseukim };
  }
  if (item.isReadFuture) {
    if (seferBs) seferBs.specialFuturePseukim += item.pseukim;
    return { read: 0, future: item.pseukim, total: item.pseukim };
  }
  return { read: 0, future: 0, total: item.pseukim };
}

function processSpecialItemStats(
  items: (SpecialItem & { chapterStart: number; verseStart: number; chapterEnd: number; verseEnd: number })[],
  ctx: StatsCtx,
): { specialReadPseukim: number; specialTotalPseukim: number; specialFuturePseukim: number } {
  const { filters, standardVerseKeys, readVerseKeys, futureVerseKeys, bs, SEFER_MAP: seferMap } = ctx;
  let specialReadPseukim = 0, specialTotalPseukim = 0, specialFuturePseukim = 0;
  for (const item of items) {
    if (!isSeferAllowed(item.sefer, filters)) continue;
    const verseKeys = verseKeysForRange(item, seferMap);
    if (hasAnyKey(verseKeys, standardVerseKeys)) {
      const { read, future } = creditSpecialOverlap(item, verseKeys, readVerseKeys, futureVerseKeys, standardVerseKeys, bs);
      specialReadPseukim += read; specialFuturePseukim += future;
    } else {
      const { read, future, total } = creditSpecialNonStandard(item, bs);
      specialReadPseukim += read; specialFuturePseukim += future; specialTotalPseukim += total;
    }
  }
  return { specialReadPseukim, specialTotalPseukim, specialFuturePseukim };
}

function processSpecialStats(
  occasionAliyot: MappedOccasionAliyah[],
  weekdayAliyot: MappedWeekdayAliyah[],
  hosafotReadings: MappedHosafah[],
  ctx: StatsCtx,
): { specialReadPseukim: number; specialTotalPseukim: number; specialFuturePseukim: number } {
  const { filters, standardVerseKeys, readVerseKeys, futureVerseKeys, bs, SEFER_MAP: seferMap } = ctx;

  // coversAliyahId items are sub-aliyot that live inside a standard aliyah; skip them here.
  const { specialReadPseukim: oaRead, specialTotalPseukim, specialFuturePseukim: oaFuture } =
    processSpecialItemStats(occasionAliyot.filter(oa => oa.coversAliyahId == null), ctx);

  let specialReadPseukim = oaRead;
  let specialFuturePseukim = oaFuture;

  for (const wa of weekdayAliyot) {
    if (!isSeferAllowed(wa.sefer, filters)) continue;
    const verseKeys = verseKeysForRange(wa, seferMap);
    if (!hasAnyKey(verseKeys, standardVerseKeys)) continue;
    if (wa.isReadPast)        specialReadPseukim   += creditSpecialKeys(verseKeys, wa.sefer, readVerseKeys, standardVerseKeys, bs);
    else if (wa.isReadFuture) specialFuturePseukim += creditFutureKeys(verseKeys, wa.sefer, futureVerseKeys, readVerseKeys, standardVerseKeys, bs);
  }

  const { specialReadPseukim: hrRead, specialTotalPseukim: hrTotal, specialFuturePseukim: hrFuture } =
    processSpecialItemStats(hosafotReadings, ctx);

  return {
    specialReadPseukim:   specialReadPseukim   + hrRead,
    specialTotalPseukim:  specialTotalPseukim  + hrTotal,
    specialFuturePseukim: specialFuturePseukim + hrFuture,
  };
}

interface RowAccum {
  totalAliyot: number; totalPseukim: number;
  readAliyot: number; readPseukim: number; readPct: number; rereadCount: number;
  committedAliyot: number; committedPseukim: number; committedPct: number;
  filteredRows: MappedRow[];
}

interface StatsCtx {
  filters: Filters;
  SEFER_MAP: Record<string, SeferMeta>;
  bs: Record<string, SeferStats>;
  standardVerseKeys: Set<string>;
  readVerseKeys: Set<string>;
  committedVerseKeys: Set<string>;
  futureVerseKeys: Set<string>;
  byYear: Record<number, YearEntry>;
  byYearFuture: Record<number, YearEntry>;
}

function processStandardRow(r: MappedRow, ctx: StatsCtx, acc: RowAccum): void {
  const seferOk = isSeferAllowed(r.sefer, ctx.filters);
  const seferStats = ctx.bs[r.sefer];
  const verseKeys = seferOk ? verseKeysForRange(r, ctx.SEFER_MAP) : [];

  if (seferOk && seferStats) {
    acc.totalAliyot++;
    const newTotal = addNewKeysToSet(verseKeys, ctx.standardVerseKeys);
    acc.totalPseukim += newTotal;
    seferStats.totalAliyot++;
    seferStats.totalPseukim += newTotal;
  }

  const countRead = isCountRead(r, seferOk, r.isReadPast, ctx.filters);

  if (countRead && seferStats) {
    acc.filteredRows.push(r);
    acc.readAliyot++;
    const newRead = addNewKeysToSet(verseKeys, ctx.readVerseKeys);
    acc.readPseukim += newRead;
    acc.readPct += r.pct;
    acc.rereadCount += r.rereadCount;
    seferStats.readAliyot++;
    seferStats.readPseukim += newRead;
    seferStats.readPct += r.pct;
    seferStats.rereadCount += r.rereadCount;
  }

  if (shouldCountCommitted(r, seferOk, ctx.filters) && seferStats) {
    acc.committedAliyot++;
    const newCommitted = addNewKeysToSet(verseKeys, ctx.committedVerseKeys);
    acc.committedPseukim += newCommitted;
    acc.committedPct += r.pct;
    seferStats.committedAliyot++;
    seferStats.committedPseukim += newCommitted;
  }

  if (seferOk) processChartEntries(ctx.byYear, ctx.byYearFuture, ctx.SEFER_MAP, r, ctx.filters);
}

function applyNewCounts(filteredRows: MappedRow[], byYear: Record<number, YearEntry>, seferMap: Record<string, SeferMeta>): void {
  const seenVKeys = new Set<string>();
  for (const r of [...filteredRows].sort((a, b) => (a.yearRead ?? 0) - (b.yearRead ?? 0))) {
    if (r.yearRead === null) continue;
    const entry = byYear[r.yearRead];
    if (!entry) continue;
    entry.newAliyot++;
    entry.newPseukim += addNewKeysToSet(verseKeysForRange(r, seferMap), seenVKeys);
  }
}

function applyUniquePseukim(filteredRows: MappedRow[], byYear: Record<number, YearEntry>, seferMap: Record<string, SeferMeta>, filters: Filters): void {
  const yearVKeyMap = new Map<string, Set<string>>();
  const getVKeys = (key: string): Set<string> => {
    if (!yearVKeyMap.has(key)) yearVKeyMap.set(key, new Set());
    return yearVKeyMap.get(key) as Set<string>;
  };
  const applyForYear = (yr: number, r: MappedRow): void => {
    const entry = byYear[yr];
    if (!entry) return;
    const en = seferMap[r.sefer]?.en ?? r.sefer;
    const keys = verseKeysForRange(r, seferMap);
    entry.uniquePseukim += addNewKeysToSet(keys, getVKeys(`${yr}`));
    const sefEntry = entry.bySef[en];
    if (sefEntry) sefEntry.uniquePseukim += addNewKeysToSet(keys, getVKeys(`${yr}|${en}`));
  };
  for (const r of filteredRows) {
    if (r.yearRead === null) continue;
    applyForYear(r.yearRead, r);
    if (filters.includeFutureDates && r.hasFuture) {
      for (const dateStr of r.futDates) applyForYear(new Date(dateStr).getFullYear(), r);
    }
  }
}

/**
 * Aggregates reading statistics across all aliyot, respecting active filters.
 * Returns totals (aliyot, pseukim, pct), per-sefer breakdowns (bySefer),
 * per-year chart data (byYear for past readings, byYearFuture for future re-reads),
 * and the filtered row array used for downstream display.
 */
export function computeStats(allRows: MappedRow[], occasionAliyot: MappedOccasionAliyah[], SEFER_ORDER: string[], SEFER_MAP: Record<string, SeferMeta>, filters: Filters, weekdayAliyot: MappedWeekdayAliyah[] = [], hosafotReadings: MappedHosafah[] = []): Stats {
  const bs: Record<string, SeferStats> = {};
  for (const s of SEFER_ORDER) {
    bs[s] = { totalAliyot: 0, readAliyot: 0, totalPseukim: 0, readPseukim: 0, readPct: 0, rereadCount: 0, committedAliyot: 0, committedPseukim: 0, specialReadPseukim: 0, specialFuturePseukim: 0 };
  }
  const ctx: StatsCtx = {
    filters, SEFER_MAP, bs,
    standardVerseKeys:  new Set<string>(),
    readVerseKeys:      new Set<string>(),
    committedVerseKeys: new Set<string>(),
    futureVerseKeys:    new Set<string>(),
    byYear: {},
    byYearFuture: {},
  };
  const acc: RowAccum = {
    totalAliyot: 0, totalPseukim: 0,
    readAliyot: 0, readPseukim: 0, readPct: 0, rereadCount: 0,
    committedAliyot: 0, committedPseukim: 0, committedPct: 0,
    filteredRows: [],
  };

  for (const r of allRows) {
    processStandardRow(r, ctx, acc);
  }

  // Second pass: compute newPseukim/newAliyot per year (deduplicated, chronological order).
  // filteredRows contains only first-reads; sorting by year ensures earlier readings claim new pseukim first.
  applyNewCounts(acc.filteredRows, ctx.byYear, ctx.SEFER_MAP);

  // Third pass: compute uniquePseukim per year (within-year deduplicated; mirrors processChartYears).
  // Overlapping aliyot (e.g. maftir inside aliyah 7) don't double-count within the same year,
  // but re-reads in a later year are counted again (unlike newPseukim which is globally unique).
  applyUniquePseukim(acc.filteredRows, ctx.byYear, ctx.SEFER_MAP, filters);

  const { specialReadPseukim, specialTotalPseukim, specialFuturePseukim } =
    processSpecialStats(occasionAliyot, weekdayAliyot, hosafotReadings, ctx);

  const { totalAliyot, totalPseukim, readAliyot, readPseukim, readPct, rereadCount,
          committedAliyot, committedPseukim, committedPct, filteredRows } = acc;
  return { totalAliyot, totalPseukim, readAliyot, readPseukim, readPct, rereadCount, committedAliyot, committedPseukim, committedPct, bySefer: bs, byYear: ctx.byYear, byYearFuture: ctx.byYearFuture, filteredRows, specialReadPseukim, specialFuturePseukim, specialTotalPseukim };
}

interface PseukimTally {
  readPseukim: number;
  committedPseukim: number;
  specialReadPseukim: number;
  specialFuturePseukim: number;
}

// specialReadPseukim credits pseukim read via a holiday/weekday reading that only partially
// covers a standard aliyah — the standard aliyah itself is never marked read/committed in that
// case, so those pseukim never enter readPseukim/committedPseukim. Both totals below must add
// it back in, or "committed" can undercount pseukim that are already read. Shared by every
// component (Hero, SeferCards, WhatIfPreview) so the formula can't drift between them again.
export function effectivePseukimOf(s: Pick<PseukimTally, 'readPseukim' | 'specialReadPseukim'>): number {
  return s.readPseukim + s.specialReadPseukim;
}

export function committedPseukimOf(s: PseukimTally): number {
  return s.committedPseukim + s.specialReadPseukim + s.specialFuturePseukim;
}
