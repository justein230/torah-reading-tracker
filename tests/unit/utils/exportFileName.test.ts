import { describe, it, expect } from 'vitest';
import { dateStamp, sanitizeBaseName, dbExportFileName } from '../../../src/utils/exportFileName.js';

// Local-time constructor, so the stamp is the same in every timezone the tests run in.
const nov5 = new Date(2026, 10, 5, 23, 59);

describe('dateStamp', () => {
  it('formats the local date as yyyymmdd', () => {
    expect(dateStamp(nov5)).toBe('20261105');
  });

  it('zero-pads single-digit months and days', () => {
    expect(dateStamp(new Date(2027, 0, 3))).toBe('20270103');
  });
});

describe('sanitizeBaseName', () => {
  it('keeps an ordinary name as is', () => {
    expect(sanitizeBaseName('my readings')).toBe('my readings');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeBaseName('  torah  ')).toBe('torah');
  });

  it('replaces path separators and characters filesystems reject', () => {
    expect(sanitizeBaseName('a/b\\c:d*e?f"g<h>i|j')).toBe('a-b-c-d-e-f-g-h-i-j');
  });

  it('drops a .db / .sqlite / .sqlite3 extension the user typed', () => {
    expect(sanitizeBaseName('backup.db')).toBe('backup');
    expect(sanitizeBaseName('backup.SQLite')).toBe('backup');
    expect(sanitizeBaseName('backup.sqlite3')).toBe('backup');
  });

  it('keeps other dots in the name', () => {
    expect(sanitizeBaseName('torah.v2')).toBe('torah.v2');
  });

  it('strips leading dots so the export is never a hidden file', () => {
    expect(sanitizeBaseName('.torah')).toBe('torah');
  });

  it('falls back to the default when nothing usable is left', () => {
    expect(sanitizeBaseName('')).toBe('torah');
    expect(sanitizeBaseName('   ')).toBe('torah');
    expect(sanitizeBaseName('.db')).toBe('torah');
  });
});

describe('dbExportFileName', () => {
  it('adds the .db extension', () => {
    expect(dbExportFileName('torah', false, nov5)).toBe('torah.db');
  });

  it('appends -yyyymmdd before the extension when the suffix is on', () => {
    expect(dbExportFileName('torah', true, nov5)).toBe('torah-20261105.db');
  });

  it('sanitizes the name before adding the suffix', () => {
    expect(dbExportFileName(' my/readings.db ', true, nov5)).toBe('my-readings-20261105.db');
  });
});
