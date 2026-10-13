// @vitest-environment node
import {
  hashPassword, verifyPassword, generateSessionToken, hashSessionToken,
  parseSessionCookie, serializeSessionCookie, clearSessionCookie,
  isHeaderAuthenticated, generateBootstrapPassword,
} from '../../src/utils/auth.ts';

describe('hashPassword / verifyPassword', () => {
  it('verifies the correct password against its own hash', () => {
    const stored = hashPassword('correct horse battery staple');
    expect(verifyPassword('correct horse battery staple', stored)).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const stored = hashPassword('correct horse battery staple');
    expect(verifyPassword('wrong password', stored)).toBe(false);
  });

  it('produces a different salt (and hash) each call for the same password', () => {
    const a = hashPassword('same password');
    const b = hashPassword('same password');
    expect(a).not.toBe(b);
    expect(verifyPassword('same password', a)).toBe(true);
    expect(verifyPassword('same password', b)).toBe(true);
  });

  it('rejects a malformed stored value', () => {
    expect(verifyPassword('anything', 'not-a-salt-hash-pair')).toBe(false);
    expect(verifyPassword('anything', '')).toBe(false);
  });
});

describe('generateSessionToken / hashSessionToken', () => {
  it('generates distinct tokens', () => {
    expect(generateSessionToken()).not.toBe(generateSessionToken());
  });

  it('hashes deterministically', () => {
    const token = generateSessionToken();
    expect(hashSessionToken(token)).toBe(hashSessionToken(token));
  });

  it('hashes different tokens differently', () => {
    expect(hashSessionToken('token-a')).not.toBe(hashSessionToken('token-b'));
  });
});

describe('generateBootstrapPassword', () => {
  it('generates distinct, non-trivial passwords', () => {
    const a = generateBootstrapPassword();
    const b = generateBootstrapPassword();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(20);
  });

  it('round-trips through hashPassword / verifyPassword', () => {
    const password = generateBootstrapPassword();
    const stored = hashPassword(password);
    expect(verifyPassword(password, stored)).toBe(true);
  });
});

describe('session cookie helpers', () => {
  it('round-trips a token through serialize and parse', () => {
    const cookie = serializeSessionCookie('abc123', 3600, true);
    const header = cookie.split(';')[0]; // just the name=value part, as a browser would send it back
    expect(parseSessionCookie(header)).toBe('abc123');
  });

  it('parses the target cookie out of a header with multiple cookies', () => {
    const header = 'other=1; torah_session=xyz789; another=2';
    expect(parseSessionCookie(header)).toBe('xyz789');
  });

  it('returns null when the cookie is absent', () => {
    expect(parseSessionCookie('other=1')).toBeNull();
    expect(parseSessionCookie(undefined)).toBeNull();
  });

  it('serializes with Secure only when requested', () => {
    expect(serializeSessionCookie('t', 60, true)).toContain('Secure');
    expect(serializeSessionCookie('t', 60, false)).not.toContain('Secure');
  });

  it('clearSessionCookie expires immediately', () => {
    expect(clearSessionCookie(false)).toContain('Max-Age=0');
  });
});

describe('isHeaderAuthenticated', () => {
  it('requires requireProxyHeader to be true, even with a header present', () => {
    expect(isHeaderAuthenticated('someone', false)).toBe(false);
  });

  it('trusts a non-empty header when requireProxyHeader is true', () => {
    expect(isHeaderAuthenticated('someone', true)).toBe(true);
  });

  it('rejects an absent or blank header', () => {
    expect(isHeaderAuthenticated(undefined, true)).toBe(false);
    expect(isHeaderAuthenticated('   ', true)).toBe(false);
  });

  it('uses the first value when the header repeats', () => {
    expect(isHeaderAuthenticated(['someone', 'else'], true)).toBe(true);
    expect(isHeaderAuthenticated(['', 'else'], true)).toBe(false);
  });
});
