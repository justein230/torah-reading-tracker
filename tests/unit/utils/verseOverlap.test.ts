import { describe, it, expect } from 'vitest';
import { versesOverlap } from '../../../src/utils.js';

// Helper: call versesOverlap with flat [chStart, vStart, chEnd, vEnd] pairs.
const ov = (a: [number,number,number,number], b: [number,number,number,number]) =>
  versesOverlap(
    { chapterStart: a[0], verseStart: a[1], chapterEnd: a[2], verseEnd: a[3] },
    { chapterStart: b[0], verseStart: b[1], chapterEnd: b[2], verseEnd: b[3] },
  );

describe('versesOverlap — no overlap', () => {
  it('completely separate ranges', () => {
    expect(ov([1,1,1,5], [1,8,1,12])).toBe(false);
  });

  it('touching at exactly one endpoint does NOT overlap (strict)', () => {
    // a ends at 1:5, b starts at 1:5 — encoded: aEnd(1005) > bStart(1005) is false
    expect(ov([1,1,1,5], [1,5,1,10])).toBe(false);
  });

  it('b ends where a starts — also no overlap', () => {
    expect(ov([1,5,1,10], [1,1,1,5])).toBe(false);
  });

  it('separate ranges across chapters', () => {
    expect(ov([1,1,1,30], [2,1,2,10])).toBe(false);
  });
});

describe('versesOverlap — overlapping', () => {
  it('partial overlap: a starts before b ends and a ends after b starts', () => {
    expect(ov([1,1,1,6], [1,5,1,10])).toBe(true);
  });

  it('partial overlap reversed', () => {
    expect(ov([1,5,1,10], [1,1,1,6])).toBe(true);
  });

  it('exact match', () => {
    expect(ov([1,1,1,5], [1,1,1,5])).toBe(true);
  });

  it('a fully contains b', () => {
    expect(ov([1,1,1,13], [1,3,1,7])).toBe(true);
  });

  it('b fully contains a', () => {
    expect(ov([1,3,1,7], [1,1,1,13])).toBe(true);
  });

  it('overlap crossing a chapter boundary', () => {
    // a: 1:28–2:3, b: 2:1–2:10
    expect(ov([1,28,2,3], [2,1,2,10])).toBe(true);
  });

  it('a ends one verse past b start', () => {
    // aEnd(1006) > bStart(1005) → overlap by one verse
    expect(ov([1,1,1,6], [1,5,1,9])).toBe(true);
  });
});

describe('versesOverlap — boundary precision', () => {
  it('chapter encoding: ch2:v1 (2001) > ch1:v999 (1999)', () => {
    // ensures chapter*1000 dominates verse ordering
    expect(ov([1,999,2,1], [2,1,2,5])).toBe(false); // touch at 2:1 — no overlap
  });

  it('cross-chapter partial overlap', () => {
    expect(ov([1,999,2,2], [2,1,2,5])).toBe(true);
  });
});
