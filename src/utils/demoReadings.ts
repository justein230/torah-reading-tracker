/**
 * Plans believable reading history for the demo databases behind the store screenshots
 * (scripts/seed-demo.ts). Pure and seeded: the same reference data, profile, `asOf` date and
 * seed always give the same plan, so the screenshots can be regenerated identically.
 *
 * Every date is a real one: Shabbat readings fall on the dates Hebcal lists for that parsha,
 * holiday readings on that occasion's dates, and weekday readings where the app's own autofill
 * would put them. The plan is a list of POST bodies, written through the repository so the
 * standard/additional classification is exactly what the app produces.
 */
import type { PostReadingBody, PostSpecialReadingBody, PostWeekdayReadingBody, PostHosafahBody } from '../types/index.js';
import type { SedraEntry } from './sedra.js';
import { holidayDatesFromEntries, type HolidayEntry } from './occasionDates.js';
import { shiftDate, weekdayReadingDateFor, type WeekdayReadingBlockers } from './autofillDate.js';
import { groupBy } from './format.js';

// ── reference data (read from a freshly migrated db) ─────────────────────────

export interface DemoAliyah {
  parsha:         string;        // Hebrew name, as postReading expects
  parshaEn:       string;
  parshaId:       number;
  sefer:          string;        // Hebrew name, as postHosafah expects
  seferEn:        string;
  aliyah:         number;        // 1–7, 8 = maftir
  pseukim:        number;
  pairId:         number | null;
  combinedAliyah: number | null;
  chapterStart:   number;
  verseStart:     number;
  chapterEnd:     number;
  verseEnd:       number;
}

export interface DemoReference {
  aliyot:         readonly DemoAliyah[];
  pairs:          readonly { id: number; nameEn: string; parsha1Id: number; parsha2Id: number }[];
  occasionAliyot: readonly { id: number; occasionEn: string }[];
  weekdayAliyot:  readonly { id: number; parshaId: number; aliyahNum: number }[];
}

export interface DemoCalendar {
  sedra:    readonly SedraEntry[];
  holidays: readonly HolidayEntry[];
}

// ── profiles ─────────────────────────────────────────────────────────────────

export interface DemoProfile {
  /** First day of history, from the `asOf` date. */
  start:             (asOf: string) => string;
  /** Chance of reading on any given Shabbat. */
  shabbatChance:     number;
  /** Past Shabbat readings keep to this pace: a Shabbat is skipped while the year is ahead of it. */
  pseukimPerYear:    number;
  /** Given a Shabbat reading, chance it was the whole parsha (with maftir) rather than 1–3 aliyot, the usual sitting. */
  fullParshaChance:  number;
  /** Shabbatot after `asOf` that may get a scheduled reading (Shabbat readings only). */
  upcomingWeeks:     number;
  upcomingChance:    number;
  /** Chance of each past holiday date getting its reading recorded. */
  holidayChance:     number;
  /** Chance of each Shabbat's Mon/Thu reading being recorded (each weekday aliyah only once ever). */
  weekdayChance:     number;
  /** Number of partial-aliyah hosafot. */
  hosafot:           number;
  /** [name, weight] pairs; readings get a weighted pick. */
  locations:         readonly (readonly [string, number])[];
  noteChance:        number;
  /** Sefarim (English) whose every aliyah is filled in at the end, or 'all'. */
  fillSefarim:       readonly string[] | 'all';
}

export type DemoProfileName = 'empty' | 'starter' | 'showcase' | 'complete';

const NOTES = ['Bar mitzvah', 'Aufruf', 'Yahrzeit'] as const;

const yearsBack = (years: number) => (asOf: string) => `${Number(asOf.slice(0, 4)) - years}-01-01`;

