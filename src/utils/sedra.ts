import { parshaKeysFromDesc } from './sedra-parse.js';
import { errText } from './errText.js';

/** A single [ISO date, parsha name_en] pair, as stored in SEDRA_CACHE. */
export type SedraEntry = readonly [date: string, parsha: string];

/** Shape of one item in a Hebcal.com REST API response (fields we use). */
export interface HebcalItem { title: string; date: string; category: string }

/**
 * The REST API renders names with a typographic apostrophe (U+2019) — "Sh’lach" —
 * where the parshiot.name_en column uses ASCII ("Sh'lach"). Unicode NFKC does not fold
 * U+2019 to "'", so we replace it explicitly. Without this, Beha'alotcha, Ha'azinu,
 * Re'eh and Sh'lach would silently never match a parsha and drop out of the schedule.
 */
export function normalizeParshaName(title: string): string {
  return title.replace(/^Parashat /, '').split('’').join("'");
}

/** Maps a raw REST API item list to sorted [date, name] entries (parashat only). */
export function entriesFromHebcalItems(items: readonly HebcalItem[]): SedraEntry[] {
  return items
    .filter(i => i.category === 'parashat')
    .map((i): SedraEntry => [i.date.slice(0, 10), normalizeParshaName(i.title)]);
}

/**
 * Reduces flat [date, parshaName] entries into the schedule map the app consumes:
 * { parshaName: firstDate on or after `today` }.
 *
 * Entries need not be pre-sorted. Combined parshiot ("Vayakhel-Pekudei") also credit
 * each confirmed half, via parshaKeysFromDesc — matching the previous library path.
 *
 * @param entries flat [ISO date, parsha name] pairs (e.g. SEDRA_CACHE)
 * @param known   the set of valid parsha name_en values, used to guard hyphen splits
 * @param today   ISO date (YYYY-MM-DD); entries before it are ignored
 */
export function scheduleFromEntries(
  entries: readonly SedraEntry[],
  known: Set<string>,
  today: string,
): Record<string, string> {
  const schedule: Record<string, string> = {};
  for (const [date, name] of entries) {
    if (date < today) continue;
    for (const key of parshaKeysFromDesc(name, known)) {
      const existing = schedule[key];
      if (!existing || date < existing) schedule[key] = date;
    }
  }
  return schedule;
}

/**
 * Reduces flat [date, parshaName] entries into { parshaName: every date it was read },
 * with no `today` filtering — used to check whether a *historical* date genuinely had
 * a reading of a given parsha, as opposed to `scheduleFromEntries`'s "next occurrence".
 *
 * @param entries flat [ISO date, parsha name] pairs (e.g. SEDRA_CACHE)
 * @param known   the set of valid parsha name_en values, used to guard hyphen splits
 */
export function datesByParshaFromEntries(
  entries: readonly SedraEntry[],
  known: Set<string>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [date, name] of entries) {
    for (const key of parshaKeysFromDesc(name, known)) {
      out[key] ??= [];
      out[key].push(date);
    }
  }
  return out;
}

/** Hebcal asks API consumers to identify themselves. */
const USER_AGENT = 'torah-tracker/1.0';

/** Shared GET against the Hebcal.com REST API for a [start, end] date window. */
async function fetchHebcalWindow(
  startISO: string,
  endISO: string,
  fetchFn: typeof fetch,
): Promise<HebcalItem[]> {
  const url = 'https://www.hebcal.com/hebcal?v=1&cfg=json&s=on&i=off&leyning=off'
            + `&start=${startISO}&end=${endISO}`;

  const res = await fetchFn(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Hebcal API returned HTTP ${res.status}`);
  const body = await res.json() as { items?: HebcalItem[] };
  return body.items ?? [];
}

/**
 * Fetches the two years of parshiot starting at `today` from Hebcal.com. Used only to
 * extend past the end of the baked cache; callers are expected to treat any rejection as
 * "no live entries" and fall back to the cache.
 *
 * @param today   ISO date (YYYY-MM-DD) the window starts at
 * @param fetchFn injectable for tests; defaults to the global fetch
 */
export async function fetchLiveHebcalItems(
  today: string,
  fetchFn: typeof fetch = fetch,
): Promise<HebcalItem[]> {
  const end = new Date(`${today}T00:00:00Z`);
  end.setUTCFullYear(end.getUTCFullYear() + 2);
  return fetchHebcalWindow(today, end.toISOString().slice(0, 10), fetchFn);
}

/**
 * Fetches a single day's items from Hebcal.com. Used to verify a reading date that
 * falls outside the baked cache's range (SEDRA_YEARS), on demand and opt-in.
 *
 * @param date    ISO date (YYYY-MM-DD) to look up
 * @param fetchFn injectable for tests; defaults to the global fetch
 */
export async function fetchLiveHebcalItemsForDate(
  date: string,
  fetchFn: typeof fetch = fetch,
): Promise<HebcalItem[]> {
  return fetchHebcalWindow(date, date, fetchFn);
}

/** Everything buildSchedule needs, injected so it can be exercised without a clock or network. */
export interface BuildScheduleOptions {
  /** Valid parshiot.name_en values — guards hyphen splitting of combined parshiot. */
  parshaNames:  Set<string>;
  /** ISO date (YYYY-MM-DD); entries before it are ignored. */
  today:        string;
  /** The baked cache, normally SEDRA_CACHE. */
  cache:        readonly SedraEntry[];
  /** Last calendar year the cache covers, normally SEDRA_YEARS[1]. */
  cacheEndYear: number;
  /** Fetches live entries; only called once `today` reaches `cacheEndYear`. */
  fetchLive:    (today: string) => Promise<HebcalItem[]>;
}

/** What `buildSchedule` returns: the upcoming-parsha schedule, plus every date each parsha was ever read. */
export interface Schedule {
  /** { parshaName: firstDate on or after `today` }. */
  schedule:      Record<string, string>;
  /** { parshaName: every date it was read }, unfiltered by `today` — for historical lookups. */
  datesByParsha: Record<string, string[]>;
}

/**
 * Builds the upcoming-parsha schedule, extending the baked cache with a live fetch only
 * when `today` has reached the last year the cache covers.
 *
 * Staying cache-only for the common case is what lets a normal build — and every offline
 * client — work with zero network requests. A live fetch that fails is logged and ignored:
 * a stale-but-present schedule is far better than none.
 */
export async function buildSchedule(opts: BuildScheduleOptions): Promise<Schedule> {
  const { parshaNames, today, cache, cacheEndYear, fetchLive } = opts;

  let entries: readonly SedraEntry[] = cache;
  if (Number(today.slice(0, 4)) >= cacheEndYear) {
    try {
      entries = [...cache, ...entriesFromHebcalItems(await fetchLive(today))];
    } catch (err) {
      console.warn('Hebcal live extend failed, using cache only:', errText(err));
    }
  }

  return {
    schedule:      scheduleFromEntries(entries, parshaNames, today),
    datesByParsha: datesByParshaFromEntries(entries, parshaNames),
  };
}
