import { describe, it, expect } from 'vitest';
import {
  dateStamp, sanitizeBaseName, exportFileName, DB_EXPORT_FORMAT as DB, EXCEL_EXPORT_FORMAT as XLSX,
} from '../../../src/utils/exportFileName.js';

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
    expect(sanitizeBaseName('my readings', DB)).toBe('my readings');
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizeBaseName('  torah  ', DB)).toBe('torah');
  });

  it('replaces path separators and characters filesystems reject', () => {
    expect(sanitizeBaseName('a/b\\c:d*e?f"g<h>i|j', DB)).toBe('a-b-c-d-e-f-g-h-i-j');
  });

  it('drops a .db / .sqlite / .sqlite3 extension the user typed', () => {
    expect(sanitizeBaseName('backup.db', DB)).toBe('backup');
    expect(sanitizeBaseName('backup.SQLite', DB)).toBe('backup');
    expect(sanitizeBaseName('backup.sqlite3', DB)).toBe('backup');
  });

  it('drops a .xlsx / .xls extension the user typed, for Excel only', () => {
    expect(sanitizeBaseName('report.xlsx', XLSX)).toBe('report');
    expect(sanitizeBaseName('report.XLS', XLSX)).toBe('report');
    expect(sanitizeBaseName('report.db', XLSX)).toBe('report.db');
    expect(sanitizeBaseName('report.xlsx', DB)).toBe('report.xlsx');
  });

  it('keeps other dots in the name', () => {
    expect(sanitizeBaseName('torah.v2', DB)).toBe('torah.v2');
  });

  it('strips leading dots so the export is never a hidden file', () => {
    expect(sanitizeBaseName('.torah', DB)).toBe('torah');
  });

  it('falls back to the format\'s default when nothing usable is left', () => {
    expect(sanitizeBaseName('', DB)).toBe('torah');
    expect(sanitizeBaseName('   ', DB)).toBe('torah');
    expect(sanitizeBaseName('.db', DB)).toBe('torah');
    expect(sanitizeBaseName('', XLSX)).toBe('torah-readings');
    expect(sanitizeBaseName('.xlsx', XLSX)).toBe('torah-readings');
  });
});

describe('exportFileName', () => {
  it('adds the format\'s extension', () => {
    expect(exportFileName('torah', DB, false, nov5)).toBe('torah.db');
    expect(exportFileName('torah', XLSX, false, nov5)).toBe('torah.xlsx');
  });

  it('appends -yyyymmdd before the extension when the suffix is on', () => {
    expect(exportFileName('torah', DB, true, nov5)).toBe('torah-20261105.db');
    expect(exportFileName('torah', XLSX, true, nov5)).toBe('torah-20261105.xlsx');
  });

  it('sanitizes the name before adding the suffix', () => {
    expect(exportFileName(' my/readings.db ', DB, true, nov5)).toBe('my-readings-20261105.db');
  });

  it('uses the Excel default name when the name is empty', () => {
    expect(exportFileName('', XLSX, true, nov5)).toBe('torah-readings-20261105.xlsx');
  });
});
