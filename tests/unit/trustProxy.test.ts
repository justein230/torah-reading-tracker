import { describe, expect, it } from 'vitest';
import { parseTrustProxy } from '../../src/utils/trustProxy';

describe('parseTrustProxy', () => {
  it.each([
    [undefined, false],
    ['',        false],
    ['  ',      false],
    ['false',   false],
    ['0',       0],
    ['2',       2],
    [' 1 ',     1],
    ['loopback, linklocal, uniquelocal', 'loopback, linklocal, uniquelocal'],
    ['172.16.0.0/12',                    '172.16.0.0/12'],
  ])('%j → %j', (raw, expected) => {
    expect(parseTrustProxy(raw)).toBe(expected);
  });

  it('refuses "true", which would trust any client-sent X-Forwarded-For', () => {
    expect(() => parseTrustProxy('true')).toThrow(/TORAH_TRUST_PROXY/);
  });
});
