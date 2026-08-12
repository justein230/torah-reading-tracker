// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  scheduleFromEntries, normalizeParshaName, entriesFromHebcalItems,
  fetchLiveHebcalItems, buildSchedule, type HebcalItem, type SedraEntry,
} from '../../src/utils/sedra.ts';

const KNOWN = new Set(['Bereshit', 'Noach', 'Lech-Lecha', 'Vayakhel', 'Pekudei', "Sh'lach", "Re'eh"]);

describe('normalizeParshaName', () => {
  it('strips the "Parashat " prefix', () => {
    expect(normalizeParshaName('Parashat Bereshit')).toBe('Bereshit');
  });

  it('folds the typographic apostrophe (U+2019) to ASCII', () => {
    expect(normalizeParshaName('Parashat Sh’lach')).toBe("Sh'lach");
    expect(normalizeParshaName('Parashat Re’eh')).toBe("Re'eh");
  });

  it('leaves a plain hyphenated name untouched', () => {
    expect(normalizeParshaName('Parashat Vayakhel-Pekudei')).toBe('Vayakhel-Pekudei');
  });
});

describe('entriesFromHebcalItems', () => {
  it('keeps only parashat items and normalizes their names', () => {
    const items = [
      { title: 'Parashat Sh’lach', date: '2026-06-13T00:00:00', category: 'parashat' },
      { title: 'Rosh Hashana',     date: '2026-09-12T00:00:00', category: 'holiday'  },
    ];
    expect(entriesFromHebcalItems(items)).toEqual([['2026-06-13', "Sh'lach"]]);
  });
});

describe('scheduleFromEntries', () => {
  const entries = [
    ['2026-01-03', 'Bereshit'],
    ['2027-01-02', 'Bereshit'],          // later occurrence — must not overwrite
    ['2026-02-14', 'Vayakhel-Pekudei'],
    ['2025-12-01', 'Noach'],             // before `today` — ignored
  ] as const;

  it('maps each parsha to its first date on or after today', () => {
    const s = scheduleFromEntries(entries, KNOWN, '2026-01-01');
    expect(s['Bereshit']).toBe('2026-01-03');
  });

  it('ignores entries before today', () => {
    const s = scheduleFromEntries(entries, KNOWN, '2026-01-01');
    expect(s).not.toHaveProperty('Noach');
  });

  it('credits both halves of a combined parsha when both are known', () => {
    const s = scheduleFromEntries(entries, KNOWN, '2026-01-01');
    expect(s['Vayakhel-Pekudei']).toBe('2026-02-14');
    expect(s['Vayakhel']).toBe('2026-02-14');
    expect(s['Pekudei']).toBe('2026-02-14');
  });

  it('does not split a hyphenated name whose halves are not known parshiot', () => {
    const s = scheduleFromEntries([['2026-05-02', 'Lech-Lecha']] as const, KNOWN, '2026-01-01');
    expect(s['Lech-Lecha']).toBe('2026-05-02');
    expect(s).not.toHaveProperty('Lech');
    expect(s).not.toHaveProperty('Lecha');
  });
});

// ── fetchLiveHebcalItems ──────────────────────────────────────────────────────

/** Builds a fetch stub that returns `body` as JSON, plus a handle on the call args. */
function fetchStub(body: unknown, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({ ok, status, json: () => Promise.resolve(body) });
}

