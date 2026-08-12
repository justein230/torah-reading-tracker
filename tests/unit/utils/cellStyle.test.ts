import { describe, it, expect } from 'vitest';
import { aliyahCellStyle, aliyahState, fmtPct } from '../../../src/utils.js';

const COLOR = '#4a7c59';

// ── aliyahState ───────────────────────────────────────────────────────────────

describe('aliyahState', () => {
  it('isReadPast wins over everything else', () => {
    expect(aliyahState({ isReadPast: true, isReadFuture: true, partialOrig: 'x' })).toBe('read');
  });

  it('isReadFuture wins over partialOrig', () => {
    expect(aliyahState({ isReadPast: false, isReadFuture: true, partialOrig: 'x' })).toBe('future');
  });

  it('partialOrig wins over unread', () => {
    expect(aliyahState({ isReadPast: false, isReadFuture: false, partialOrig: 'x' })).toBe('partial');
  });

  it('falls back to unread when nothing is set', () => {
    expect(aliyahState({ isReadPast: false, isReadFuture: false, partialOrig: '' })).toBe('unread');
  });

  it('accepts a boolean partialOrig (e.g. isAliyahPartial result)', () => {
    expect(aliyahState({ isReadPast: false, isReadFuture: false, partialOrig: true })).toBe('partial');
    expect(aliyahState({ isReadPast: false, isReadFuture: false, partialOrig: false })).toBe('unread');
  });
});

// ── aliyahCellStyle ───────────────────────────────────────────────────────────

describe('aliyahCellStyle', () => {
  it('read → solid color bg and border, not dashed', () => {
    const { bg, border, dashed } = aliyahCellStyle('read', COLOR);
    expect(bg).toBe(COLOR);
    expect(border).toBe(COLOR);
    expect(dashed).toBe(false);
  });

  it('future → futureBg gradient, color border, dashed', () => {
    const { bg, border, dashed } = aliyahCellStyle('future', COLOR);
    expect(bg).toContain(COLOR);
    expect(bg).toContain('repeating-linear-gradient');
    expect(border).toBe(COLOR);
    expect(dashed).toBe(true);
  });

  it('partial → color+"44" bg, color+"aa" border, not dashed', () => {
    const { bg, border, dashed } = aliyahCellStyle('partial', COLOR);
    expect(bg).toBe(COLOR + '44');
    expect(border).toBe(COLOR + 'aa');
    expect(dashed).toBe(false);
  });

  it('unread → CSS var bg and border, not dashed', () => {
    const { bg, border, dashed } = aliyahCellStyle('unread', COLOR);
    expect(bg).toBe('var(--cell-unread)');
    expect(border).toBe('var(--cell-unread-border)');
    expect(dashed).toBe(false);
  });
});

// ── fmtPct ────────────────────────────────────────────────────────────────────

describe('fmtPct', () => {
  it('normal case — default 2 decimal places', () => {
    expect(fmtPct(1, 4)).toBe('25.00');
  });

  it('zero denominator returns "0.00" (no division by zero)', () => {
    expect(fmtPct(0, 0)).toBe('0.00');
  });

  it('custom digits — 1 decimal', () => {
    expect(fmtPct(1, 3, 1)).toBe('33.3');
  });

  it('custom digits — 0 decimals', () => {
    expect(fmtPct(7, 7, 0)).toBe('100');
  });

  it('zero numerator with nonzero denominator', () => {
    expect(fmtPct(0, 10)).toBe('0.00');
  });
});
