import { describe, it, expect } from 'vitest';
import { getCurrentYear } from '../../../src/utils.js';

describe('getCurrentYear', () => {
  it('returns the current calendar year as a number', () => {
    expect(getCurrentYear()).toBe(new Date().getFullYear());
  });
});
