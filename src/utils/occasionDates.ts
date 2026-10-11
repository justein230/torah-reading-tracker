import { shiftDate } from './autofillDate.js';

/** A single [ISO date, Hebcal title, has a morning Torah reading] row, as stored in HOLIDAY_CACHE. */
export type HolidayEntry = readonly [date: string, title: string, hasTorah: boolean];

/** Hebcal titles use a typographic apostrophe ("Ta’anit Esther"); the occasions table uses ASCII. */
export function normalizeHolidayTitle(title: string): string {
  return title.replaceAll('’', "'");
}

const ROMAN: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8 };
type Festival = 'Rosh Hashana' | 'Sukkot' | 'Pesach' | 'Shavuot';

/** What Hebcal says happens on one calendar date, reduced to the facts the occasion rules ask about. */
interface DayFacts {
  date:      string;
  saturday:  boolean;
  titles:    Set<string>;
  roshChodesh: boolean;
  /** Day of the festival, counting from 1 (Pesach VI → 6). */
  festival?: { name: Festival; day: number };
  /** Day of Chanukah (1–8) whose morning this is. */
  chanukahDay?: number;
  /** Which non-Shabbat Chol HaMoed weekday of Pesach this is among days III–V (1–3); VI is always "Day 4". */
  pesachChmWeekdayIndex?: number;
}

type Rule = (f: DayFacts) => boolean;

function isSaturday(date: string): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 6;
}

function festivalOf(title: string): DayFacts['festival'] {
  if (/^Rosh Hashana \d{4}$/.test(title)) return { name: 'Rosh Hashana', day: 1 };
  if (title === 'Rosh Hashana II')        return { name: 'Rosh Hashana', day: 2 };
  const m = /^(Sukkot|Pesach|Shavuot) (VIII|VII|VI|IV|V|III|II|I)\b/.exec(title);
  return m ? { name: m[1] as Festival, day: ROMAN[m[2] as string] as number } : undefined;
}

/**
 * Groups Hebcal rows by calendar date. Hebcal dates a Chanukah row by the evening its candles
 * are lit, so "N Candles" is the *eve* of day N and the morning is the next calendar date.
 */
function buildDayFacts(entries: readonly HolidayEntry[]): DayFacts[] {
  const byDate = new Map<string, DayFacts>();
  const factsFor = (date: string): DayFacts => {
    let f = byDate.get(date);
    if (!f) {
      f = { date, saturday: isSaturday(date), titles: new Set(), roshChodesh: false };
      byDate.set(date, f);
    }
    return f;
  };

  for (const [date, rawTitle] of entries) {
    const title = normalizeHolidayTitle(rawTitle);
    const f = factsFor(date);
    f.titles.add(title);
    if (title.startsWith('Rosh Chodesh ')) f.roshChodesh = true;
    f.festival ??= festivalOf(title);

    const candles = /^Chanukah: (\d) Candles?$/.exec(title);
    if (candles) factsFor(shiftDate(date, 1)).chanukahDay = Number(candles[1]);
  }

  const sorted = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  let chmWeekdays = 0;
  for (const f of sorted) {
    if (f.festival?.name !== 'Pesach') continue;
    if (f.festival.day === 1) chmWeekdays = 0;
    if (f.festival.day >= 3 && f.festival.day <= 5 && !f.saturday) f.pesachChmWeekdayIndex = ++chmWeekdays;
  }
  return sorted;
}

type Weekday = 'saturday' | 'not-saturday' | 'any';
const onDay = (rule: Rule, day: Weekday): Rule =>
  f => rule(f) && (day === 'any' || f.saturday === (day === 'saturday'));

const hasTitle      = (title: string): Rule => f => f.titles.has(title);
const festivalDay   = (name: Festival, day: number): Rule => f => f.festival?.name === name && f.festival.day === day;
const isRoshChodesh: Rule = f => f.roshChodesh;

