import { describe, it, expect } from 'vitest';
import { enrichPartialOrig, computeStats } from '../../src/compute.js';
import type { Filters } from '../../src/types/index.js';
import { makeRow, makeOA, makeWA } from '../helpers/fixtures.js';

// ── fixtures ──────────────────────────────────────────────────────────────────

const SEFER_ORDER = ['Genesis'];
const SEFER_MAP   = { Genesis: { en: 'Genesis', color: '#000', chapterVerses: [] } };
const NO_FILTERS: Filters = { sefarim: [], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false };

// ── enrichPartialOrig — occasion aliyot ───────────────────────────────────────

describe('enrichPartialOrig — occasion aliyah overlaps Shabbat aliyah', () => {
  it('sets partialOrig when occasion aliyah partially overlaps', () => {
    const row = makeRow(); // Bereishit 1:1–1:13, unread
    const oa  = makeOA(); // Pesach 1:1–1:5, read — partial overlap
    const [out] = enrichPartialOrig([row], [oa], []);
    expect(out!.partialOrig).toBe('2024-04-22');
  });

  it('does NOT set partialOrig when occasion aliyah fully contains Shabbat aliyah', () => {
    const row = makeRow({ chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 7 });
    const oa  = makeOA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 13 }); // fully contains row
    const [out] = enrichPartialOrig([row], [oa], []);
    // fully-containing case is handled by orig (SQL), not partialOrig
    expect(out!.partialOrig).toBe('');
  });

  it('does NOT set partialOrig when occasion aliyah has coversAliyahId (direct link)', () => {
    const row = makeRow();
    const oa  = makeOA({ coversAliyahId: 1 }); // direct cover — not partial
    const [out] = enrichPartialOrig([row], [oa], []);
    expect(out!.partialOrig).toBe('');
  });

  it('does NOT set partialOrig when occasion aliyah is unread', () => {
    const row = makeRow();
    const oa  = makeOA({ isRead: false, isReadPast: false, orig: '' });
    const [out] = enrichPartialOrig([row], [oa], []);
    expect(out!.partialOrig).toBe('');
  });

  it('does NOT set partialOrig for a different parsha', () => {
    const row = makeRow({ parsha: 'Noach' });
    const oa  = makeOA({ parsha: 'Bereishit' });
    const [out] = enrichPartialOrig([row], [oa], []);
    expect(out!.partialOrig).toBe('');
  });

  it('does NOT set partialOrig when ranges only touch (strict overlap required)', () => {
    // row: 1:1–1:5, oa: 1:5–1:10 — touching at 1:5, no strict overlap
    const row = makeRow({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const oa  = makeOA({ chapterStart: 1, verseStart: 5, chapterEnd: 1, verseEnd: 10 });
    const [out] = enrichPartialOrig([row], [oa], []);
    expect(out!.partialOrig).toBe('');
  });

  it('picks the earliest date when multiple occasion aliyot overlap', () => {
    const row  = makeRow();
    const oa1  = makeOA({ id: 1, orig: '2024-04-22', chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const oa2  = makeOA({ id: 2, orig: '2023-10-01', chapterStart: 1, verseStart: 5, chapterEnd: 1, verseEnd: 9 });
    const [out] = enrichPartialOrig([row], [oa1, oa2], []);
    expect(out!.partialOrig).toBe('2023-10-01');
  });
});

// ── enrichPartialOrig — weekday aliyot ────────────────────────────────────────

describe('enrichPartialOrig — weekday aliyah overlaps Shabbat aliyah', () => {
  it('sets partialOrig when weekday aliyah overlaps', () => {
    const row = makeRow(); // Bereishit 1:1–1:13
    const wa  = makeWA(); // weekday 1:1–1:5, read
    const [out] = enrichPartialOrig([row], [], [wa]);
    expect(out!.partialOrig).toBe('2024-01-15');
  });

  it('does NOT set partialOrig when weekday aliyah is unread', () => {
    const row = makeRow();
    const wa  = makeWA({ dateRead: '' });
    const [out] = enrichPartialOrig([row], [], [wa]);
    expect(out!.partialOrig).toBe('');
  });

  it('does NOT set partialOrig for a different parsha', () => {
    const row = makeRow({ parsha: 'Noach' });
    const wa  = makeWA({ parsha: 'Bereishit' });
    const [out] = enrichPartialOrig([row], [], [wa]);
    expect(out!.partialOrig).toBe('');
  });

  it('does NOT set partialOrig when ranges only touch', () => {
    // row: 1:6–1:13, wa: 1:1–1:6 — touching at 1:6
    const row = makeRow({ chapterStart: 1, verseStart: 6, chapterEnd: 1, verseEnd: 13 });
    const wa  = makeWA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 6 });
    const [out] = enrichPartialOrig([row], [], [wa]);
    expect(out!.partialOrig).toBe('');
  });

  it('sets partialOrig even when weekday aliyah fully contains Shabbat aliyah (unlike occasion behavior)', () => {
    // Shabbat aliyah: 1:3–1:7 (fully contained by weekday 1:1–1:13)
    // Occasions skip full containment; weekday aliyot do not — any overlap sets partialOrig
    const row = makeRow({ chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 7 });
    const wa  = makeWA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 13 });
    const [out] = enrichPartialOrig([row], [], [wa]);
    expect(out!.partialOrig).toBe('2024-01-15');
  });

  it('picks earliest date across mixed occasion and weekday overlaps', () => {
    const row = makeRow();
    const oa  = makeOA({ orig: '2024-04-22', chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const wa  = makeWA({ dateRead: '2023-01-10', chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 8 });
    const [out] = enrichPartialOrig([row], [oa], [wa]);
    expect(out!.partialOrig).toBe('2023-01-10');
  });
});

