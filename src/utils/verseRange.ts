export type VerseRange = { chapterStart: number; verseStart: number; chapterEnd: number; verseEnd: number };

/**
 * True when two verse ranges strictly overlap (touching endpoints don't count).
 * Uses chapter*1000+verse linear encoding, matching the partial-read query logic.
 */
export function versesOverlap(a: VerseRange, b: VerseRange): boolean {
  const aStart = a.chapterStart * 1000 + a.verseStart;
  const aEnd   = a.chapterEnd   * 1000 + a.verseEnd;
  const bStart = b.chapterStart * 1000 + b.verseStart;
  const bEnd   = b.chapterEnd   * 1000 + b.verseEnd;
  return aStart < bEnd && aEnd > bStart;
}

export function partiallyOverlaps(a: VerseRange, b: VerseRange): boolean {
  const aStart = a.chapterStart * 1000 + a.verseStart;
  const aEnd   = a.chapterEnd   * 1000 + a.verseEnd;
  const bStart = b.chapterStart * 1000 + b.verseStart;
  const bEnd   = b.chapterEnd   * 1000 + b.verseEnd;
  return versesOverlap(a, b) && !(aStart <= bStart && aEnd >= bEnd);
}

/** True when a's verse range wholly contains b's — meaning b is fully covered by a. */
export function fullyContains(a: VerseRange, b: VerseRange): boolean {
  return (a.chapterStart * 1000 + a.verseStart) <= (b.chapterStart * 1000 + b.verseStart)
      && (a.chapterEnd   * 1000 + a.verseEnd)   >= (b.chapterEnd   * 1000 + b.verseEnd);
}
