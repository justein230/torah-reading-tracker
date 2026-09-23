import type { MappedRow } from './db.js';

// ── Filter state ──────────────────────────────────────────────────────────────

export interface Filters {
  sefarim: string[];
  years: number[];
  includeFutureDates: boolean;
  pctMode: string;
  showHolidayRing: boolean;
  showWeekdayRing: boolean;
}

// ── Forecast configuration ────────────────────────────────────────────────────

export interface ForecastConfig {
  lookbackYears: number | null;
  paceOverride: number | null;
}

// ── Per-sefer stats sub-object ────────────────────────────────────────────────

export interface SeferStats {
  totalAliyot: number;
  readAliyot: number;
  totalPseukim: number;
  readPseukim: number;
  readPct: number;
  rereadCount: number;
  committedAliyot: number;
  committedPseukim: number;
  specialReadPseukim: number;
  specialFuturePseukim: number;
}

// ── Per-year chart entry ──────────────────────────────────────────────────────

interface YearBySef {
  aliyot: number;
  pseukim: number;
  uniquePseukim: number; /* within-year, within-sefer deduplicated: mirrors YearEntry.uniquePseukim */
  pct: number;
}

export interface YearEntry {
  aliyot: number;
  pseukim: number;
  newAliyot: number;    /* aliyot read for the first time this year (no re-reads) */
  newPseukim: number;   /* globally deduplicated: pseukim first encountered this year across all years */
  uniquePseukim: number;/* within-year deduplicated: overlapping aliyot (maftir) don't double-count, re-reads in later years do */
  pct: number;
  occasions: string[];
  bySef: Record<string, YearBySef>;
}

// ── Aggregated stats (returned by computeStats) ───────────────────────────────

export interface Stats {
  totalAliyot: number;
  totalPseukim: number;
  readAliyot: number;
  readPseukim: number;
  readPct: number;
  rereadCount: number;
  committedAliyot: number;
  committedPseukim: number;
  committedPct: number;
  bySefer: Record<string, SeferStats>;
  byYear: Record<number, YearEntry>;
  byYearFuture: Record<number, YearEntry>;
  filteredRows: MappedRow[];
  specialReadPseukim: number;
  specialFuturePseukim: number;
  specialTotalPseukim: number;
}

// ── Forecast result ───────────────────────────────────────────────────────────

export interface ForecastResult {
  completion: Date;
  ratePerYear: number;
  remaining: number;
}
