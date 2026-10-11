import { reconcilePicks, seedExistingFuturePicks, pickId, standardPick } from '../../src/utils/whatIfPicks.js';
import { makeRow, makeOA } from '../helpers/fixtures.js';

const TLIT = {};
const futureRow = (aliyah: number, orig = '2099-01-01') =>
  makeRow({ parsha: 'P', aliyah, isRead: true, isReadFuture: true, orig });
const unreadRow = (aliyah: number) => makeRow({ parsha: 'P', aliyah });

const seed = (rows: ReturnType<typeof makeRow>[], oa: ReturnType<typeof makeOA>[] = []) =>
  seedExistingFuturePicks(rows, oa, [], [], TLIT);
const idsOf = (picks: ReturnType<typeof seed>) => new Set(picks.map(pickId));

describe('reconcilePicks', () => {
  it('is a no-op when nothing changed', () => {
    const rows = [futureRow(1), unreadRow(2)];
    const s = seed(rows);
    expect(reconcilePicks(s, idsOf(s), s, rows)).toEqual(s);
  });

  it('adds a reading newly scheduled for real since the last seed', () => {
    const before = [futureRow(1), unreadRow(2)];
    const prev = seed(before);
    const after = [futureRow(1), futureRow(2, '2099-02-01')];
    const result = reconcilePicks(prev, idsOf(prev), seed(after), after);
    expect(result.map(p => p.aliyah).sort()).toEqual(['1', '2']);
    expect(result.find(p => p.aliyah === '2')?.date).toBe('2099-02-01');
  });

  it('keeps a real reading the user removed in the preview removed', () => {
    const rows = [futureRow(1), futureRow(2)];
    const s = seed(rows);
    const afterRemoval = s.filter(p => p.aliyah !== '2');
    const result = reconcilePicks(afterRemoval, idsOf(s), s, rows);
    expect(result.map(p => p.aliyah)).toEqual(['1']);
  });

  it('refreshes an existing pick whose real date changed', () => {
    const prev = seed([futureRow(1, '2099-01-01')]);
    const after = [futureRow(1, '2099-05-05')];
    const result = reconcilePicks(prev, idsOf(prev), seed(after), after);
    expect(result).toHaveLength(1);
    expect(result[0]!.date).toBe('2099-05-05');
  });

  it('drops an existing pick that was deleted or is no longer in the future', () => {
    const prev = seed([futureRow(1), futureRow(2)]);
    const after = [futureRow(1), unreadRow(2)];
    const result = reconcilePicks(prev, idsOf(prev), seed(after), after);
    expect(result.map(p => p.aliyah)).toEqual(['1']);
  });

  it('preserves hypothetical picks for still-unread aliyot', () => {
    const rows = [unreadRow(1)];
    const hypo = standardPick(rows[0]!, '2099-03-03', false, TLIT);
    expect(reconcilePicks([hypo], new Set(), [], rows)).toEqual([hypo]);
  });

  it('drops a hypothetical pick once its aliyah has been read for real', () => {
    const readNow = makeRow({ parsha: 'P', aliyah: 1, isRead: true, isReadPast: true, orig: '2024-01-01' });
    const hypo = standardPick(unreadRow(1), '2099-03-03', false, TLIT);
    expect(reconcilePicks([hypo], new Set(), [], [readNow])).toEqual([]);
  });

  it('lets a newly scheduled real reading replace a colliding hypothetical pick', () => {
    const hypo = standardPick(unreadRow(1), '2099-03-03', false, TLIT);
    const after = [futureRow(1, '2099-07-07')];
    const result = reconcilePicks([hypo], new Set(), seed(after), after);
    expect(result).toHaveLength(1);
    expect(result[0]!).toMatchObject({ existing: true, date: '2099-07-07' });
  });

  it('keeps the user\'s hypothetical re-date of a real reading they had removed', () => {
    const rows = [futureRow(1, '2099-01-01')];
    const s = seed(rows);
    const redated = standardPick(rows[0]!, '2099-09-09', false, TLIT);
    const result = reconcilePicks([redated], idsOf(s), s, rows);
    expect(result).toEqual([redated]);
  });

  it('handles special readings by id', () => {
    const oa = makeOA({ id: 7, isRead: true, isReadFuture: true, orig: '2099-04-04' });
    const s = seed([], [oa]);
    expect(reconcilePicks([], new Set(), s, [])).toEqual(s);
    expect(reconcilePicks(s, idsOf(s), seed([], []), [])).toEqual([]);
  });
});
