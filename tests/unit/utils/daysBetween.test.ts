import { describe, it, expect } from 'vitest';
import { daysBetween } from '../../../src/utils.js';

describe('daysBetween', () => {
  it('is zero for the same date', () => {
    expect(daysBetween('2026-09-13', '2026-09-13')).toBe(0);
  });

  it('counts whole days between two dates in the same month', () => {
    expect(daysBetween('2026-09-01', '2026-09-13')).toBe(12);
  });

  it('counts a full non-leap year as 365 days', () => {
    expect(daysBetween('2025-09-13', '2026-09-13')).toBe(365);
  });

  it('counts a span crossing a leap day correctly', () => {
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });

  it('returns a negative number when toStr is before fromStr', () => {
    expect(daysBetween('2026-09-13', '2026-09-01')).toBe(-12);
  });
});
