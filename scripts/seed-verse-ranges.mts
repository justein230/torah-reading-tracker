/**
 * Populates chapter_start/verse_start/chapter_end/verse_end on the parshiot and
 * aliyot tables (aliyot 1-7) using the Hebcal.com REST API as the source of truth.
 * Safe to re-run (idempotent).
 *
 * This is a one-time seed/regeneration tool. It reaches the network so the project
 * carries no @hebcal/* dependency (data is CC BY 4.0 — https://www.hebcal.com).
 *
 * The /leyning endpoint is date-based and clamps each request to ~6 months, so it is
 * walked in chunks (following the `range.end` it reports) until every parsha has been
 * seen as a standalone (non-combined) reading. Diaspora combines some pairs most years,
 * so the walk may span a decade before Matot/Masei appear separately — that is expected.
 *
 * Usage:
 *   npx tsx scripts/seed-verse-ranges.mts [path-to-db]
 *   TORAH_DB_PATH=torah.db npx tsx scripts/seed-verse-ranges.mts
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { eq, and } from 'drizzle-orm';
import { createDb } from '../src/db/drizzle-server.js';
import { aliyot, parshiot } from '../src/db/schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.argv[2] ?? process.env.TORAH_DB_PATH ?? path.join(__dirname, '../torah.db');

/** One aliyah's verse range, as the /leyning endpoint returns it (b/e = "chapter:verse"). */
interface Aliyah { b: string; e: string }
type FullKriyah = Record<string, Aliyah>;
interface LeyningItem { name?: { en: string }; fullkriyah?: FullKriyah }
interface LeyningResponse { items?: LeyningItem[]; range?: { start: string; end: string } }

const FINAL_DATE   = '2040-12-31'; // upper bound for the walk (Matot/Masei separate ~2035)
const MAX_REQUESTS = 40;
const REQUEST_GAP  = 600;

// The REST API renders names with a typographic apostrophe (U+2019); the DB uses ASCII.
const foldApostrophe = (s: string) => s.split('’').join("'");
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Vezot Haberakhah is read on Simchat Torah, where its aliyot are divided differently
// (the 6th runs to 34:12 and a 7th is taken from Bereshit). The REST calendar therefore
// never exposes its standalone 7-way division, so its fixed ranges are stated here.
// Source: the same @hebcal/leyning data this table was originally seeded from.
const VEZOT_HABERAKHAH: FullKriyah = {
  '1': { b: '33:1',  e: '33:7'  },
  '2': { b: '33:8',  e: '33:12' },
  '3': { b: '33:13', e: '33:17' },
  '4': { b: '33:18', e: '33:21' },
  '5': { b: '33:22', e: '33:26' },
  '6': { b: '33:27', e: '33:29' },
  '7': { b: '34:1',  e: '34:12' },
};

/** Walks /leyning until every name in `wanted` has a standalone fullkriyah, or we run out. */
async function collectFullKriyah(wanted: Set<string>): Promise<Map<string, FullKriyah>> {
  const found = new Map<string, FullKriyah>();
  let cursor = new Date().toISOString().slice(0, 10);
  let requests = 0;

  while (cursor <= FINAL_DATE && requests < MAX_REQUESTS && found.size < wanted.size) {
    if (requests > 0) await sleep(REQUEST_GAP);
    const url = 'https://www.hebcal.com/leyning?cfg=json&triennial=off'
              + `&start=${cursor}&end=${FINAL_DATE}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'torah-tracker/1.0' } });
    if (!res.ok) throw new Error(`Hebcal API returned HTTP ${res.status} for ${cursor}`);
    const body = await res.json() as LeyningResponse;
    requests++;

    for (const item of body.items ?? []) {
      if (!item.fullkriyah || !item.name) continue;
      const name = foldApostrophe(item.name.en);
      if (wanted.has(name) && !found.has(name)) found.set(name, item.fullkriyah);
    }

    const end = body.range?.end;
    if (!end || end >= FINAL_DATE || end < cursor) break;
    const next = new Date(`${end}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    cursor = next.toISOString().slice(0, 10);
  }
  return found;
}

const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON');
const db = createDb(sqlite);

const allParshiot = db.select({ id: parshiot.id, nameEn: parshiot.nameEn }).from(parshiot).all();

// Vezot Haberakhah comes from the constant above; everything else from the API.
const wanted = new Set(allParshiot.map(p => p.nameEn).filter(n => n !== 'Vezot Haberakhah'));
const fetched = await collectFullKriyah(wanted);

let parshiotUpdated = 0;
let aliyotUpdated = 0;

for (const { id: parshaId, nameEn: parsha } of allParshiot) {
  const fullkriyah = parsha === 'Vezot Haberakhah' ? VEZOT_HABERAKHAH : fetched.get(parsha);
  if (!fullkriyah) {
    console.warn(`No standalone reading found for ${parsha} — left unchanged.`);
    continue;
  }

  const aliyahEntries = Object.entries(fullkriyah)
    .map(([key, aliyah]) => [Number.parseInt(key, 10), aliyah] as const)
    .filter(([num]) => !Number.isNaN(num)) // drop maftir 'M'; this script seeds aliyot 1-7
    .sort(([a], [b]) => a - b);
  const first = aliyahEntries[0][1];
  const last  = aliyahEntries[aliyahEntries.length - 1][1];
  const [parshaChapterStart, parshaVerseStart] = first.b.split(':').map(Number);
  const [parshaChapterEnd,   parshaVerseEnd]   = last.e.split(':').map(Number);

  db.update(parshiot)
    .set({
      chapterStart: parshaChapterStart,
      verseStart: parshaVerseStart,
      chapterEnd: parshaChapterEnd,
      verseEnd: parshaVerseEnd,
    })
    .where(eq(parshiot.id, parshaId))
    .run();
  parshiotUpdated++;

  for (const [num, aliyah] of aliyahEntries) {
    const [chapterStart, verseStart] = aliyah.b.split(':').map(Number);
    const [chapterEnd,   verseEnd]   = aliyah.e.split(':').map(Number);

    db.update(aliyot)
      .set({ chapterStart, verseStart, chapterEnd, verseEnd })
      .where(and(eq(aliyot.parshaId, parshaId), eq(aliyot.aliyah, num)))
      .run();
    aliyotUpdated++;
  }
}

console.log(`Updated ${parshiotUpdated} parshiot and ${aliyotUpdated} aliyot in ${dbPath}`);
sqlite.close();
