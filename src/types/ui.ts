import type React from 'react';
import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah, SeferMeta, ParshaPair, OccasionRecord, SpecialReadingRecord } from './db.js';
import type { Filters, ForecastConfig, Stats } from './stats.js';

// ── Calendar entry (display-only, aggregates all reading sources) ─────────────

export type CalKind = 'standard' | 'occasion' | 'weekday' | 'hosafah';

/** The minimal shape the calendar views render for one reading on a given day. */
export interface CalEntry {
  kind: CalKind;
  sefer: string;
  parsha: string;
  aliyah: string | number;
  pseukim: number;
  isReread: boolean;
  isFuture: boolean;
  occasion?: string;
}

/** Calendar map: ISO date string → readings that fall on that day. */
export type CalDayMap = Record<string, CalEntry[]>;

// ── App settings (persisted client-side) ────────────────────────────────────────

export interface AppSettings {
  /** Verify reading dates outside the baked cache's range (SEDRA_YEARS) via a live Hebcal.com call. Off by default. */
  liveHebcalLookups: boolean;
  /** Capture verbose diagnostic detail (request/response bodies, breadcrumbs) in the log. Off by default — uses more disk space. */
  debugLogging: boolean;
}

// ── Tooltip row entry (AliyahTooltip) ────────────────────────────────────────

export interface TipRow {
  k: string;
  v?: string | number;
  hebrew?: string;
  suffix?: string;
}

export interface TipData {
  _color: string;
  _tlit: string;
  _aliyah: string | number;
  _tipRows: TipRow[];
}

// ── App context value ─────────────────────────────────────────────────────────

export interface AppContextValue {
  SEFER_ORDER: string[];
  SEFER_MAP: Record<string, SeferMeta>;
  TLIT: Record<string, string>;
  pairs: ParshaPair[];
  parshaById: Record<number, string>;
  allRows: MappedRow[];
  parshaIndex: Record<string, string[]>;
  allYears: number[];
  schedule: Record<string, string>;
  datesByParsha: Record<string, string[]>;
  cacheYears: [number, number];
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  sortMode: string;
  setSortMode: React.Dispatch<React.SetStateAction<string>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  forecastConfig: ForecastConfig;
  setForecastConfig: React.Dispatch<React.SetStateAction<ForecastConfig>>;
  stats: Stats | null;
  refresh: () => Promise<void>;
  ready: boolean;
  canWrite: boolean;
  refreshCanWrite: () => Promise<void>;
  occasions: OccasionRecord[];
  occasionAliyot: MappedOccasionAliyah[];
  specialReadings: SpecialReadingRecord[];
  refreshSpecial: () => Promise<void>;
  weekdayAliyot: MappedWeekdayAliyah[];
  refreshWeekday: () => Promise<void>;
  hosafotReadings: MappedHosafah[];
  refreshHosafot: () => Promise<void>;
}

// ── Manage form state ─────────────────────────────────────────────────────────

export interface ManageForm {
  parsha: string;
  aliyah: string[];
  date: Date | string | null;
  occasion: string;
  location: string;
  readingType: 'standard' | 'double_parsha' | 'holiday' | 'weekday' | 'hosafah';
  pairId: number | null;
  occasionId: number | null;
  occasionAliyahIds: number[];
  isShabbatVariant: boolean;
  hosafahSefer: string;
  hosafahParshaId1: number | null;
  hosafahParshaId2: number | null;
  hosafahOccasionId: number | null;
  hosafahIsDoubleParsha: boolean;
  hosafahChapterStart: string;
  hosafahVerseStart: string;
  hosafahChapterEnd: string;
  hosafahVerseEnd: string;
  hosafahPseukim: string;
}

// ── Per-parsha display row (Details component) ────────────────────────────────

export interface ParshaRow {
  idx: number;
  parsha: string;
  sefer: string;
  seferOk: boolean;
  readAliyot: number;
  readPseukim: number;
  readPct: number;
  parshaReadPct: number;
  totalPseukim: number;
  totalPct: number;
  readSet: Set<string | number>;
  hasFutureSet: Set<string | number>;
  lastDate: string | null;
  nextReadDate: string | null;
  rows: MappedRow[];
}

// ── Calendar / log display entry ──────────────────────────────────────────────

export interface LogEntry {
  sefer: string;
  parsha: string;
  aliyah: string | number;
  pseukim: number;
  pct: number;
  occasion: string;
  note?: string;
  location: string;
  reread: boolean;
  displayDate: string;
  isFuture?: boolean;
  chapterStart?: number;
  verseStart?: number;
  chapterEnd?: number;
  verseEnd?: number;
  // Double-parsha display: pairName/pairNameEn/combinedAliyah carry the pair context and
  // readAsDouble marks an aliyah genuinely read as part of a double parsha (not merely a member
  // of a pairable parsha). isDoubleParsha is set only on the synthetic combined-aliyah summary.
  pairName?: string;
  pairNameEn?: string;
  combinedAliyah?: number | null;
  readAsDouble?: boolean;
  isDoubleParsha?: boolean;
}
