import { describe, it, expect } from 'vitest';
import { dbFileAccept, DB_FILE_ACCEPT } from '../../src/utils/dbFileAccept.js';

describe('dbFileAccept', () => {
  it('offers every file on iOS, where .db has no system file type', () => {
    expect(dbFileAccept('ios')).toBeUndefined();
  });

  it.each(['android', 'web'])('filters to SQLite files on %s', platform => {
    expect(dbFileAccept(platform)).toBe(DB_FILE_ACCEPT);
  });
});
