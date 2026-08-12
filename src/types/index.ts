import type React from 'react';

// ── Schema-inferred DB row types (from Drizzle schema) ───────────────────────
export type { Sefer, Parsha, Aliyah, Reading } from '../db/schema.js';

// ── Raw database shape (what the API / SQLite layer returns) ──────────────────

export interface RawRow {
  sefer: string;
  parsha: string;
  aliyah: string | number;
  pair_name?: string;
  pair_name_en?: string;
  combined_aliyah?: number | null;
  pseukim: number;
  pct: number;
  chapter_start?: number;
  verse_start?: number;
  chapter_end?: number;
  verse_end?: number;
  orig?: string;
  direct_orig?: string;
  read_type?: string | null;
  fut?: string;
  occasion?: string;
  location?: string;
  reread_count?: number;
}

// ── Mapped / enriched shape used throughout the app ───────────────────────────

export interface MappedRow {
  sefer: string;
  parsha: string;
  aliyah: string | number;
  pairName: string;
  pairNameEn: string;
  combinedAliyah: number | null;
  pseukim: number;
  pct: number;
  chapterStart: number;
  verseStart: number;
  chapterEnd: number;
  verseEnd: number;
  orig: string;
  directOrig: string;
  readAsDouble: boolean;
  partialOrig: string;
  futDates: string[];
  isRead: boolean;
  isReadPast: boolean;
  isReadFuture: boolean;
  hasFuture: boolean;
  isFuture: boolean;
  isReread: boolean;
  yearRead: number | null;
  futureYear: number | null;
  allYears: number[];
  occasion: string;
  location: string;
  rereadCount: number;
  parshaPct?: number;
}

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

// ── Sefer metadata ────────────────────────────────────────────────────────────

export interface SeferMeta {
  en: string;
  color: string;
  chapterVerses: number[];
}

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

