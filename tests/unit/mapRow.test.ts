import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mapRow, enrichRows } from '../../src/api.js';

// ── mapRow ────────────────────────────────────────────────────────────────────

const BASE = {
  sefer: 'בְּרֵאשִׁית', parsha: 'בְּרֵאשִׁית', aliyah: 1,
  pseukim: 50, pct: 1.5,
  orig: '', fut: '', occasion: '', location: '', reread_count: 0,
};

describe('mapRow — unread aliyah', () => {
  it('marks aliyah as unread when orig is empty', () => {
    const r = mapRow({ ...BASE, orig: '' });
    expect(r.isRead).toBe(false);
    expect(r.isReadPast).toBe(false);
    expect(r.isReadFuture).toBe(false);
    expect(r.isFuture).toBe(false);
    expect(r.yearRead).toBeNull();
    expect(r.futDates).toEqual([]);
    expect(r.hasFuture).toBe(false);
  });

  it('passes through pseukim, pct, and rereadCount', () => {
    const r = mapRow({ ...BASE, pseukim: 42, pct: 2.5, reread_count: 3 });
    expect(r.pseukim).toBe(42);
    expect(r.pct).toBe(2.5);
    expect(r.rereadCount).toBe(3);
  });

  it('base row is never marked isReread', () => {
    expect(mapRow(BASE).isReread).toBe(false);
  });

  it('maps direct_orig → directOrig (set / empty / absent)', () => {
    expect(mapRow({ ...BASE, direct_orig: '2023-03-15' }).directOrig).toBe('2023-03-15');
    expect(mapRow({ ...BASE, direct_orig: '' }).directOrig).toBe('');
    expect(mapRow(BASE).directOrig).toBe('');
  });
});

describe('mapRow — past reading', () => {
  it('marks aliyah as read and past for a historical date', () => {
    const r = mapRow({ ...BASE, orig: '2023-03-15' });
    expect(r.isRead).toBe(true);
    expect(r.isReadPast).toBe(true);
    expect(r.isReadFuture).toBe(false);
    expect(r.yearRead).toBe(2023);
  });
});

describe('mapRow — future reading', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2025-01-01T12:00:00')); });
  afterEach(() => { vi.useRealTimers(); });

  it('marks aliyah as future when orig is after today', () => {
    const r = mapRow({ ...BASE, orig: '2025-06-01' });
    expect(r.isRead).toBe(true);
    expect(r.isReadPast).toBe(false);
    expect(r.isReadFuture).toBe(true);
    expect(r.isFuture).toBe(true);
    expect(r.yearRead).toBe(2025);
  });

  it('treats today as past (orig <= today)', () => {
    const r = mapRow({ ...BASE, orig: '2025-01-01' });
    expect(r.isReadPast).toBe(true);
    expect(r.isReadFuture).toBe(false);
  });
});

describe('mapRow — future re-reads (fut field)', () => {
  it('parses comma-separated future re-read dates', () => {
    const r = mapRow({ ...BASE, orig: '2023-01-01', fut: '2025-03-01,2026-04-15' });
    expect(r.hasFuture).toBe(true);
    expect(r.futDates).toEqual(['2025-03-01', '2026-04-15']);
    expect(r.futureYear).toBe(2025);
  });

  it('hasFuture is false when fut is empty string', () => {
    const r = mapRow({ ...BASE, orig: '2023-01-01', fut: '' });
    expect(r.hasFuture).toBe(false);
    expect(r.futureYear).toBeNull();
  });
});

describe('mapRow — allYears', () => {
  it('deduplicates when yearRead equals futureYear', () => {
    // Use mid-year dates to avoid timezone year-boundary issues on Jan 1
    const r = mapRow({ ...BASE, orig: '2025-06-01', fut: '2025-09-15' });
    expect(r.allYears).toEqual([2025]);
  });

  it('includes both years when different', () => {
    const r = mapRow({ ...BASE, orig: '2023-06-01', fut: '2025-09-15' });
    expect(r.allYears).toContain(2023);
    expect(r.allYears).toContain(2025);
    expect(r.allYears).toHaveLength(2);
  });

  it('allYears is empty when unread and no future dates', () => {
    const r = mapRow(BASE);
    expect(r.allYears).toEqual([]);
  });
});

describe('mapRow — occasion and location', () => {
  it('passes occasion and location through', () => {
    const r = mapRow({ ...BASE, orig: '2023-01-01', occasion: 'Bar Mitzvah', location: 'Shul' });
    expect(r.occasion).toBe('Bar Mitzvah');
    expect(r.location).toBe('Shul');
  });

  it('defaults occasion and location to empty string when absent', () => {
    const r = mapRow(BASE);
    expect(r.occasion).toBe('');
    expect(r.location).toBe('');
  });
});

// ── mapRow — double-parsha fields ─────────────────────────────────────────────

describe('mapRow — double-parsha fields', () => {
  it('maps pair_name and pair_name_en through', () => {
    const r = mapRow({ ...BASE, pair_name: 'וַיַּקְהֵל-פְקוּדֵי', pair_name_en: 'Vayakhel-Pekudei' });
    expect(r.pairName).toBe('וַיַּקְהֵל-פְקוּדֵי');
    expect(r.pairNameEn).toBe('Vayakhel-Pekudei');
  });

  it('maps combined_aliyah through', () => {
    const r = mapRow({ ...BASE, combined_aliyah: 3 });
    expect(r.combinedAliyah).toBe(3);
  });

  it('defaults pairName and pairNameEn to empty string when absent', () => {
    const r = mapRow(BASE);
    expect(r.pairName).toBe('');
    expect(r.pairNameEn).toBe('');
  });

  it('defaults combinedAliyah to null when absent', () => {
    const r = mapRow(BASE);
    expect(r.combinedAliyah).toBeNull();
  });
});

// ── mapRow — partialOrig ──────────────────────────────────────────────────────

describe('mapRow — partialOrig', () => {
  it('always returns empty string — partialOrig is computed by enrichPartialOrig, not mapRow', () => {
    expect(mapRow(BASE).partialOrig).toBe('');
    expect(mapRow({ ...BASE, orig: '2024-01-01' }).partialOrig).toBe('');
  });
});

// ── enrichRows ────────────────────────────────────────────────────────────────

describe('enrichRows', () => {
  it('sets parshaPct proportional to pseukim within the parsha', () => {
    const rows = enrichRows([
      mapRow({ ...BASE, parsha: 'א', aliyah: 1, pseukim: 30, orig: '', fut: '' }),
      mapRow({ ...BASE, parsha: 'א', aliyah: 2, pseukim: 70, orig: '', fut: '' }),
    ]);
    expect(rows[0]!.parshaPct).toBeCloseTo(30);
    expect(rows[1]!.parshaPct).toBeCloseTo(70);
  });

  it('returns 100% for a single-aliyah parsha', () => {
    const rows = enrichRows([
      mapRow({ ...BASE, parsha: 'solo', pseukim: 50, orig: '', fut: '' }),
    ]);
    expect(rows[0]!.parshaPct).toBeCloseTo(100);
  });

  it('keeps rows from different parshiot independent', () => {
    const rows = enrichRows([
      mapRow({ ...BASE, parsha: 'א', aliyah: 1, pseukim: 60, orig: '', fut: '' }),
      mapRow({ ...BASE, parsha: 'ב', aliyah: 1, pseukim: 40, orig: '', fut: '' }),
    ]);
    expect(rows[0]!.parshaPct).toBeCloseTo(100);
    expect(rows[1]!.parshaPct).toBeCloseTo(100);
  });
});
