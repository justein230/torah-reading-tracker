import { describe, it, expect, afterEach } from 'vitest';
import { redact, isDebugEnabled } from '../../src/utils/logger-client/types.js';

describe('redact', () => {
  it('replaces known credential fields with a placeholder', () => {
    expect(redact({ password: 'hunter2', location: 'shul' })).toEqual({
      password: '[redacted]',
      location: 'shul',
    });
  });

  it('redacts currentPassword, newPassword, and token alongside password', () => {
    expect(redact({ currentPassword: 'a', newPassword: 'b', token: 'c', ok: true })).toEqual({
      currentPassword: '[redacted]', newPassword: '[redacted]', token: '[redacted]', ok: true,
    });
  });

  it('passes through non-object values unchanged', () => {
    expect(redact('plain string')).toBe('plain string');
    expect(redact(undefined)).toBeUndefined();
    expect(redact(null)).toBeNull();
  });

  it('does not mutate the original object', () => {
    const original = { password: 'hunter2' };
    redact(original);
    expect(original).toEqual({ password: 'hunter2' });
  });
});

describe('isDebugEnabled', () => {
  afterEach(() => localStorage.clear());

  it('is false when no settings are stored', () => {
    expect(isDebugEnabled()).toBe(false);
  });

  it('reflects debugLogging from the persisted settings', () => {
    localStorage.setItem('torah-tracker:settings', JSON.stringify({ debugLogging: true }));
    expect(isDebugEnabled()).toBe(true);
  });

  it('is false when the stored settings are malformed', () => {
    localStorage.setItem('torah-tracker:settings', 'not json');
    expect(isDebugEnabled()).toBe(false);
  });
});
