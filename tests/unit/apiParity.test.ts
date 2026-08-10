// @vitest-environment node
/**
 * Verifies that web.js and native.js export the same API surface so that
 * platform-switching via db/index.js never silently loses a function.
 */

import { describe, it, expect } from 'vitest';

// Web layer imports cleanly (no native deps).
import * as webApi from '../../src/db/web.js';

// Native layer uses Capacitor/SQLite — mock the deps so we can inspect exports.
vi.mock('@capacitor-community/sqlite', () => ({
  CapacitorSQLite: {},
  SQLiteConnection: class {
    copyFromAssets() { return Promise.resolve(); }
    createConnection() { return Promise.resolve({ open: () => Promise.resolve(), query: () => Promise.resolve({ values: [] }), run: () => Promise.resolve({ changes: { lastId: 1 } }) }); }
  },
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));

import * as nativeApi from '../../src/db/native.js';

const EXPECTED_EXPORTS = [
  'fetchCanWrite',
  'fetchMeta',
  'fetchAliyot',
  'fetchReadings',
  'fetchLocationStats',
  'fetchHebcal',
  'postReading',
  'putReading',
  'deleteReading',
] as const;

const web = webApi as Record<string, unknown>;
const native = nativeApi as Record<string, unknown>;

describe('API surface parity — web.js vs native.js', () => {
  for (const name of EXPECTED_EXPORTS) {
    it(`both export "${name}" as a function`, () => {
      expect(typeof web[name], `web.js missing ${name}`).toBe('function');
      expect(typeof native[name], `native.js missing ${name}`).toBe('function');
    });
  }
});
