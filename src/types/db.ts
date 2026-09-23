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
  isCoveredPast: boolean;
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

// ── Sefer metadata ────────────────────────────────────────────────────────────

export interface SeferMeta {
  en: string;
  color: string;
  chapterVerses: number[];
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

// ── DB fetch / mutation API (shared by web.ts and native.ts) ──────────────────

interface SeferRecord {
  name: string;
  name_en: string;
  color: string;
  chapter_verses: number[];
}

interface ParshaRecord {
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

export interface AuthStatus {
  authMode: 'password' | 'header' | 'none';
  insecureConfig: boolean;
}

export interface DbApi {
  fetchCanWrite: () => Promise<boolean>;
  fetchAuthStatus: () => Promise<AuthStatus>;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  fetchMeta: () => Promise<MetaResult>;
  fetchAliyot: () => Promise<RawRow[]>;
  fetchReadings: () => Promise<ReadingRecord[]>;
  fetchLocationStats: () => Promise<LocationStat[]>;
  fetchHebcal: () => Promise<{ schedule: Record<string, string>; datesByParsha: Record<string, string[]>; cacheYears: [number, number] }>;
  fetchHebcalOnDate: (date: string) => Promise<{ parshiot: string[] }>;
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
  isCoveredPast: boolean;
}

/** The four mapped reading-record arrays that make up the full reading state; used as both
 * input and output by applyWhatIfPicks/applyAsOfDate so one can feed the other. */
export interface ReadingArrays {
  allRows: MappedRow[];
  occasionAliyot: MappedOccasionAliyah[];
  weekdayAliyot: MappedWeekdayAliyah[];
  hosafotReadings: MappedHosafah[];
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
