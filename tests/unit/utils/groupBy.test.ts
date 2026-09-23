import { describe, it, expect } from 'vitest';
import { groupBy } from '../../../src/utils/format.js';

describe('groupBy', () => {
  it('groups items by their derived key', () => {
    const items = [{ k: 'a', v: 1 }, { k: 'b', v: 2 }, { k: 'a', v: 3 }];
    const grouped = groupBy(items, x => x.k);
    expect(grouped.get('a')).toEqual([{ k: 'a', v: 1 }, { k: 'a', v: 3 }]);
    expect(grouped.get('b')).toEqual([{ k: 'b', v: 2 }]);
  });

  it('preserves each item\'s relative order within its group', () => {
    const grouped = groupBy([3, 1, 4, 1, 5, 9, 2, 6], n => n % 2 === 0 ? 'even' : 'odd');
    expect(grouped.get('odd')).toEqual([3, 1, 1, 5, 9]);
    expect(grouped.get('even')).toEqual([4, 2, 6]);
  });

  it('preserves key insertion order (first-seen order)', () => {
    const grouped = groupBy(['b', 'a', 'b', 'c', 'a'], x => x);
    expect([...grouped.keys()]).toEqual(['b', 'a', 'c']);
  });

  it('returns an empty map for an empty array', () => {
    expect(groupBy([], (x: never) => x).size).toBe(0);
  });
});
