import { describe, it, expect } from 'vitest';
import { calEntryTitle } from '../../../src/utils/format.js';

describe('calEntryTitle', () => {
  it('uses the holiday name when the entry has one', () => {
    expect(calEntryTitle({ parsha: 'וירא', occasion: 'ראש השנה א׳' })).toBe('ראש השנה א׳');
  });

  it('falls back to the parsha when there is no occasion', () => {
    expect(calEntryTitle({ parsha: 'וירא' })).toBe('וירא');
  });

  it('treats an empty occasion string as no occasion', () => {
    expect(calEntryTitle({ parsha: 'וירא', occasion: '' })).toBe('וירא');
  });
});
