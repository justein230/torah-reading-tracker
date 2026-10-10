import { gridWidthClass } from '../../src/utils/gridWidthClass.js';

describe('gridWidthClass', () => {
  it('returns no class before the width is measured', () => {
    expect(gridWidthClass(0)).toBe('');
  });

  it('returns no class when there is room for two columns', () => {
    expect(gridWidthClass(950)).toBe('');
    expect(gridWidthClass(1160)).toBe('');
  });

  it('collapses to one column just below 950px', () => {
    expect(gridWidthClass(949)).toBe('grids-sm');
    expect(gridWidthClass(660)).toBe('grids-sm');
  });

  it('also shrinks the cells just below 660px', () => {
    expect(gridWidthClass(659)).toBe('grids-xs');
    expect(gridWidthClass(300)).toBe('grids-xs');
  });
});
