// @vitest-environment node
/**
 * Verifies that web.js and native.js export the same API surface so that
 * platform-switching via db/index.js never silently loses a function.
 */

import { describe, it, expect } from 'vitest';
import type { DbApi } from '../../src/types/index.js';

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

// Compile-time check: a missing or mistyped member on either platform fails typecheck here,
// so drift is caught by `npm run typecheck` instead of relying on a hand-maintained name list.
const _web: DbApi = webApi;
const _native: DbApi = nativeApi;
const EXPECTED_EXPORTS = Object.keys(_web) as (keyof DbApi)[];

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
