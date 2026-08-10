import { describe, it, expect } from 'vitest';
import { buildGroupedOptions } from '../../../src/utils/form-options.js';

describe('buildGroupedOptions', () => {
  it('produces group headers followed by items', () => {
    const result = buildGroupedOptions(
      ['a', 'b'],
      g => g.toUpperCase(),
      g => [{ id: g + '1' }, { id: g + '2' }],
      item => ({ value: item.id, label: item.id }),
    );
    expect(result).toEqual([
      { value: '__group__a', label: '── A ──', disabled: true },
      { value: 'a1', label: 'a1' },
      { value: 'a2', label: 'a2' },
      { value: '__group__b', label: '── B ──', disabled: true },
      { value: 'b1', label: 'b1' },
      { value: 'b2', label: 'b2' },
    ]);
  });

  it('skips groups with no items', () => {
    const result = buildGroupedOptions(
      ['a', 'empty', 'b'],
      g => g,
      g => g === 'empty' ? [] : [{ id: g }],
      item => ({ value: item.id, label: item.id }),
    );
    expect(result.map(r => r.value)).toEqual(['__group__a', 'a', '__group__b', 'b']);
  });

  it('returns empty array when all groups are empty', () => {
    const result = buildGroupedOptions(['x', 'y'], g => g, () => [], item => ({ value: item, label: item }));
    expect(result).toEqual([]);
  });

  it('preserves item order within a group', () => {
    const items = [{ v: 'z' }, { v: 'a' }, { v: 'm' }];
    const result = buildGroupedOptions(
      ['g'],
      g => g,
      () => items,
      item => ({ value: item.v, label: item.v }),
    );
    expect(result.filter(r => !r.disabled).map(r => r.value)).toEqual(['z', 'a', 'm']);
  });
});
