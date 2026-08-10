import { describe, it, expect } from 'vitest';
import { READINGS_SQL, SPECIAL_READINGS_SQL, WEEKDAY_ALIYOT_SQL, HOSAFOT_READINGS_SQL } from '../../src/db/queries.js';

// Dynamically import so we can mock ical-generator before it's resolved.
// calendar-feed.ts uses `await import('ical-generator')` so no module-level mock needed;
// the real ical-generator is available in test deps and produces a real iCal string.

import { buildCalendarFeed } from '../../src/utils/calendar-feed.js';

// ── mock DB factory ────────────────────────────────────────────────────────────

type SqlData = {
  readings?: object[];
  specials?: object[];
  weekdays?: object[];
  hosafot?: object[];
};

function makeDb(data: SqlData = {}) {
  const readings = data.readings ?? [];
  const specials = data.specials ?? [];
  const weekdays = data.weekdays ?? [];
  const hosafot  = data.hosafot  ?? [];

  return {
    prepare: (sql: string) => ({
      all: () => {
        if (sql === READINGS_SQL)         return readings;
        if (sql === SPECIAL_READINGS_SQL) return specials;
        if (sql === WEEKDAY_ALIYOT_SQL)   return weekdays;
        if (sql === HOSAFOT_READINGS_SQL) return hosafot;
        return [];
      },
    }),
  } as any;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function stdRow(overrides: object = {}) {
  return { date_read: '2024-03-01', parsha_en: 'Bereishit', aliyah: 1, pair_name: '', location: '', ...overrides };
}

function specialRow(overrides: object = {}) {
  return { date_read: '2024-03-01', parsha_en: 'Bereishit', aliyah_key: 'maftir', occasion_en: 'Rosh Hashana', location: '', ...overrides };
}

function weekdayRow(overrides: object = {}) {
  return { parsha_en: 'Bereishit', aliyah_num: 1, all_dates: '2024-03-04', location: '', ...overrides };
}

function hosafahRow(overrides: object = {}) {
  return { date_read: '2024-03-01', parsha1_en: 'Bereishit', sefer: 'Genesis', occasion_en: '', location: '', ...overrides };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('buildCalendarFeed — empty DB', () => {
  it('returns a valid iCal string with no VEVENT blocks', async () => {
    const feed = await buildCalendarFeed(makeDb());
    expect(feed).toContain('BEGIN:VCALENDAR');
    expect(feed).toContain('END:VCALENDAR');
    expect(feed).not.toContain('BEGIN:VEVENT');
  });
});

describe('buildCalendarFeed — single standard reading', () => {
  it('produces one VEVENT with correct SUMMARY and DESCRIPTION', async () => {
    const feed = await buildCalendarFeed(makeDb({ readings: [stdRow()] }));
    expect(feed).toContain('BEGIN:VEVENT');
    expect(feed).toContain('Torah Reading');
    expect(feed).toContain('Bereishit');
    expect(feed).toContain('Aliyah 1');
  });

  it('uses pair_name in label when present', async () => {
    const feed = await buildCalendarFeed(makeDb({
      readings: [stdRow({ pair_name: 'Vayakhel-Pekudei' })],
    }));
    expect(feed).toContain('Vayakhel-Pekudei');
  });

  it('assigns a stable UID based on date', async () => {
    const feed = await buildCalendarFeed(makeDb({ readings: [stdRow()] }));
    expect(feed).toMatch(/UID:torah-2024-03-01@torah-tracker/);
  });
});

describe('buildCalendarFeed — single hosafah reading', () => {
  it('produces a VEVENT labelled as Hosafah using parsha1_en', async () => {
    const feed = await buildCalendarFeed(makeDb({ hosafot: [hosafahRow()] }));
    expect(feed).toContain('BEGIN:VEVENT');
    expect(feed).toContain('Bereishit');
    expect(feed).toContain('Hosafah');
  });

  it('falls back to sefer name when parsha1_en is empty', async () => {
    const feed = await buildCalendarFeed(makeDb({ hosafot: [hosafahRow({ parsha1_en: '' })] }));
    expect(feed).toContain('Genesis');
    expect(feed).toContain('Hosafah');
  });

  it('appends occasion when present', async () => {
    const feed = await buildCalendarFeed(makeDb({ hosafot: [hosafahRow({ occasion_en: 'Shabbat Shuva' })] }));
    expect(feed).toContain('Hosafah (Shabbat Shuva)');
  });
});

describe('buildCalendarFeed — single special reading', () => {
  it('produces a VEVENT with occasion label', async () => {
    const feed = await buildCalendarFeed(makeDb({ specials: [specialRow()] }));
    expect(feed).toContain('BEGIN:VEVENT');
    expect(feed).toContain('Rosh Hashana');
    expect(feed).toContain('maftir');
  });
});

describe('buildCalendarFeed — weekday reading', () => {
  it('produces a VEVENT on the correct date from all_dates', async () => {
    const feed = await buildCalendarFeed(makeDb({ weekdays: [weekdayRow()] }));
    expect(feed).toContain('BEGIN:VEVENT');
    expect(feed).toContain('torah-2024-03-04@torah-tracker');
    expect(feed).toContain('Weekday Aliyah 1');
  });

  it('skips weekday rows with empty all_dates', async () => {
    const feed = await buildCalendarFeed(makeDb({ weekdays: [weekdayRow({ all_dates: '' })] }));
    expect(feed).not.toContain('BEGIN:VEVENT');
  });

  it('creates multiple events when all_dates has several dates', async () => {
    const feed = await buildCalendarFeed(makeDb({ weekdays: [weekdayRow({ all_dates: '2024-03-04,2024-03-11' })] }));
    const count = (feed.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(count).toBe(2);
  });
});

describe('buildCalendarFeed — same date, same location', () => {
  it('merges two readings into one VEVENT', async () => {
    const feed = await buildCalendarFeed(makeDb({
      readings: [
        stdRow({ aliyah: 1 }),
        stdRow({ aliyah: 2 }),
      ],
    }));
    const count = (feed.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(count).toBe(1);
    expect(feed).toContain('Aliyah 1');
    expect(feed).toContain('Aliyah 2');
  });
});

describe('buildCalendarFeed — same date, different locations', () => {
  it('produces two separate VEVENTs', async () => {
    const feed = await buildCalendarFeed(makeDb({
      readings: [
        stdRow({ location: 'Shul A' }),
        stdRow({ location: 'Shul B' }),
      ],
    }));
    const count = (feed.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(count).toBe(2);
  });

  it('assigns stable numeric suffixes to UIDs when multiple events share a date', async () => {
    const feed = await buildCalendarFeed(makeDb({
      readings: [
        stdRow({ location: 'Shul A' }),
        stdRow({ location: 'Shul B' }),
      ],
    }));
    expect(feed).toContain('torah-2024-03-01-1@torah-tracker');
    expect(feed).toContain('torah-2024-03-01-2@torah-tracker');
  });
});

describe('buildCalendarFeed — UID stability by location sort', () => {
  it('assigns UID-1 to lexicographically first location regardless of insertion order', async () => {
    // Insert Shul B first, Shul A second — sorted order should still give Shul A UID-1
    const feed = await buildCalendarFeed(makeDb({
      readings: [
        stdRow({ location: 'Shul B' }),
        stdRow({ location: 'Shul A' }),
      ],
    }));
    // UID-1 should contain Shul A (first alphabetically)
    const lines = feed.split(/\r?\n/);
    const uidLines = lines.filter(l => l.startsWith('UID:'));
    const locLines = lines.filter(l => l.startsWith('LOCATION:'));
    // Both UIDs present
    expect(uidLines.some(l => l.includes('-1@'))).toBe(true);
    expect(uidLines.some(l => l.includes('-2@'))).toBe(true);
    // Shul A appears before Shul B in sorted output
    const idxA = locLines.findIndex(l => l.includes('Shul A'));
    const idxB = locLines.findIndex(l => l.includes('Shul B'));
    expect(idxA).toBeLessThan(idxB);
  });
});