export interface YearBySef {
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

// ── Raw reading record returned by fetchReadings() ───────────────────────────

export interface ReadingRecord {
  id: number;
  sefer: string;
  parsha: string;
  parsha_en: string;
  aliyah: string | number;
  date_read: string;
  occasion: string;
  location: string;
  reading_type: 'standard' | 'double_parsha' | 'additional';
  pair_name?: string;
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

// ── DB fetch / mutation API (shared by web.ts and native.ts) ──────────────────

export interface SeferRecord {
  name: string;
  name_en: string;
  color: string;
  chapter_verses: number[];
}

export interface ParshaRecord {
  id: number;
  name: string;
  name_en: string;
}

export interface ParshaPair {
  id: number;
  name: string;
  name_en: string;
  parsha1_id: number;
  parsha2_id: number;
}

export interface MetaResult {
  sefarim: SeferRecord[];
  parshiot: ParshaRecord[];
  pairs: ParshaPair[];
}

export interface LocationStat {
  location: string;
  count: number;
  past_count: number;
  upcoming_count: number;
}

export interface PostReadingBody {
  parsha: string;
  aliyah: number;
  date_read: string;
  occasion?: string;
  location?: string;
  pair_id?: number;
  reading_type?: 'standard' | 'double_parsha';
}

export interface PutReadingBody {
  occasion?: string;
  location?: string;
}

export interface DbApi {
  fetchCanWrite: () => Promise<boolean>;
  fetchMeta: () => Promise<MetaResult>;
  fetchAliyot: () => Promise<RawRow[]>;
  fetchReadings: () => Promise<ReadingRecord[]>;
  fetchLocationStats: () => Promise<LocationStat[]>;
  fetchHebcal: () => Promise<{ schedule: Record<string, string> }>;
  postReading: (body: PostReadingBody) => Promise<{ id: number; reading_type: string }>;
  putReading: (id: number, body: PutReadingBody) => Promise<{ id: number }>;
  deleteReading: (id: number) => Promise<void>;
  fetchOccasions: () => Promise<OccasionRecord[]>;
  fetchOccasionAliyot: () => Promise<RawOccasionAliyahRow[]>;
  fetchSpecialReadings: () => Promise<RawSpecialReadingRow[]>;
  postSpecialReading: (body: PostSpecialReadingBody) => Promise<{ id: number }>;
  deleteSpecialReading: (id: number) => Promise<void>;
  fetchWeekdayAliyot: () => Promise<RawWeekdayAliyahRow[]>;
  postWeekdayReading: (body: PostWeekdayReadingBody) => Promise<{ id: number }>;
  putWeekdayReading: (id: number, body: { date_read: string; note?: string; location?: string }) => Promise<void>;
  deleteWeekdayReading: (id: number) => Promise<void>;
  fetchHosafotReadings: () => Promise<RawHosafahRow[]>;
  postHosafah: (body: PostHosafahBody) => Promise<{ id: number }>;
  putHosafah: (id: number, body: { date_read: string; note?: string; location?: string }) => Promise<void>;
  deleteHosafah: (id: number) => Promise<void>;
}

// ── Occasion catalog types ────────────────────────────────────────────────────

export interface OccasionRecord {
  id: number;
  name: string;
  nameEn: string;
  category: string;
  sortOrder: number;
}

export interface RawOccasionAliyahRow {
  id: number;
  occasion_id: number;
  occasion: string;
  occasion_en: string;
  category: string;
  aliyah_key: string;
  is_shabbat_variant: boolean;
  parsha_id: number;
  parsha: string;
  parsha_en: string;
  sefer: string;
  sefer_en: string;
  sefer_color: string;
  pseukim: number;
  chapter_start: number;
  verse_start: number;
  chapter_end: number;
  verse_end: number;
  covers_aliyah_id: number | null;
  orig: string;
  all_dates: string;
  read_count: number;
}

export interface MappedOccasionAliyah {
  id: number;
  occasionId: number;
  occasion: string;
  occasionEn: string;
  category: string;
  aliyahKey: string;
  isShabbatVariant: boolean;
  parshaId: number;
  parsha: string;
  parshaEn: string;
  sefer: string;
  seferEn: string;
  seferColor: string;
  pseukim: number;
  chapterStart: number;
  verseStart: number;
  chapterEnd: number;
  verseEnd: number;
  coversAliyahId: number | null;
  orig: string;
  allDates: string[];
  readCount: number;
  isRead: boolean;
  isReadPast: boolean;
  isReadFuture: boolean;
  hasFuture: boolean;
  partialOrig: string;
  isCoveredPast: boolean;
}

export interface RawSpecialReadingRow {
  id: number;
  occasion_aliyah_id: number;
  occasion_id: number;
  occasion: string;
  occasion_en: string;
  category: string;
  aliyah_key: string;
  is_shabbat_variant: boolean;
  parsha: string;
  parsha_en: string;
  date_read: string;
  note: string;
  location: string;
  pseukim: number;
  covers_aliyah_id: number | null;
}

export interface SpecialReadingRecord {
  id: number;
  occasionAliyahId: number;
  occasionId: number;
  occasion: string;
  occasionEn: string;
  category: string;
  aliyahKey: string;
  isShabbatVariant: boolean;
  parsha: string;
  parshaEn: string;
  dateRead: string;
  note: string;
  location: string;
  pseukim: number;
  coversAliyahId: number | null;
}

export interface PostSpecialReadingBody {
  occasion_aliyah_id: number;
  date_read: string;
  note?: string;
  location?: string;
}

// ── Weekday reading types ─────────────────────────────────────────────────────

export interface RawWeekdayAliyahRow {
  id: number;
  parsha_id: number;
  aliyah_num: number;
  parsha: string;
  parsha_en: string;
  sefer: string;
  sefer_en: string;
  sefer_color: string;
  pseukim: number;
  chapter_start: number;
  verse_start: number;
  chapter_end: number;
  verse_end: number;
  covers_aliyah_id: number | null;
  all_dates: string;
  reading_id: number;
  location: string;
  note: string;
}

export interface MappedWeekdayAliyah {
  id: number;
  parshaId: number;
  aliyahNum: number;
  parsha: string;
  parshaEn: string;
  sefer: string;
  seferEn: string;
  seferColor: string;
  pseukim: number;
  chapterStart: number;
  verseStart: number;
  chapterEnd: number;
  verseEnd: number;
  coversAliyahId: number | null;
  dateRead: string;
  allDates: string[];
  readingId: number;
  isReadPast: boolean;
  isReadFuture: boolean;
  hasFuture: boolean;
  partialOrig: string;
  isCoveredPast: boolean;
  location: string;
  note: string;
}

export interface PostWeekdayReadingBody {
  weekday_aliyah_id: number;
  date_read: string;
  note?: string;
  location?: string;
}

// ── Hosafot reading types ─────────────────────────────────────────────────────

export interface RawHosafahRow {
  id: number;
  sefer: string;
  parsha_id_1: number | null;
  parsha_id_2: number | null;
  occasion_id: number | null;
  is_double_parsha: number;
  chapter_start: number;
  verse_start: number;
  chapter_end: number;
  verse_end: number;
  pseukim: number;
  date_read: string;
  note: string;
  location: string;
  parsha1: string;
  parsha1_en: string;
  parsha2: string | null;
  parsha2_en: string | null;
  occasion: string | null;
  occasion_en: string | null;
}

export interface MappedHosafah {
  id: number;
  sefer: string;
  parshaId1: number | null;
  parshaId2: number | null;
  occasionId: number | null;
  isDoubleParsha: boolean;
  chapterStart: number;
  verseStart: number;
  chapterEnd: number;
  verseEnd: number;
  pseukim: number;
  dateRead: string;
  note: string;
  location: string;
  parsha1: string;
  parsha1En: string;
  parsha2: string | null;
  parsha2En: string | null;
  occasion: string | null;
  occasionEn: string | null;
  isReadPast: boolean;
  isReadFuture: boolean;
  partialOrig: string;
}

export interface PostHosafahBody {
  sefer: string;
  parsha_id_1?: number | null;
  parsha_id_2?: number | null;
  occasion_id?: number | null;
  is_double_parsha?: number;
  chapter_start: number;
  verse_start: number;
  chapter_end: number;
  verse_end: number;
  pseukim: number;
  date_read: string;
  note?: string;
  location?: string;
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
