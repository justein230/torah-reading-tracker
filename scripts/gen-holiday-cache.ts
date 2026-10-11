/**
 * Generates src/data/holidayCache.ts from the Hebcal.com REST API.
 *
 * Same idempotent "prebuild" contract as gen-sedra-cache.ts: it reads the coverage marker of the
 * existing cache and fetches only what is missing, so a normal build (cache committed and
 * complete) makes ZERO network requests and works offline.
 *
 * Each row is [date, title, hasTorah]. `hasTorah` is true when the day's *morning* service reads
 * from the Torah (leyning.torah names a book of the Torah), which is what displaces a parsha's
 * Monday/Thursday reading. Erev Purim and Erev Tish'a B'Av carry a megillah reading only, and
 * Mincha readings aren't reported at all, so neither counts.
 *
 * Usage: npm run gen:holiday-cache [-- --force]
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { HolidayEntry } from '../src/utils/occasionDates.ts';
import { USER_AGENT, fetchRange, type Chunk } from './hebcal-range.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH  = path.join(__dirname, '../src/data/holidayCache.ts');

/** Inclusive calendar-year range the cache must cover. Matches the sedra cache. */
const TARGET: [number, number] = [1990, 2050];

/** Holidays (major + minor + fasts + special Shabbatot), Rosh Chodesh, Diaspora, with readings. */
const QUERY = 'v=1&cfg=json&maj=on&min=on&nx=on&mf=on&ss=on&mod=off&s=off&i=off&leyning=on';

const TORAH_BOOK = /^(Genesis|Exodus|Leviticus|Numbers|Deuteronomy)\b/;

interface HebcalItem { title: string; date: string; category: string; leyning?: { torah?: string } }
interface HebcalResponse { items?: HebcalItem[]; range?: { start: string; end: string } }

/** Reads the coverage marker of the cache on disk, or null when absent/unparseable. */
function readCoverage(): [number, number] | null {
  let src: string;
  try {
    src = fs.readFileSync(OUT_PATH, 'utf8');
  } catch {
    return null;
  }
  const m = /HOLIDAY_YEARS[^=]*=\s*\[\s*(\d{4})\s*,\s*(\d{4})\s*\]/.exec(src);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/** Keeps holidays and Rosh Chodesh; drops candle lighting, omer, mevarchim and the like. */
function toEntries(items: readonly HebcalItem[]): HolidayEntry[] {
  return items
    .filter(i => i.category === 'holiday' || i.category === 'roshchodesh')
    .map((i): HolidayEntry => [i.date.slice(0, 10), i.title, TORAH_BOOK.test(i.leyning?.torah ?? '')]);
}

async function fetchChunk(startISO: string, endISO: string): Promise<Chunk<HolidayEntry>> {
  const res = await fetch(`https://www.hebcal.com/hebcal?${QUERY}&start=${startISO}&end=${endISO}`, {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Hebcal API returned HTTP ${res.status} for ${startISO}..${endISO}`);

  const body    = await res.json() as HebcalResponse;
  const entries = toEntries(body.items ?? []);
  const servedEnd = body.range?.end?.slice(0, 10) ?? entries.at(-1)?.[0] ?? endISO;
  return { entries, servedEnd };
}

/** Sorts, de-duplicates on date+title, and renders the module source. */
function renderModule(entries: HolidayEntry[], [from, to]: [number, number]): string {
  const unique = new Map<string, HolidayEntry>();
  for (const e of entries) unique.set(`${e[0]}|${e[1]}`, e);

  const rows = [...unique.values()]
    .sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))
    .map(([date, title, hasTorah]) => `  ['${date}', ${JSON.stringify(title)}, ${hasTorah}],`)
    .join('\n');

  return `/**
 * GENERATED FILE — do not edit by hand. Run: npm run gen:holiday-cache -- --force
 *
 * Jewish holiday, fast-day, special-Shabbat and Rosh Chodesh dates for the Diaspora.
 *
 * Source: Hebcal.com REST API — https://www.hebcal.com
 * Data licensed CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
 */

import type { HolidayEntry } from '../utils/occasionDates.js';

/** Inclusive calendar-year range this cache covers. */
export const HOLIDAY_YEARS: readonly [number, number] = [${from}, ${to}];

/** [ISO date, Hebcal title, has a morning Torah reading] rows, sorted by date. */
export const HOLIDAY_CACHE: readonly HolidayEntry[] = [
${rows}
];
`;
}

async function main(): Promise<void> {
  const force    = process.argv.includes('--force');
  const coverage = readCoverage();

  if (!force && coverage && coverage[0] <= TARGET[0] && coverage[1] >= TARGET[1]) {
    console.log(`holiday cache: covers ${coverage[0]}-${coverage[1]}, target ${TARGET[0]}-${TARGET[1]} — 0 chunks fetched.`);
    return;
  }

  // Unlike the sedra cache there is no partial extend: the file is small and one pass is simpler.
  console.log(`holiday cache: fetching ${TARGET[0]}-${TARGET[1]} from hebcal.com…`);

  try {
    const { entries, requests } = await fetchRange(TARGET[0], TARGET[1], fetchChunk);
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, renderModule(entries, TARGET));
    console.log(`holiday cache: ${requests} requests, ${entries.length} entries → ${path.relative(process.cwd(), OUT_PATH)}`);
  } catch (err) {
    // A network failure must never break the build. Keep whatever cache exists.
    const reason = err instanceof Error ? err.message : String(err);
    if (coverage) {
      console.warn(`holiday cache: fetch failed (${reason}) — keeping existing cache (${coverage[0]}-${coverage[1]}).`);
      return;
    }
    console.warn(`holiday cache: fetch failed (${reason}) — writing an empty cache; holiday autofill will be unavailable.`);
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, renderModule([], TARGET));
  }
}

await main();
