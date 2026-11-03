import { describe, expect, it } from 'vitest';
import { androidVersion } from '../../src/utils/androidVersion';

describe('androidVersion', () => {
  it.each([
    ['1.1.3',    10103,  '1.1.3'],
    ['0.0.1',    1,      '0.0.1'],
    ['1.10.0',   11000,  '1.10.0'],
    ['2.0.0',    20000,  '2.0.0'],
    ['12.99.99', 129999, '12.99.99'],
    [' 1.2.3 ',  10203,  '1.2.3'],
  ])('%j → versionCode %d, versionName %j', (version, versionCode, versionName) => {
    expect(androidVersion(version)).toEqual({ versionCode, versionName });
  });

  it('keeps codes increasing across patch, minor and major bumps', () => {
    const codes = ['1.1.3', '1.1.4', '1.2.0', '1.99.99', '2.0.0'].map(v => androidVersion(v).versionCode);
    expect(codes).toEqual([...codes].sort((a, b) => a - b));
    expect(new Set(codes).size).toBe(codes.length);
  });

  it.each(['1.1.3-dev.0', '1.1.3-qa.2', '1.1', 'v1.1.3', ''])('refuses %j', version => {
    expect(() => androidVersion(version)).toThrow(/plain release version/);
  });

  it.each(['1.100.0', '1.0.100'])('refuses %j, which would overflow into the next part', version => {
    expect(() => androidVersion(version)).toThrow(/below 100/);
  });
});
