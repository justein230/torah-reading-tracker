/**
 * Generates src/data/sedraCache.ts from the Hebcal.com REST API.
 *
 * Runs as a "prebuild" step. It is idempotent: it reads the coverage marker of the
 * existing cache and fetches only the chunks that are missing, so a normal build
 * (cache committed and complete) makes ZERO network requests and works offline.
 *
 * The API silently clamps every request to a ~10-year span and returns HTTP 200, so
 * the next chunk is always driven from the `range.end` the response reports rather
 * than from the end date we asked for. Covering 1990-2050 therefore takes 7 requests.
 *
 * A past year's parsha schedule is a fixed calendar calculation and never changes, so
 * a cached chunk never goes stale.
 *
 * Usage: npm run gen:sedra-cache [-- --force]
 */

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { entriesFromHebcalItems, type HebcalItem, type SedraEntry } from '../src/utils/sedra.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_PATH  = path.join(__dirname, '../src/data/sedraCache.ts');

/** Inclusive calendar-year range the cache must cover. Widen to extend it. */
const TARGET: [number, number] = [1990, 2050];

/** Hebcal asks API consumers to identify themselves. */
const USER_AGENT   = 'torah-tracker/1.0 (+https://github.com/justein/torah)';
const REQUEST_GAP  = 1000; // ms between requests, to stay a polite client
const MAX_REQUESTS = 20;   // guards against a clamp change turning this into a loop

type Entry = SedraEntry;

interface HebcalResponse { items?: HebcalItem[]; range?: { start: string; end: string } }

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Reads the coverage marker of the cache that is already on disk. Returns null when
 * the file is absent or unparseable, which forces a full rebuild.
 */
function readCoverage(): [number, number] | null {
  let src: string;
  try {
    src = fs.readFileSync(OUT_PATH, 'utf8');
  } catch {
    return null;
  }
  const m = /SEDRA_YEARS[^=]*=\s*\[\s*(\d{4})\s*,\s*(\d{4})\s*\]/.exec(src);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/** Fetches one chunk. Returns its entries plus the end date the API actually served. */
async function fetchChunk(startISO: string, endISO: string): Promise<{ entries: Entry[]; servedEnd: string }> {
  const url = 'https://www.hebcal.com/hebcal?v=1&cfg=json&s=on&i=off&leyning=off'
            + `&start=${startISO}&end=${endISO}`;

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Hebcal API returned HTTP ${res.status} for ${startISO}..${endISO}`);

  const body = await res.json() as HebcalResponse;
  const entries = entriesFromHebcalItems(body.items ?? []);

  const servedEnd = body.range?.end?.slice(0, 10)
    ?? entries[entries.length - 1]?.[0]
    ?? endISO;

  return { entries, servedEnd };
}

/** Walks the target range in whatever chunk size the API grants us. */
async function fetchRange(fromYear: number, toYear: number): Promise<{ entries: Entry[]; requests: number }> {
  const finalDate = `${toYear}-12-31`;
  const entries: Entry[] = [];
  let cursor   = `${fromYear}-01-01`;
  let requests = 0;

  while (cursor <= finalDate && requests < MAX_REQUESTS) {
    if (requests > 0) await sleep(REQUEST_GAP);
    const { entries: chunk, servedEnd } = await fetchChunk(cursor, finalDate);
    requests++;
    entries.push(...chunk);

    // The API clamps to ~10 years; resume from the day after what it actually served.
    if (servedEnd >= finalDate || servedEnd < cursor) break;
    const next = new Date(`${servedEnd}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    cursor = next.toISOString().slice(0, 10);
  }

  return { entries, requests };
}

/** Sorts, de-duplicates on date, and renders the module source. */
function renderModule(entries: Entry[], [from, to]: [number, number]): string {
  const byDate = new Map<string, string>();
  for (const [date, parsha] of entries) byDate.set(date, parsha);

  const rows = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, parsha]) => `  ['${date}', ${JSON.stringify(parsha)}],`)
    .join('\n');

  return `/**
 * GENERATED FILE — do not edit by hand. Run: npm run gen:sedra-cache -- --force
 *
 * Weekly Torah portion (parsha) dates for the Diaspora reading cycle.
 *
 * Source: Hebcal.com REST API — https://www.hebcal.com
 * Data licensed CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/
 */

/** Inclusive calendar-year range this cache covers. */
export const SEDRA_YEARS: readonly [number, number] = [${from}, ${to}];

/** [ISO date, parsha name_en] pairs, sorted by date. Combined parshiot keep their
 *  hyphenated name; src/utils/sedra.ts splits them into their halves. */
export const SEDRA_CACHE: readonly (readonly [string, string])[] = [
${rows}
];
`;
}

async function main(): Promise<void> {
  const force    = process.argv.includes('--force');
  const coverage = readCoverage();

  if (!force && coverage && coverage[0] <= TARGET[0] && coverage[1] >= TARGET[1]) {
    console.log(`sedra cache: covers ${coverage[0]}-${coverage[1]}, target ${TARGET[0]}-${TARGET[1]} — 0 chunks fetched.`);
    return;
  }

  // Only the years outside the existing coverage need fetching. Any gap at either end
  // widens the window; a full rebuild happens when there is no usable cache at all.
  const rebuildAll = force || !coverage;
  const from = rebuildAll ? TARGET[0] : Math.min(TARGET[0], coverage![1] + 1);
  const to   = TARGET[1];

  console.log(`sedra cache: fetching ${from}-${to} from hebcal.com…`);

  let fetched: Entry[];
  let requests: number;
  try {
    ({ entries: fetched, requests } = await fetchRange(from, to));
  } catch (err) {
    // A network failure must never break the build. Keep whatever cache exists.
    const reason = err instanceof Error ? err.message : String(err);
    if (coverage) {
      console.warn(`sedra cache: fetch failed (${reason}) — keeping existing cache (${coverage[0]}-${coverage[1]}).`);
      return;
    }
    console.warn(`sedra cache: fetch failed (${reason}) — writing an empty cache; the schedule will be unavailable.`);
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, renderModule([], TARGET));
    return;
  }

  // Merge with what is already on disk so a partial extend keeps the older years.
  const existing: Entry[] = [];
  if (!rebuildAll) {
    const src = fs.readFileSync(OUT_PATH, 'utf8');
    for (const m of src.matchAll(/\['(\d{4}-\d{2}-\d{2})',\s*"((?:[^"\\]|\\.)*)"\]/g)) {
      existing.push([m[1]!, JSON.parse(`"${m[2]!}"`) as string]);
    }
  }

  const merged = [...existing, ...fetched];
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, renderModule(merged, TARGET));
  console.log(`sedra cache: ${requests} requests, ${merged.length} entries → ${path.relative(process.cwd(), OUT_PATH)}`);
}

await main();
