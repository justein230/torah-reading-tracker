import { describe, it, expect } from 'vitest';
import { enrichPartialOrig, enrichOccasionPartialOrig, enrichWeekdayPartialOrig, enrichHosafotPartialOrig, isAliyahFuturePartial } from '../../src/compute.js';
import { aliyahState, aliyahCellStyle } from '../../src/utils/format.js';
import { makeRow, makeOA, makeWA, makeHosafah } from '../helpers/fixtures.js';

// Scheduled-but-not-yet-read readings that overlap part of an aliyah stamp futurePartialOrig,
// independent of (and never mixed into) the past-reading partialOrig.

const FUTURE = { isRead: true, isReadPast: false, isReadFuture: true };
const futureOA = (o = {}) => makeOA({ ...FUTURE, orig: '2099-01-01', allDates: ['2099-01-01'], ...o });
const futureWA = (o = {}) => makeWA({ isReadPast: false, isReadFuture: true, dateRead: '2099-02-02', allDates: ['2099-02-02'], ...o });
const futureHR = (o = {}) => makeHosafah({ isReadPast: false, isReadFuture: true, dateRead: '2099-03-03', ...o });

describe('futurePartialOrig — Shabbat aliyah', () => {
  it('is set from a future partially-overlapping occasion aliyah, and partialOrig stays empty', () => {
    const [out] = enrichPartialOrig([makeRow()], [futureOA()], []);
    expect(out!.futurePartialOrig).toBe('2099-01-01');
    expect(out!.partialOrig).toBe('');
  });

  it('is set from a future weekday aliyah and a future hosafah', () => {
    expect(enrichPartialOrig([makeRow()], [], [futureWA()])[0]!.futurePartialOrig).toBe('2099-02-02');
    expect(enrichPartialOrig([makeRow()], [], [], [futureHR()])[0]!.futurePartialOrig).toBe('2099-03-03');
  });

  it('takes the earliest of several future overlaps', () => {
    const [out] = enrichPartialOrig([makeRow()], [futureOA({ orig: '2099-05-05' }), futureOA({ id: 2, orig: '2099-04-04' })], []);
    expect(out!.futurePartialOrig).toBe('2099-04-04');
  });

  it('ignores a future reading that does not overlap, is in another parsha, or is fully contained', () => {
    const row = makeRow({ chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 7 });
    expect(enrichPartialOrig([makeRow()], [futureOA({ chapterStart: 5, verseStart: 1, chapterEnd: 5, verseEnd: 2 })], [])[0]!.futurePartialOrig).toBe('');
    expect(enrichPartialOrig([makeRow({ parsha: 'Noach' })], [futureOA()], [])[0]!.futurePartialOrig).toBe('');
    expect(enrichPartialOrig([row], [futureOA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 13 })], [])[0]!.futurePartialOrig).toBe('');
  });

  it('does not use a reading that is already past (that feeds partialOrig instead)', () => {
    const [out] = enrichPartialOrig([makeRow()], [makeOA()], []);
    expect(out!.futurePartialOrig).toBe('');
    expect(out!.partialOrig).toBe('2024-04-22');
  });

  it('keeps past and future partials independent when both exist', () => {
    const [out] = enrichPartialOrig([makeRow()], [makeOA(), futureOA({ id: 2 })], []);
    expect(out!.partialOrig).toBe('2024-04-22');
    expect(out!.futurePartialOrig).toBe('2099-01-01');
  });
});

describe('futurePartialOrig — occasion, weekday and hosafah aliyot', () => {
  it('occasion aliyah gets it from a future Shabbat row, weekday and hosafah', () => {
    const oa = makeOA({ isRead: false, isReadPast: false, orig: '' });
    const futureRow = makeRow({ isRead: true, isReadFuture: true, orig: '2099-06-06', chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 13 });
    expect(enrichOccasionPartialOrig([oa], [futureRow], [])[0]!.futurePartialOrig).toBe('2099-06-06');
    expect(enrichOccasionPartialOrig([oa], [], [futureWA()])[0]!.futurePartialOrig).toBe('2099-02-02');
    expect(enrichOccasionPartialOrig([oa], [], [], [futureHR()])[0]!.futurePartialOrig).toBe('2099-03-03');
  });

  it('weekday aliyah gets it from a future Shabbat row, occasion aliyah and hosafah', () => {
    const wa = makeWA({ isReadPast: false, dateRead: '' });
    const futureRow = makeRow({ isRead: true, isReadFuture: true, orig: '2099-06-06', chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 13 });
    expect(enrichWeekdayPartialOrig([wa], [futureRow], [])[0]!.futurePartialOrig).toBe('2099-06-06');
    expect(enrichWeekdayPartialOrig([wa], [], [futureOA({ chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 9 })])[0]!.futurePartialOrig).toBe('2099-01-01');
    expect(enrichWeekdayPartialOrig([wa], [], [], [futureHR()])[0]!.futurePartialOrig).toBe('2099-03-03');
  });

  it('hosafah gets it from a future Shabbat row, occasion aliyah and weekday aliyah', () => {
    const hr = makeHosafah({ isReadPast: false, dateRead: '' });
    const futureRow = makeRow({ isRead: true, isReadFuture: true, orig: '2099-06-06', chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 13 });
    expect(enrichHosafotPartialOrig([hr], [futureRow], [], [])[0]!.futurePartialOrig).toBe('2099-06-06');
    const partialRange = { chapterStart: 1, verseStart: 3, chapterEnd: 1, verseEnd: 9 };
    expect(enrichHosafotPartialOrig([hr], [], [futureOA(partialRange)], [])[0]!.futurePartialOrig).toBe('2099-01-01');
    expect(enrichHosafotPartialOrig([hr], [], [], [futureWA(partialRange)])[0]!.futurePartialOrig).toBe('2099-02-02');
  });
});

describe('aliyahState / aliyahCellStyle — partialFuture', () => {
  const base = { isReadPast: false, isReadFuture: false, partialOrig: '', futurePartialOrig: '2099-01-01' };

  it('is partialFuture only when nothing stronger applies', () => {
    expect(aliyahState(base)).toBe('partialFuture');
    expect(aliyahState({ ...base, partialOrig: '2024-01-01' })).toBe('partial');
    expect(aliyahState({ ...base, isReadFuture: true })).toBe('future');
    expect(aliyahState({ ...base, isReadPast: true })).toBe('read');
  });

  it('uses the scheduled stripe gradient with the partial border, solid', () => {
    expect(aliyahCellStyle('partialFuture', '#123456')).toEqual({
      bg:     aliyahCellStyle('future', '#123456').bg,
      border: aliyahCellStyle('partial', '#123456').border,
      dashed: false,
    });
  });
});

describe('isAliyahFuturePartial', () => {
  it('is true for an unread aliyah with a future partial, false once read or with none', () => {
    expect(isAliyahFuturePartial([makeRow({ futurePartialOrig: '2099-01-01' })])).toBe(true);
    expect(isAliyahFuturePartial([makeRow()])).toBe(false);
    expect(isAliyahFuturePartial([makeRow({ futurePartialOrig: '2099-01-01', readAsDouble: true, isReadPast: true })])).toBe(false);
  });
});
