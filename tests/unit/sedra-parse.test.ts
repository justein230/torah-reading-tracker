// @vitest-environment node
import { parshaKeysFromDesc } from '../../src/utils/sedra-parse.ts';

const KNOWN = new Set(['Bereishit', 'Noach', 'Lech-Lecha', 'Vayakhel', 'Pekudei', 'Nitzavim', 'Vayeilech']);

describe('parshaKeysFromDesc — simple parsha', () => {
  it('returns just the parsha name after stripping "Parashat "', () => {
    expect(parshaKeysFromDesc('Parashat Bereishit', KNOWN)).toEqual(['Bereishit']);
  });

  it('handles a parsha that has no "Parashat " prefix gracefully', () => {
    expect(parshaKeysFromDesc('Bereishit', KNOWN)).toEqual(['Bereishit']);
  });
});

describe('parshaKeysFromDesc — combined double parsha', () => {
  it('returns combined name plus both halves when both are known', () => {
    const keys = parshaKeysFromDesc('Parashat Vayakhel-Pekudei', KNOWN);
    expect(keys).toContain('Vayakhel-Pekudei');
    expect(keys).toContain('Vayakhel');
    expect(keys).toContain('Pekudei');
    expect(keys).toHaveLength(3);
  });

  it('does NOT split when only one half is a known parsha name', () => {
    // "Foo" is not in KNOWN
    const keys = parshaKeysFromDesc('Parashat Vayakhel-Foo', KNOWN);
    expect(keys).toEqual(['Vayakhel-Foo']);
  });
});

describe('parshaKeysFromDesc — hyphenated single parsha (Lech-Lecha)', () => {
  it('does NOT split when neither part is individually a known name', () => {
    // "Lech" and "Lecha" are not individually in KNOWN, only "Lech-Lecha" is
    const keys = parshaKeysFromDesc('Parashat Lech-Lecha', KNOWN);
    expect(keys).toEqual(['Lech-Lecha']);
  });
});

describe('parshaKeysFromDesc — combined parsha (Nitzavim-Vayeilech)', () => {
  it('splits Nitzavim-Vayeilech when both are known', () => {
    const keys = parshaKeysFromDesc('Parashat Nitzavim-Vayeilech', KNOWN);
    expect(keys).toContain('Nitzavim-Vayeilech');
    expect(keys).toContain('Nitzavim');
    expect(keys).toContain('Vayeilech');
  });
});