const FAST_TITLES: Record<string, string> = {
  'Tzom Gedaliah': 'Tzom Gedaliah',
  "Asara B'Tevet": "Asara B'Tevet",
  "Ta'anit Esther": "Ta'anit Esther",
  'Tzom Tammuz':   'Tzom Tammuz',
  "Tisha B'Av":    "Tish'a B'Av",
};
const SPECIAL_SHABBAT_TITLES = ['Shabbat Shekalim', 'Shabbat Zachor', 'Shabbat Parah', 'Shabbat HaChodesh'];
/** Specials that can coincide with Rosh Chodesh, which then gets its own occasion. */
const SPLITS_ON_ROSH_CHODESH = new Set(['Shabbat Shekalim', 'Shabbat HaChodesh']);

type RuleBuilder = (base: string, day: Weekday) => Rule | null;

/** Matches `base` against `pattern` and hands the capture groups to `build`. */
function matching(pattern: RegExp, build: (m: RegExpExecArray, day: Weekday) => Rule): RuleBuilder {
  return (base, day) => {
    const m = pattern.exec(base);
    return m ? build(m, day) : null;
  };
}

/** A rule for one fixed name. */
function named(name: string, rule: Rule): RuleBuilder {
  return base => (base === name ? rule : null);
}

/** A rule for one fixed name that also depends on its Shabbat/Mincha suffix. */
function namedByDay(name: string, build: (day: Weekday) => Rule): RuleBuilder {
  return (base, day) => (base === name ? build(day) : null);
}

const RULE_BUILDERS: RuleBuilder[] = [
  matching(/^(Rosh Hashana|Sukkot|Pesach|Shavuot) Day (\d)$/,
    (m, day) => onDay(festivalDay(m[1] as Festival, Number(m[2])), day)),

  // Sukkot's Chol HaMoed days III–VI read the korbanot of the matching festival day.
  matching(/^Sukkot Chol HaMoed Day (\d)$/,
    m => onDay(festivalDay('Sukkot', Number(m[1]) + 2), 'not-saturday')),
  // Pesach skips the Shabbat in Chol HaMoed, so days 1–3 are counted among the weekdays and day 4 is always VI.
  matching(/^Pesach Chol HaMoed Day (\d)$/, m => {
    const n = Number(m[1]);
    return n === 4 ? onDay(festivalDay('Pesach', 6), 'not-saturday') : f => f.pesachChmWeekdayIndex === n;
  }),

  matching(/^Sukkot Shabbat Chol HaMoed(?: \(Day (\d)\))?$/,
    m => onDay(festivalDay('Sukkot', Number(m[1] ?? 1) + 2), 'saturday')),
  named('Pesach Shabbat Chol HaMoed',
    onDay(f => f.festival?.name === 'Pesach' && f.festival.day >= 3 && f.festival.day <= 6, 'saturday')),

  named('Hoshana Rabbah', festivalDay('Sukkot', 7)),
  namedByDay('Yom Kippur',     day => onDay(hasTitle('Yom Kippur'), day)),
  named('Purim',          hasTitle('Purim')),
  namedByDay('Shmini Atzeret', day => onDay(hasTitle('Shmini Atzeret'), day)),
  named('Simchat Torah',  hasTitle('Simchat Torah')),
  // The Vezot Haberacha reading at hakafot is held on Shmini Atzeret's own date.
  named('Erev Simchat Torah', hasTitle('Shmini Atzeret')),
  (base) => (FAST_TITLES[base] ? hasTitle(FAST_TITLES[base]) : null),

  named('Rosh Chodesh', onDay(isRoshChodesh, 'not-saturday')),
  named('Shabbat Rosh Chodesh',
    f => f.saturday && f.roshChodesh && f.chanukahDay === undefined && !SPECIAL_SHABBAT_TITLES.some(t => f.titles.has(t))),
  named('Shabbat Rosh Chodesh Chanukah', onDay(f => f.chanukahDay === 6, 'saturday')),

  matching(/^(Shabbat \w+?)( \(Rosh Chodesh\))?$/, m => {
    const title = m[1] as string;
    if (!SPECIAL_SHABBAT_TITLES.includes(title)) return () => false;
    if (!SPLITS_ON_ROSH_CHODESH.has(title)) return hasTitle(title);
    return f => f.titles.has(title) && f.roshChodesh === Boolean(m[2]);
  }),

  matching(/^Shabbat Chanukah Day (\d)$/, m => onDay(f => f.chanukahDay === Number(m[1]), 'saturday')),
  // Day 6 always falls on Rosh Chodesh; only day 7 has separate with/without forms.
  matching(/^Chanukah Day (\d)( \(Rosh Chodesh\))?$/, m => {
    const n = Number(m[1]);
    const rc = Boolean(m[2]);
    return onDay(f => f.chanukahDay === n && (n !== 7 || f.roshChodesh === rc), 'not-saturday');
  }),
];

