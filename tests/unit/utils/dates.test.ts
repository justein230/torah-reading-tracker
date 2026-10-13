import { afterEach, describe, it, expect, vi } from 'vitest';
import { localDateStr } from '../../../src/utils/dates.js';
import { toDateStr } from '../../../src/utils/format.js';

afterEach(() => { vi.useRealTimers(); });

describe('localDateStr', () => {
  it('formats the local calendar day, zero-padded', () => {
    expect(localDateStr(new Date(2026, 0, 5, 13, 0))).toBe('2026-01-05');
  });

  it('keeps the local day late in the evening and just after midnight (where UTC would differ)', () => {
    expect(localDateStr(new Date(2026, 5, 15, 23, 59))).toBe('2026-06-15');
    expect(localDateStr(new Date(2026, 5, 16, 0, 1))).toBe('2026-06-16');
  });

  it('defaults to now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 13, 22, 30));
    expect(localDateStr()).toBe('2026-09-13');
  });
});

describe('toDateStr', () => {
  it('uses the local day of a Date, as the entry form creates them at local midnight', () => {
    expect(toDateStr(new Date(2026, 2, 3, 0, 0, 0))).toBe('2026-03-03');
  });

  it('passes strings through (first 10 chars) and maps null to empty', () => {
    expect(toDateStr('2026-03-03T10:00:00')).toBe('2026-03-03');
    expect(toDateStr(null)).toBe('');
  });
});
