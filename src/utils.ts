/**
 * True when two verse ranges strictly overlap (touching endpoints don't count).
 * Uses chapter*1000+verse linear encoding, matching the partial-read query logic.
 */
export function versesOverlap(
  a: { chapterStart: number; verseStart: number; chapterEnd: number; verseEnd: number },
  b: { chapterStart: number; verseStart: number; chapterEnd: number; verseEnd: number },
): boolean {
  const aStart = a.chapterStart * 1000 + a.verseStart;
  const aEnd   = a.chapterEnd   * 1000 + a.verseEnd;
  const bStart = b.chapterStart * 1000 + b.verseStart;
  const bEnd   = b.chapterEnd   * 1000 + b.verseEnd;
  return aStart < bEnd && aEnd > bStart;
}

export function fmtDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-').map(Number);
  const [y, m, d] = [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function hex(c: string, a: number): string {
  return c + Math.round(a * 255).toString(16).padStart(2, '0');
}

/**
 * Returns a CSS diagonal-stripe gradient using the given hex color.
 * Used to visually distinguish future re-reading cells from completed ones.
 */
export function futureBg(color: string): string {
  return `repeating-linear-gradient(-45deg,${color}66,${color}66 5px,var(--surface) 5px,var(--surface) 11px)`;
}

export function partialBg(color: string): string     { return color + '44'; }
export function partialBorder(color: string): string  { return color + 'aa'; }

export type AliyahCellState = 'read' | 'future' | 'partial' | 'unread';

/** Maps a cell's read-state to its background/border/dash styling. */
export function aliyahCellStyle(state: AliyahCellState, color: string): { bg: string; border: string; dashed: boolean } {
  switch (state) {
    case 'read':    return { bg: color,                     border: color,                        dashed: false };
    case 'future':  return { bg: futureBg(color),           border: color,                        dashed: true  };
    case 'partial': return { bg: partialBg(color),          border: partialBorder(color),         dashed: false };
    default:        return { bg: 'var(--cell-unread)',       border: 'var(--cell-unread-border)',  dashed: false };
  }
}

/** Percent string (no '%'), 0-safe. fmtPct(1,4) → '25.00'; fmtPct(0,0) → '0.00'. */
export function fmtPct(numer: number, denom: number, digits = 2): string {
  return (denom ? (numer / denom * 100) : 0).toFixed(digits);
}

export function toDateStr(date: Date | string | null): string {
  if (!date) return '';
  return date instanceof Date ? date.toISOString().slice(0, 10) : String(date).slice(0, 10);
}

export function fmtAliyah(a: string | number, short = false): string {
  if (Number(a) === 8 || a === 'M') return short ? 'M' : 'Maftir';
  if (a === 'hosafah') return 'Hosafah';
  return short ? String(a) : `Aliyah ${a}`;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}