/** Which weekdays an occasion applies to, from the "(Mincha)" / "(Shabbat)" suffix of its name. */
function weekdayFor(name: string): Weekday {
  if (name.endsWith(' (Mincha)'))  return 'any';
  if (name.endsWith(' (Shabbat)')) return 'saturday';
  return 'not-saturday';
}

/**
 * The predicate that picks out every date an occasion's reading happens on, derived from the
 * occasion's `name_en`. Returns null for a name it doesn't recognise, so the form simply doesn't
 * autofill rather than guessing. "(Mincha)" and "Erev" occasions are separate readings held on a
 * day that also has a morning reading, so they share that day's date.
 */
export function occasionRule(name: string): Rule | null {
  const base = name.replace(/ \((Mincha|Shabbat)\)$/, '');
  const day  = weekdayFor(name);
  for (const build of RULE_BUILDERS) {
    const rule = build(base, day);
    if (rule) return rule;
  }
  return null;
}

/**
 * { occasion name_en: every date its reading happens on, ascending }. Occasions the rules don't
 * recognise are omitted, so a caller sees `undefined` and skips autofill.
 *
 * @param entries       rows from HOLIDAY_CACHE
 * @param occasionNames the occasions table's name_en values
 */
export function occasionDatesFromEntries(
  entries: readonly HolidayEntry[],
  occasionNames: readonly string[],
): Record<string, string[]> {
  const days = buildDayFacts(entries);
  const out: Record<string, string[]> = {};
  for (const name of occasionNames) {
    const rule = occasionRule(name);
    if (rule) out[name] = days.filter(rule).map(d => d.date);
  }
  return out;
}

/** Everything the entry form needs from the holiday cache. */
export interface HolidayDates {
  /** { occasion name_en: every date it happens on }, from `occasionDatesFromEntries`. */
  occasionDates:       Record<string, string[]>;
  /** Dates whose morning service has its own Torah reading (displaces a parsha's Mon/Thu reading). */
  morningReadingDates: string[];
  /** Dates (Yom Kippur) whose Mincha has its own Torah reading (displaces Shabbat Mincha's). */
  noMinchaDates:       string[];
}

export const NO_HOLIDAY_DATES: HolidayDates = { occasionDates: {}, morningReadingDates: [], noMinchaDates: [] };

export function holidayDatesFromEntries(entries: readonly HolidayEntry[], occasionNames: readonly string[]): HolidayDates {
  return {
    occasionDates:       occasionDatesFromEntries(entries, occasionNames),
    morningReadingDates: morningReadingDatesFromEntries(entries),
    noMinchaDates:       yomKippurDatesFromEntries(entries),
  };
}

/** Dates whose morning service has its own Torah reading, so Monday/Thursday's parsha reading is displaced. */
export function morningReadingDatesFromEntries(entries: readonly HolidayEntry[]): string[] {
  return [...new Set(entries.filter(e => e[2]).map(e => e[0]))].sort((a, b) => a.localeCompare(b));
}

/** Dates of Yom Kippur, whose Mincha has its own Torah reading. */
export function yomKippurDatesFromEntries(entries: readonly HolidayEntry[]): string[] {
  return entries.filter(e => normalizeHolidayTitle(e[1]) === 'Yom Kippur').map(e => e[0]).sort((a, b) => a.localeCompare(b));
}