describe('fetchLiveHebcalItems', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  it('requests a two-year window starting at today, identifying the client', async () => {
    const fetchFn = fetchStub({ items: [] });
    await fetchLiveHebcalItems('2050-03-15', fetchFn as unknown as typeof fetch);

    const [url, init] = fetchFn.mock.calls[0]!;
    expect(url).toContain('start=2050-03-15');
    expect(url).toContain('end=2052-03-15');
    expect(init.headers['User-Agent']).toMatch(/^torah-tracker\//);
  });

  it('returns the items array verbatim (normalization happens downstream)', async () => {
    const items: HebcalItem[] = [{ title: 'Parashat Noach', date: '2050-10-22', category: 'parashat' }];
    const got = await fetchLiveHebcalItems('2050-01-01', fetchStub({ items }) as unknown as typeof fetch);
    expect(got).toEqual(items);
  });

  it('returns an empty list when the response body carries no items key', async () => {
    const got = await fetchLiveHebcalItems('2050-01-01', fetchStub({ range: {} }) as unknown as typeof fetch);
    expect(got).toEqual([]);
  });

  it('throws with the status code when the response is not ok', async () => {
    const fetchFn = fetchStub({}, false, 503);
    await expect(fetchLiveHebcalItems('2050-01-01', fetchFn as unknown as typeof fetch))
      .rejects.toThrow('Hebcal API returned HTTP 503');
  });
});

// ── buildSchedule ─────────────────────────────────────────────────────────────

describe('buildSchedule', () => {
  const CACHE: SedraEntry[] = [
    ['2049-10-16', 'Bereshit'],
    ['2050-01-08', 'Vayakhel-Pekudei'],
  ];
  const CACHE_END_YEAR = 2050;

  const opts = (over: Partial<Parameters<typeof buildSchedule>[0]> = {}) => ({
    parshaNames:  KNOWN,
    today:        '2049-01-01',
    cache:        CACHE,
    cacheEndYear: CACHE_END_YEAR,
    fetchLive:    vi.fn().mockResolvedValue([]),
    ...over,
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('never touches the network while today is before the cache end year', async () => {
    const fetchLive = vi.fn();
    const schedule  = await buildSchedule(opts({ fetchLive }));

    expect(fetchLive).not.toHaveBeenCalled();
    expect(schedule['Bereshit']).toBe('2049-10-16');
  });

  it('extends the cache with live entries once today reaches the cache end year', async () => {
    const fetchLive = vi.fn().mockResolvedValue([
      { title: 'Parashat Noach', date: '2051-10-21T00:00:00', category: 'parashat' },
      { title: 'Chanukah',       date: '2051-12-14T00:00:00', category: 'holiday'  },
    ]);

    const schedule = await buildSchedule(opts({ today: '2050-06-01', fetchLive }));

    expect(fetchLive).toHaveBeenCalledWith('2050-06-01');
    // Beyond the cache's last entry — only reachable via the live extend.
    expect(schedule['Noach']).toBe('2051-10-21');
    // Non-parashat items from the same response are dropped.
    expect(schedule).not.toHaveProperty('Chanukah');
  });

  it('falls back to a cache-only schedule when the live fetch fails, and logs why', async () => {
    const warn      = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchLive = vi.fn().mockRejectedValue(new Error('Hebcal API returned HTTP 503'));

    const schedule = await buildSchedule(opts({ today: '2050-01-01', fetchLive }));

    expect(schedule['Vayakhel-Pekudei']).toBe('2050-01-08');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('using cache only'), 'Hebcal API returned HTTP 503');
  });

  it('logs a non-Error rejection as-is rather than crashing on .message', async () => {
    const warn      = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchLive = vi.fn().mockRejectedValue('socket hang up');

    const schedule = await buildSchedule(opts({ today: '2050-01-01', fetchLive }));

    expect(schedule['Vayakhel-Pekudei']).toBe('2050-01-08');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('using cache only'), 'socket hang up');
  });

  it('keeps the earlier cached date when a live entry repeats the same parsha later', async () => {
    const fetchLive = vi.fn().mockResolvedValue([
      { title: 'Parashat Vayakhel-Pekudei', date: '2051-03-04T00:00:00', category: 'parashat' },
    ]);

    const schedule = await buildSchedule(opts({ today: '2050-01-01', fetchLive }));

    expect(schedule['Vayakhel-Pekudei']).toBe('2050-01-08');
    expect(schedule['Pekudei']).toBe('2050-01-08');
  });
});
