/**
 * Shared by the gen-*-cache scripts: walks a year range through the Hebcal.com REST API.
 *
 * The API silently clamps every request to a ~10-year span and returns HTTP 200, so the
 * next chunk is always driven from the `range.end` the response reports rather than from
 * the end date we asked for.
 */

/** Hebcal asks API consumers to identify themselves. */
export const USER_AGENT = 'torah-tracker/1.0 (+https://github.com/justein/torah)';

const REQUEST_GAP  = 1000; // ms between requests, to stay a polite client
const MAX_REQUESTS = 20;   // guards against a clamp change turning this into a loop

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** What one chunk request yields: its entries plus the end date the API actually served. */
export interface Chunk<T> { entries: T[]; servedEnd: string }

/** Fetches `[startISO, endISO]` from Hebcal.com and returns the shaped entries. */
export type ChunkFetcher<T> = (startISO: string, endISO: string) => Promise<Chunk<T>>;

/** Walks `fromYear`-01-01 … `toYear`-12-31 in whatever chunk size the API grants us. */
export async function fetchRange<T>(
  fromYear: number,
  toYear: number,
  fetchChunk: ChunkFetcher<T>,
): Promise<{ entries: T[]; requests: number }> {
  const finalDate = `${toYear}-12-31`;
  const entries: T[] = [];
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