// ── computeStats — double-counting guard ──────────────────────────────────────

describe('computeStats — holiday overlaps Shabbat aliyah', () => {
  it('no credit when Shabbat aliyah is read (pseukim already counted)', () => {
    const shabbatRow = makeRow({ isReadPast: true, isRead: true, yearRead: 2024, allYears: [2024] });
    const oa = makeOA({ coversAliyahId: null, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 13 });
    const s  = computeStats([shabbatRow], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.readPseukim).toBe(10);          // Shabbat only, no double
    expect(s.specialTotalPseukim).toBe(0);   // overlaps standard → excluded from special total
    expect(s.specialReadPseukim).toBe(0);    // already counted via readPseukim
  });

  it('grants partial credit when Shabbat aliyah is unread', () => {
    const shabbatRow = makeRow(); // unread
    const oa = makeOA({ pseukim: 5, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const s  = computeStats([shabbatRow], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.readPseukim).toBe(0);
    expect(s.specialTotalPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(5);
  });

  it('counts non-overlapping occasion aliyah in specialTotalPseukim', () => {
    const shabbatRow = makeRow({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const oa = makeOA({ pseukim: 7, chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 7 });
    const s  = computeStats([shabbatRow], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.specialTotalPseukim).toBe(7);
    expect(s.specialReadPseukim).toBe(7);
  });
});

describe('computeStats — weekday overlaps Shabbat aliyah', () => {
  it('no credit when Shabbat aliyah is read', () => {
    const shabbatRow = makeRow({ isReadPast: true, isRead: true, yearRead: 2024, allYears: [2024] });
    const wa = makeWA({ pseukim: 5, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const s  = computeStats([shabbatRow], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [wa]);
    expect(s.readPseukim).toBe(10);
    expect(s.specialReadPseukim).toBe(0);
  });

  it('grants partial credit when Shabbat aliyah is unread', () => {
    const shabbatRow = makeRow(); // unread, 10 pseukim
    const wa = makeWA({ pseukim: 5, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const s  = computeStats([shabbatRow], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [wa]);
    expect(s.readPseukim).toBe(0);
    expect(s.specialReadPseukim).toBe(5);
  });

  it('unread weekday aliyah grants no credit', () => {
    const shabbatRow = makeRow();
    const wa = makeWA({ dateRead: '', isReadPast: false });
    const s  = computeStats([shabbatRow], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [wa]);
    expect(s.specialReadPseukim).toBe(0);
  });

  it('non-overlapping weekday aliyah grants no credit (different verse range)', () => {
    // Shabbat: 1:1–1:5; weekday: 2:1–2:5 — no overlap
    const shabbatRow = makeRow({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const wa = makeWA({ pseukim: 4, chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 5 });
    const s  = computeStats([shabbatRow], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [wa]);
    expect(s.specialReadPseukim).toBe(0);
  });
});

describe('computeStats — sefer filter', () => {
  it('filters out occasion aliyah credit when sefer is excluded', () => {
    const shabbatRow = makeRow(); // unread, Genesis
    const oa = makeOA({ pseukim: 5, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const filters = { ...NO_FILTERS, sefarim: ['Exodus'] }; // Genesis excluded
    const s = computeStats([shabbatRow], [oa], SEFER_ORDER, SEFER_MAP, filters);
    expect(s.specialReadPseukim).toBe(0);
  });

  it('filters out weekday aliyah credit when sefer is excluded', () => {
    const shabbatRow = makeRow(); // unread, Genesis
    const wa = makeWA({ pseukim: 5, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const filters = { ...NO_FILTERS, sefarim: ['Exodus'] }; // Genesis excluded
    const s = computeStats([shabbatRow], [], SEFER_ORDER, SEFER_MAP, filters, [wa]);
    expect(s.specialReadPseukim).toBe(0);
  });

  it('credits occasion aliyah when its sefer is included in filter', () => {
    const shabbatRow = makeRow(); // unread, Genesis
    const oa = makeOA({ pseukim: 5, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const filters = { ...NO_FILTERS, sefarim: ['Genesis'] };
    const s = computeStats([shabbatRow], [oa], SEFER_ORDER, SEFER_MAP, filters);
    expect(s.specialReadPseukim).toBe(5);
  });
});

describe('computeStats — holiday and weekday on DIFFERENT unread Shabbat aliyot', () => {
  it('credits both independently when they overlap different aliyot', () => {
    // Two different Shabbat aliyot, both unread
    const row1 = makeRow({ aliyah: 1, chapterStart: 1, verseStart: 1,  chapterEnd: 1, verseEnd: 10, pseukim: 10 });
    const row2 = makeRow({ aliyah: 2, chapterStart: 2, verseStart: 1,  chapterEnd: 2, verseEnd: 10, pseukim: 10 });
    // Holiday covers row1
    const oa = makeOA({ pseukim: 4, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 4 });
    // Weekday covers row2
    const wa = makeWA({ pseukim: 3, chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 3 });
    const s = computeStats([row1, row2], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [wa]);
    expect(s.specialReadPseukim).toBe(7); // 4 from holiday + 3 from weekday, no interference
  });

  it('unique-pasuk credit for one aliyah does not affect another aliyah', () => {
    const row1 = makeRow({ aliyah: 1, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5, pseukim: 5 });
    const row2 = makeRow({ aliyah: 2, chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 5, pseukim: 5 });
    // Holiday fully covers row1
    const oa = makeOA({ pseukim: 5, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    // Weekday covers row2 and should still get full credit.
    const wa = makeWA({ pseukim: 5, chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 5 });
    const s = computeStats([row1, row2], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [wa]);
    expect(s.specialReadPseukim).toBe(10);
  });
});

describe('computeStats — holiday AND weekday both overlap same unread Shabbat aliyah', () => {
  it('combined credit does not count the same Shabbat pasuk twice', () => {
    // Shabbat aliyah: 1:1–1:13, 10 pseukim, unread
    const shabbatRow = makeRow(); // pseukim: 10
    // Holiday: 1:1–1:5, pseukim 5 → credits 5
    const oa = makeOA({ pseukim: 5, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    // Weekday shares 1:5 with the holiday, so only five new pseukim are credited.
    const wa = makeWA({ pseukim: 6, chapterStart: 1, verseStart: 5, chapterEnd: 1, verseEnd: 10 });
    const s  = computeStats([shabbatRow], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [wa]);
    expect(s.specialReadPseukim).toBe(10);
    expect(s.readPseukim).toBe(0);         // Shabbat itself not read
  });

  it('combined credit adds disjoint holiday and weekday pseukim', () => {
    // Shabbat aliyah: 10 pseukim. Holiday: 3, Weekday: 3, with no overlap.
    const shabbatRow = makeRow();
    const oa = makeOA({ pseukim: 3, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 3 });
    const wa = makeWA({ pseukim: 3, chapterStart: 1, verseStart: 8, chapterEnd: 1, verseEnd: 11 });
    const s  = computeStats([shabbatRow], [oa], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [wa]);
    expect(s.specialReadPseukim).toBe(6);
  });

  it('two weekday aliyot overlapping same unread Shabbat aliyah count each pasuk once', () => {
    // Weekday1 and Weekday2 share 1:7, and only the Shabbat range 1:1-1:10 counts.
    const shabbatRow = makeRow();
    const wa1 = makeWA({ id: 1, pseukim: 7, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 7 });
    const wa2 = makeWA({ id: 2, pseukim: 7, chapterStart: 1, verseStart: 7, chapterEnd: 1, verseEnd: 13,
                         readingId: 2 });
    const s   = computeStats([shabbatRow], [], SEFER_ORDER, SEFER_MAP, NO_FILTERS, [wa1, wa2]);
    expect(s.specialReadPseukim).toBe(10);
  });

  it('two holidays overlapping same unread Shabbat aliyah count each pasuk once', () => {
    const shabbatRow = makeRow(); // 10 pseukim
    const oa1 = makeOA({ id: 1, pseukim: 7, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 7,
                          orig: '2024-04-22', allDates: ['2024-04-22'] });
    const oa2 = makeOA({ id: 2, pseukim: 7, chapterStart: 1, verseStart: 7, chapterEnd: 1, verseEnd: 13,
                          orig: '2024-10-05', allDates: ['2024-10-05'] });
    const s   = computeStats([shabbatRow], [oa1, oa2], SEFER_ORDER, SEFER_MAP, NO_FILTERS);
    expect(s.specialReadPseukim).toBe(10);
  });
});
