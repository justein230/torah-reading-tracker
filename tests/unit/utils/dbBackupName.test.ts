// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { backupsToPrune, formatBackupName, parseBackupName, MAX_MIGRATION_BACKUPS } from '../../../src/utils/dbBackupName';

const DATE = new Date('2026-10-08T14:03:22.456Z');

describe('formatBackupName', () => {
  it('records the db, UTC time to the second, schema version and app version', () => {
    expect(formatBackupName({ dbBase: 'torah', date: DATE, schemaVersion: 7, appVersion: '1.0.8' }))
      .toBe('torah-backup-2026-10-08T14-03-22Z-schema7-app1.0.8.db');
  });

  it('keeps prerelease versions intact', () => {
    expect(formatBackupName({ dbBase: 'torah', date: DATE, schemaVersion: 7, appVersion: '1.0.9-dev.3' }))
      .toBe('torah-backup-2026-10-08T14-03-22Z-schema7-app1.0.9-dev.3.db');
  });

  it('replaces characters that are unsafe in file names', () => {
    expect(formatBackupName({ dbBase: 'torah', date: DATE, schemaVersion: 7, appVersion: '1.0/8 x' }))
      .toBe('torah-backup-2026-10-08T14-03-22Z-schema7-app1.0-8-x.db');
  });

  it('falls back to "unknown" for an empty version', () => {
    expect(formatBackupName({ dbBase: 'torah', date: DATE, schemaVersion: 7, appVersion: '' })).toContain('-appunknown.db');
  });
});

describe('parseBackupName', () => {
  it('round-trips formatBackupName (to the second)', () => {
    for (const appVersion of ['1.0.8', '1.0.9-dev.3', 'unknown', '2.0.0+build.5']) {
      const name = formatBackupName({ dbBase: 'torah', date: DATE, schemaVersion: 12, appVersion });
      expect(parseBackupName(name)).toEqual({
        dbBase: 'torah', date: new Date('2026-10-08T14:03:22Z'), schemaVersion: 12, appVersion,
      });
    }
  });

  it('handles a db base name that itself contains dashes', () => {
    expect(parseBackupName('my-torah-backup-2026-10-08T14-03-22Z-schema7-app1.0.8.db')?.dbBase).toBe('my-torah');
  });

  it('rejects files that are not migration backups', () => {
    for (const name of [
      'torah.db',
      'torah.db.2026-09-16T05-00-45-273Z.bak',      // import backups (backups/ folder)
      'torah-backup-2026-10-08T14-03-22Z-schema7.db', // no app version
      'torah-backup-2026-10-08T14-03-22Z-schema7-app1.0.8.db.tmp',
      'torah-backup-2026-13-45T14-03-22Z-schema7-app1.0.8.db', // impossible date
    ]) {
      expect(parseBackupName(name), name).toBeNull();
    }
  });
});

describe('backupsToPrune', () => {
  const nameAt = (iso: string, dbBase = 'torah') =>
    formatBackupName({ dbBase, date: new Date(iso), schemaVersion: 7, appVersion: '1.0.8' });

  it('keeps the newest backups and returns the rest, oldest included', () => {
    const names = ['2026-01-01', '2026-03-01', '2026-02-01', '2026-05-01', '2026-04-01', '2026-06-01', '2025-12-01']
      .map(day => nameAt(`${day}T00:00:00Z`));
    expect(backupsToPrune(names, 'torah', 5).sort()).toEqual([nameAt('2025-12-01T00:00:00Z'), nameAt('2026-01-01T00:00:00Z')].sort());
  });

  it('defaults to keeping MAX_MIGRATION_BACKUPS', () => {
    const names = Array.from({ length: MAX_MIGRATION_BACKUPS + 2 }, (_, i) => nameAt(`2026-01-0${i + 1}T00:00:00Z`));
    expect(backupsToPrune(names, 'torah')).toHaveLength(2);
  });

  it('returns nothing when at or under the limit', () => {
    expect(backupsToPrune([nameAt('2026-01-01T00:00:00Z')], 'torah', 5)).toEqual([]);
  });

  it('never touches other files or another db’s backups', () => {
    const names = [
      'torah.db', 'torah.log', 'notes.txt',
      ...Array.from({ length: 3 }, (_, i) => nameAt(`2026-01-0${i + 1}T00:00:00Z`, 'other')),
      ...Array.from({ length: 3 }, (_, i) => nameAt(`2026-02-0${i + 1}T00:00:00Z`)),
    ];
    expect(backupsToPrune(names, 'torah', 1)).toEqual([nameAt('2026-02-02T00:00:00Z'), nameAt('2026-02-01T00:00:00Z')]);
  });
});