export const DEMO_PROFILES: Record<DemoProfileName, DemoProfile> = {
  empty: {
    start: asOf => asOf, shabbatChance: 0, pseukimPerYear: 0, fullParshaChance: 0, upcomingWeeks: 0, upcomingChance: 0,
    holidayChance: 0, weekdayChance: 0, hosafot: 0, locations: [['', 1]], noteChance: 0, fillSefarim: [],
  },
  starter: {
    start: asOf => shiftDate(asOf, -63), shabbatChance: 1, pseukimPerYear: Infinity, fullParshaChance: 0, upcomingWeeks: 3, upcomingChance: 0.7,
    holidayChance: 0, weekdayChance: 0, hosafot: 0, locations: [['Beth Shalom', 1]], noteChance: 0, fillSefarim: [],
  },
  // A regular reader: 1–3 aliyot on about one Shabbat in four, the odd holiday or Monday/Thursday,
  // about 450 pseukim a year on Shabbat.
  showcase: {
    start: yearsBack(3), shabbatChance: 0.35, pseukimPerYear: 450, fullParshaChance: 0, upcomingWeeks: 8, upcomingChance: 0.5,
    holidayChance: 0.03, weekdayChance: 0.06, hosafot: 2,
    locations: [['Beth Shalom', 6], ['Young Israel', 3], ['Home minyan', 1]], noteChance: 0.04,
    fillSefarim: [],
  },
  complete: {
    start: yearsBack(7), shabbatChance: 0.8, pseukimPerYear: Infinity, fullParshaChance: 0.7, upcomingWeeks: 8, upcomingChance: 0.75,
    holidayChance: 0.5, weekdayChance: 0.6, hosafot: 0,
    locations: [['Beth Shalom', 5], ['Young Israel', 4], ['Home minyan', 1]], noteChance: 0.03,
    fillSefarim: 'all',
  },
};

// ── randomness ───────────────────────────────────────────────────────────────

export type Rand = () => number;

/** Small seeded PRNG (mulberry32): uniform floats in [0, 1). */
export function mulberry32(seed: number): Rand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(rand: Rand, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r < 0) return item;
  }
  return items.at(-1)![0];
}

/** A contiguous run of 1–3 numbers from `1..max`: what one reader reads in a sitting. */
function someAliyot(rand: Rand, max: number): number[] {
  const len   = 1 + Math.floor(rand() * Math.min(3, max));
  const first = 1 + Math.floor(rand() * (max - len + 1));
  return Array.from({ length: len }, (_, i) => first + i);
}

// ── planning ─────────────────────────────────────────────────────────────────

export interface DemoPlan {
  readings: PostReadingBody[];
  special:  PostSpecialReadingBody[];
  weekday:  PostWeekdayReadingBody[];
  hosafot:  PostHosafahBody[];
}

const aliyahKey = (parsha: string, aliyah: number) => `${parsha}|${aliyah}`;

/** Collects plan entries, refusing any (aliyah, date) the database would reject as a duplicate. */
class PlanBuilder {
  readonly plan: DemoPlan = { readings: [], special: [], weekday: [], hosafot: [] };
  private readonly seen        = new Set<string>();
  readonly read                = new Set<string>();   // aliyahKey of every standard aliyah read by `asOf`
  private readonly weekdayDone = new Set<number>();
  private readonly pseukimOf: Map<string, number>;
  /** Pseukim of the Shabbat readings planned so far, by year. */
  readonly pseukimByYear       = new Map<string, number>();

  constructor(ref: DemoReference, private readonly rand: Rand, private readonly profile: DemoProfile, private readonly asOf: string) {
    this.pseukimOf = new Map(ref.aliyot.map(a => [aliyahKey(a.parsha, a.aliyah), a.pseukim]));
  }

  /** Whether the year of `date` is still within its pseukim budget, prorated to that day. */
  onPace(date: string): boolean {
    const year    = date.slice(0, 4);
    const elapsed = (Date.parse(date) - Date.parse(`${year}-01-01`)) / (365 * 864e5);
    return (this.pseukimByYear.get(year) ?? 0) < this.profile.pseukimPerYear * elapsed;
  }

  where(): { location?: string; occasion?: string } {
    const location = pickWeighted(this.rand, this.profile.locations) || undefined;
    const occasion = this.rand() < this.profile.noteChance ? NOTES[Math.floor(this.rand() * NOTES.length)] : undefined;
    return { location, occasion };
  }

