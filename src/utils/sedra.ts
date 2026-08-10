import { parshaKeysFromDesc } from './sedra-parse.js';

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
