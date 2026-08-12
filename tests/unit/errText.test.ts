import { describe, it, expect } from 'vitest';
import { errText } from '../../src/utils/errText.js';

describe('errText', () => {
  it('returns the message of a real Error', () => {
    expect(errText(new Error('boom'))).toBe('boom');
  });

  it('returns the message of an Error subclass', () => {
    class SqliteError extends Error { code = 'SQLITE_ERROR'; }
    expect(errText(new SqliteError('no such table: parshiot'))).toBe('no such table: parshiot');
  });

  // A cross-realm error (vitest's vmForks pool, native modules) fails `instanceof Error`
  // even though it is one. Duck-typing the message keeps the log readable.
  it('reads .message off an error-shaped object that fails instanceof', () => {
    const crossRealm = Object.create(null) as { message: string; code: string };
    crossRealm.message = 'no such table: parshiot';
    crossRealm.code    = 'SQLITE_ERROR';
    expect(crossRealm).not.toBeInstanceOf(Error);
    expect(errText(crossRealm)).toBe('no such table: parshiot');
  });

  it.each([
    ['a string',           'plain failure',        'plain failure'],
    ['a number',           42,                     '42'],
    ['null',               null,                   'null'],
    ['undefined',          undefined,              'undefined'],
    ['an object message-less', { code: 'NOPE' },   '[object Object]'],
  ])('stringifies %s', (_label, input, expected) => {
    expect(errText(input)).toBe(expected);
  });

  it('ignores a non-string message property', () => {
    expect(errText({ message: { nested: true } })).toBe('[object Object]');
  });
});