  reading(body: PostReadingBody): void {
    const key = `${aliyahKey(body.parsha, body.aliyah)}|${body.date_read}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    if (body.date_read <= this.asOf) this.read.add(aliyahKey(body.parsha, body.aliyah));
    const year = body.date_read.slice(0, 4);
    this.pseukimByYear.set(year, (this.pseukimByYear.get(year) ?? 0) + (this.pseukimOf.get(aliyahKey(body.parsha, body.aliyah)) ?? 0));
    this.plan.readings.push(body);
  }

  special(body: PostSpecialReadingBody): void {
    const key = `oa${body.occasion_aliyah_id}|${body.date_read}`;
    if (this.seen.has(key)) return;
    this.seen.add(key);
    this.plan.special.push(body);
  }

  weekday(body: PostWeekdayReadingBody): void {
    if (this.weekdayDone.has(body.weekday_aliyah_id)) return;
    this.weekdayDone.add(body.weekday_aliyah_id);
    this.plan.weekday.push(body);
  }
}

/** One Shabbat in the sedra calendar: a single parsha, or a combined pair and its two parshiot. */
interface Shabbat { date: string; parshaIds: number[]; pairId: number | null }

function shabbatotBetween(cal: DemoCalendar, ref: DemoReference, from: string, to: string): Shabbat[] {
  const pairByName   = new Map(ref.pairs.map(p => [p.nameEn, p]));
  const parshaByName = new Map(ref.aliyot.map(a => [a.parshaEn, a.parshaId]));
  return cal.sedra.flatMap(([date, name]): Shabbat[] => {
    if (date < from || date > to) return [];
    const pair = pairByName.get(name);
    if (pair) return [{ date, parshaIds: [pair.parsha1Id, pair.parsha2Id], pairId: pair.id }];
    const id = parshaByName.get(name);
    return id === undefined ? [] : [{ date, parshaIds: [id], pairId: null }];
  });
}

/**
 * Plans the readings of one Shabbat. A single parsha is read as aliyot 1–8; a combined week reads
 * the pair's combined aliyot 1–7 (each posted as the individual aliyot it spans, like the app's
 * double-parsha form) with the second parsha's maftir.
 */
function planShabbat(b: PlanBuilder, rand: Rand, s: Shabbat, ref: DemoReference, full: boolean): void {
  const extra = b.where();
  if (s.pairId === null) {
    const rows = ref.aliyot.filter(a => a.parshaId === s.parshaIds[0]);
    const picked = full ? rows.map(a => a.aliyah) : someAliyot(rand, 7);
    for (const a of rows.filter(r => picked.includes(r.aliyah))) {
      b.reading({ parsha: a.parsha, aliyah: a.aliyah, date_read: s.date, ...extra });
    }
    return;
  }
  const combined = full ? [1, 2, 3, 4, 5, 6, 7] : someAliyot(rand, 7);
  for (const a of ref.aliyot.filter(r => r.pairId === s.pairId && combined.includes(r.combinedAliyah ?? -1))) {
    b.reading({ parsha: a.parsha, aliyah: a.aliyah, date_read: s.date, reading_type: 'double_parsha', pair_id: s.pairId, ...extra });
  }
  if (full) {
    const maftir = ref.aliyot.find(a => a.parshaId === s.parshaIds[1] && a.aliyah === 8);
    if (maftir) b.reading({ parsha: maftir.parsha, aliyah: 8, date_read: s.date, ...extra });
  }
}

function planWeekday(b: PlanBuilder, rand: Rand, s: Shabbat, ref: DemoReference, blockers: WeekdayReadingBlockers): void {
  if (s.pairId !== null) return;
  const date = weekdayReadingDateFor(s.date, blockers);
  if (!date) return;
  const { location } = b.where();
  const nums = someAliyot(rand, 3);
  for (const wa of ref.weekdayAliyot.filter(w => w.parshaId === s.parshaIds[0] && nums.includes(w.aliyahNum))) {
    b.weekday({ weekday_aliyah_id: wa.id, date_read: date, location });
  }
}

function planHolidays(b: PlanBuilder, rand: Rand, ref: DemoReference, occasionDates: Record<string, string[]>, from: string, to: string, chance: number): void {
  const byOccasion = groupBy([...ref.occasionAliyot], oa => oa.occasionEn);
  for (const [occasionEn, aliyot] of byOccasion) {
    for (const date of occasionDates[occasionEn] ?? []) {
      if (date < from || date > to || rand() >= chance) continue;
      const { location } = b.where();
      for (const i of someAliyot(rand, aliyot.length)) b.special({ occasion_aliyah_id: aliyot[i - 1]!.id, date_read: date, location });
    }
  }
}

/** Splits the first half of an unread, single-chapter aliyah into a hosafah on a day its parsha was read. */
function planHosafot(b: PlanBuilder, rand: Rand, ref: DemoReference, count: number, asOf: string): void {
  const pastDays = b.plan.readings.filter(r => r.date_read <= asOf && r.reading_type !== 'double_parsha');
  for (let tries = 0; b.plan.hosafot.length < count && tries < 200 && pastDays.length; tries++) {
    const day = pastDays[Math.floor(rand() * pastDays.length)]!;
    const candidates = ref.aliyot.filter(a =>
      a.parsha === day.parsha && a.aliyah <= 7 && !b.read.has(aliyahKey(a.parsha, a.aliyah))
      && a.chapterStart === a.chapterEnd && a.verseEnd - a.verseStart >= 5);
    const a = candidates[Math.floor(rand() * candidates.length)];
    if (!a || b.plan.hosafot.some(h => h.parsha_id_1 === a.parshaId && h.chapter_start === a.chapterStart && h.verse_start === a.verseStart)) continue;
    const verseEnd = a.verseStart + Math.floor((a.verseEnd - a.verseStart) / 2);
    b.plan.hosafot.push({
      sefer: a.sefer, parsha_id_1: a.parshaId,
      chapter_start: a.chapterStart, verse_start: a.verseStart, chapter_end: a.chapterStart, verse_end: verseEnd,
      pseukim: verseEnd - a.verseStart + 1, date_read: day.date_read, location: day.location,
    });
  }
}

/**
 * Reads every still-unread aliyah of the given sefarim, each on the latest Shabbat on or before
 * `asOf` that read its parsha (Vezot Haberakhah, never read on Shabbat, on Simchat Torah).
 */
function planFill(b: PlanBuilder, ref: DemoReference, cal: DemoCalendar, occasionDates: Record<string, string[]>, sefarim: DemoProfile['fillSefarim'], asOf: string): void {
  const latest = new Map<number, string>();
  for (const s of shabbatotBetween(cal, ref, '0000-01-01', asOf)) {
    for (const id of s.parshaIds) latest.set(id, s.date);
  }
  const simchatTorah = (occasionDates['Simchat Torah'] ?? []).filter(d => d <= asOf).at(-1);
  for (const a of ref.aliyot) {
    if (sefarim !== 'all' && !sefarim.includes(a.seferEn)) continue;
    if (b.read.has(aliyahKey(a.parsha, a.aliyah))) continue;
    const date = latest.get(a.parshaId) ?? simchatTorah;
    if (date) b.reading({ parsha: a.parsha, aliyah: a.aliyah, date_read: date, ...b.where() });
  }
}

export function planDemoReadings(ref: DemoReference, cal: DemoCalendar, profile: DemoProfile, asOf: string, rand: Rand): DemoPlan {
  const b = new PlanBuilder(ref, rand, profile, asOf);
  const from   = profile.start(asOf);
  const until  = shiftDate(asOf, profile.upcomingWeeks * 7);
  const names  = [...new Set(ref.occasionAliyot.map(oa => oa.occasionEn))];
  const { occasionDates, morningReadingDates, noMinchaDates } = holidayDatesFromEntries(cal.holidays, names);
  const blockers = { morningReadingDates: new Set(morningReadingDates), noMinchaDates: new Set(noMinchaDates) };

  for (const s of shabbatotBetween(cal, ref, from, until)) {
    const upcoming = s.date > asOf;
    if (rand() < (upcoming ? profile.upcomingChance : profile.shabbatChance) && (upcoming || b.onPace(s.date))) {
      planShabbat(b, rand, s, ref, rand() < profile.fullParshaChance);
    }
    if (!upcoming && rand() < profile.weekdayChance) planWeekday(b, rand, s, ref, blockers);
  }
  planHolidays(b, rand, ref, occasionDates, from, asOf, profile.holidayChance);
  planHosafot(b, rand, ref, profile.hosafot, asOf);
  planFill(b, ref, cal, occasionDates, profile.fillSefarim, asOf);
  return b.plan;
}
