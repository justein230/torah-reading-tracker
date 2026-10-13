import { CapacitorSQLite, SQLiteConnection, type SQLiteDBConnection } from '@capacitor-community/sqlite';
import { createNativeDb } from './drizzle-native.js';
import { createRepository } from './repository.js';
import { NATIVE_DB_VERSION, NATIVE_UPGRADE_STATEMENTS } from './nativeMigrations.generated.js';
import { NewerSchemaError, switchOverVersion } from '../utils/schemaVersion.js';
import { parshiot, occasions as occasionsTable } from './schema.js';
import { APP_META_GET_SQL, APP_META_UPSERT_SQL } from './queries.js';
import type { HebcalData, AuthStatus } from '../types/index.js';
import { scheduleFromEntries, datesByParshaFromEntries, fetchLiveHebcalItemsForDate, entriesFromHebcalItems } from '../utils/sedra.js';
import { holidayDatesFromEntries } from '../utils/occasionDates.js';
import { SEDRA_CACHE, SEDRA_YEARS } from '../data/sedraCache.js';
import { HOLIDAY_CACHE } from '../data/holidayCache.js';
import { logEvent } from '../utils/logger-client/index.js';
import { APP_VERSION_KEY, UNKNOWN_APP_VERSION, formatBackupName } from '../utils/dbBackupName.js';
import { errText } from '../utils/errText.js';
import { localDateStr } from '../utils/dates.js';
import { saveBackup } from './nativeBackups.js';

const sqlite = new SQLiteConnection(CapacitorSQLite);
let dbPromise: Promise<SQLiteDBConnection> | null = null;

async function readTableNames(conn: SQLiteDBConnection): Promise<Set<string>> {
  const tables = await conn.query("SELECT name FROM sqlite_master WHERE type = 'table'");
  return new Set((tables.values ?? []).map((r: { name: string }) => r.name));
}

// The db's effective schema version: native counterpart of effectiveSchemaVersion in
// utils/migrationSteps.ts.
async function readSchemaVersion(conn: SQLiteDBConnection, tableNames: Set<string>): Promise<number> {
  const userVersion = (await conn.query('PRAGMA user_version')).values?.[0]?.user_version ?? 0;
  const drizzleRows = tableNames.has('__drizzle_migrations')
    ? (await conn.query('SELECT COUNT(*) AS n FROM __drizzle_migrations')).values?.[0]?.n ?? 0
    : 0;
  return switchOverVersion(userVersion, drizzleRows);
}

// Copies the on-device db into the backups folder (see nativeBackups.ts) when the upgrade in
// getConn() is about to run, so a migration that succeeds but mangles data can be undone from
// Settings → Backups. The plugin's own backup-<db> copy only covers a failed upgrade and is
// deleted after a successful one. Inspects the db read-only, which never triggers the upgrade.
// Failures are logged, not thrown: refusing to open the db would lock the user out of the app.
async function backupBeforeUpgrade(): Promise<void> {
  try {
    if (!(await sqlite.isDatabase('torah')).result) return;
    const roConn = await sqlite.createConnection('torah', false, 'no-encryption', 1, true);
    let schemaVersion: number;
    let appVersion: string;
    let url: string | undefined;
    try {
      await roConn.open();
      const tableNames = await readTableNames(roConn);
      schemaVersion = await readSchemaVersion(roConn, tableNames);
      appVersion    = tableNames.has('app_meta')
        ? (await roConn.query(APP_META_GET_SQL, [APP_VERSION_KEY])).values?.[0]?.value ?? UNKNOWN_APP_VERSION
        : UNKNOWN_APP_VERSION;
      ({ url } = await CapacitorSQLite.getUrl({ database: 'torah', readonly: true }));
    } finally {
      await roConn.close().catch(() => {});
      await sqlite.closeConnection('torah', true).catch(() => {});
    }
    if (schemaVersion === 0 || schemaVersion >= NATIVE_DB_VERSION || !url) return;

    const name = formatBackupName({ dbBase: 'torah', date: new Date(), schemaVersion, appVersion });
    await saveBackup(url, name);
    logEvent('info', 'db', `Backed up schema version ${schemaVersion} to ${name} before upgrading to ${NATIVE_DB_VERSION}`);
  } catch (e: unknown) {
    logEvent('warn', 'db', 'Pre-upgrade backup failed; upgrading anyway', { detail: errText(e) });
  }
}

function getConn() {
  dbPromise ??= (async () => {
    await sqlite.copyFromAssets(false);
    await backupBeforeUpgrade();
    // Applies any drizzle migrations added since the on-device db's PRAGMA user_version was
    // last stamped (see scripts/build-native-migrations.ts and src/db/init.ts's server-side
    // equivalent) — a no-op for a freshly-copied asset db, which is already at NATIVE_DB_VERSION.
    await sqlite.addUpgradeStatement('torah', NATIVE_UPGRADE_STATEMENTS);
    const conn = await sqlite.createConnection('torah', false, 'no-encryption', NATIVE_DB_VERSION, false);
    await conn.open();
    await conn.run(APP_META_UPSERT_SQL, [APP_VERSION_KEY, __APP_VERSION__]);
    return conn;
  })().catch(async err => {
    // Don't cache the failure: drop the half-made connection so the next call can retry.
    dbPromise = null;
    await sqlite.closeConnection('torah', false).catch(() => {});
    throw err;
  });
  return dbPromise;
}

const db = createNativeDb(getConn);

export async function fetchCanWrite(): Promise<boolean> {
  return true;
}

// Native has direct on-device DB access — there's no server to authenticate against,
// so writes are always allowed and login/logout are no-ops.
export async function fetchAuthStatus(): Promise<AuthStatus> {
  return { authMode: 'none', insecureConfig: false };
}

export async function login(_password: string): Promise<boolean> {
  return true;
}

export async function logout(): Promise<void> {
  // Intentional no-op — see comment above.
}

export async function changePassword(_currentPassword: string, _newPassword: string): Promise<{ ok: true } | { ok: false; error: string }> {
  return { ok: true };
}

const REQUIRED_IMPORT_TABLES = ['sefarim', 'parshiot', 'aliyot', 'readings'];
const SQLITE_MAGIC = 'SQLite format 3\0';

type ImportResult = { ok: true } | { ok: false; error: string };

// Opens the scratch copy read-only — the plugin never runs upgrade steps on a read-only
// connection — and checks it's a Torah Tracker database no newer than this app. Returns its
// effective schema version (see switchOverVersion), or an error message.
async function checkImportedDb(checkDb: string): Promise<{ version: number } | { error: string }> {
  let checkConn;
  try {
    checkConn = await sqlite.createConnection(checkDb, false, 'no-encryption', 1, true);
    await checkConn.open();
  } catch {
    return { error: 'Could not open file as a SQLite database.' };
  }
  try {
    const integrity = await checkConn.query('PRAGMA integrity_check');
    if (integrity.values?.[0]?.integrity_check !== 'ok') return { error: 'Database failed integrity check.' };

    const tableNames = await readTableNames(checkConn);
    const missing = REQUIRED_IMPORT_TABLES.filter(t => !tableNames.has(t));
    if (missing.length) {
      return { error: `Doesn't look like a Torah Tracker database (missing table${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}).` };
    }

    const version = await readSchemaVersion(checkConn, tableNames);
    if (version > NATIVE_DB_VERSION) return { error: new NewerSchemaError(version, NATIVE_DB_VERSION).message };
    return { version };
  } finally {
    await checkConn.close();
    await sqlite.closeConnection(checkDb, true).catch(() => {});
  }
}

// Checks the upload in a scratch db (so getUrl() tells us its real path) and upgrades that copy to
// the current schema with the same plugin mechanism getConn() uses. Returns the upgraded file as
// base64; the live database is never touched here. Always tears the scratch db down.
async function prepareImportedDb(bytes: Uint8Array): Promise<{ ok: true; data: string } | { ok: false; error: string }> {
  const CHECK_DB = 'torah_import_check';
  const { Filesystem } = await import('@capacitor/filesystem');

  await CapacitorSQLite.deleteDatabase({ database: CHECK_DB }).catch(() => {});
  await sqlite.createConnection(CHECK_DB, false, 'no-encryption', 1, false);
  const { url: checkUrl } = await CapacitorSQLite.getUrl({ database: CHECK_DB });
  await sqlite.closeConnection(CHECK_DB, false);
  if (!checkUrl) return { ok: false, error: 'Could not locate scratch database on device.' };
  await Filesystem.writeFile({ path: checkUrl, data: Buffer.from(bytes).toString('base64') });

  try {
    const checked = await checkImportedDb(CHECK_DB);
    if ('error' in checked) return { ok: false, error: checked.error };

    // Write the effective version straight into the file's header (user_version is the 4-byte
    // big-endian field at offset 60), so the upgrade below starts from the right step. Doing it
    // over a connection isn't safe: any read-write open with a version number can itself trigger
    // the plugin's upgrade from the file's stale version.
    new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(60, checked.version);
    await Filesystem.writeFile({ path: checkUrl, data: Buffer.from(bytes).toString('base64') });

    try {
      await sqlite.addUpgradeStatement(CHECK_DB, NATIVE_UPGRADE_STATEMENTS);
      const upgradeConn = await sqlite.createConnection(CHECK_DB, false, 'no-encryption', NATIVE_DB_VERSION, false);
      await upgradeConn.open();
      await upgradeConn.close();
    } catch {
      return { ok: false, error: 'Could not upgrade the file to this app version.' };
    }
    await sqlite.closeConnection(CHECK_DB, false).catch(() => {});
    const { data } = await Filesystem.readFile({ path: checkUrl });
    return { ok: true, data: data as string };
  } finally {
    await sqlite.closeConnection(CHECK_DB, false).catch(() => {});
    await CapacitorSQLite.deleteDatabase({ database: CHECK_DB }).catch(() => {});
  }
}

// Native equivalent of importDatabase in utils/import-server.ts, minus auth-row preservation
// (native has no auth). Validates and upgrades a scratch copy, then overwrites the live db file
// in place; if the result won't open, the previous file is restored.
export async function importDatabase(file: File): Promise<ImportResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const header = new TextDecoder('latin1').decode(bytes.slice(0, 16));
  if (header !== SQLITE_MAGIC) return { ok: false, error: 'Not a valid SQLite database file.' };

  const prepared = await prepareImportedDb(bytes);
  if (!prepared.ok) return prepared;

  const { Filesystem } = await import('@capacitor/filesystem');
  const { url: mainUrl } = await CapacitorSQLite.getUrl({ database: 'torah' });
  if (!mainUrl) return { ok: false, error: 'Could not locate the database on device.' };

  // Best-effort backup, not surfaced in the UI — shouldn't block the import if it fails.
  let previous: string | null = null;
  try {
    previous = (await Filesystem.readFile({ path: mainUrl })).data as string;
    await Filesystem.writeFile({ path: `${mainUrl}.bak`, data: previous });
  } catch {
    // ignore
  }

  const conn = await getConn();
  await conn.close();
  await sqlite.closeConnection('torah', false);
  await Filesystem.writeFile({ path: mainUrl, data: prepared.data });
  dbPromise = null; // next getConn() reopens against the file just written

  try {
    await getConn();
  } catch {
    if (previous === null) return { ok: false, error: 'The imported database could not be opened.' };
    await sqlite.closeConnection('torah', false).catch(() => {});
    await Filesystem.writeFile({ path: mainUrl, data: previous });
    return { ok: false, error: 'The imported database could not be opened; your previous data was restored.' };
  }
  return { ok: true };
}

// Every read and write below comes from the repository the server shares (src/db/repository.ts).
const repo = createRepository(db, async (query, params = []) => {
  const conn = await getConn();
  return (await conn.query(query, params)).values ?? [];
});

export const { fetchMeta, fetchAliyot, fetchReadings, fetchLocationStats, fetchOccasions, fetchOccasionAliyot, fetchSpecialReadings, fetchWeekdayAliyot, fetchHosafotReadings } = repo;

// The upcoming-parsha dates come from the baked cache (src/data/sedraCache.ts, generated
// from the Hebcal.com REST API — CC BY 4.0). Native builds are cache-only and offline by
// default: no library, no network. The cache runs through SEDRA_YEARS[1].
export async function fetchHebcal(): Promise<HebcalData> {
  const parshaRows = await db.select({ name_en: parshiot.nameEn }).from(parshiot).all();
  const known = new Set(parshaRows.map(r => r.name_en));
  const occasionRows = await db.select({ nameEn: occasionsTable.nameEn }).from(occasionsTable).all();
  return {
    schedule:      scheduleFromEntries(SEDRA_CACHE, known, localDateStr()),
    datesByParsha: datesByParshaFromEntries(SEDRA_CACHE, known),
    cacheYears:    [SEDRA_YEARS[0], SEDRA_YEARS[1]],
    holidayDates:  holidayDatesFromEntries(HOLIDAY_CACHE, occasionRows.map(r => r.nameEn)),
  };
}

// On-demand, single-day live lookup for dates outside SEDRA_YEARS. Opt-in via the
// Settings toggle (off by default, same as web) — only attempted when the device
// reports it's online, and any failure degrades to "no data" rather than throwing.
export async function fetchHebcalOnDate(date: string): Promise<{ parshiot: string[] }> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { parshiot: [] };
  try {
    const items = await fetchLiveHebcalItemsForDate(date);
    return { parshiot: entriesFromHebcalItems(items).map(([, name]) => name) };
  } catch {
    return { parshiot: [] };
  }
}

// ── logging ───────────────────────────────────────────────────────────────────
// Wraps each repository write with attempt/outcome logging, mirroring what src/db/web.ts's
// mutateJson/del do for the web/Electron path (there the server's request log covers the rest).
function logged<A extends unknown[], R>(label: string, fn: (...args: A) => Promise<R>): (...args: A) => Promise<R> {
  return async (...args: A): Promise<R> => {
    logEvent('debug', 'mutation', `${label} start`);
    try {
      const result = await fn(...args);
      logEvent('info', 'mutation', `${label} ok`);
      return result;
    } catch (e: unknown) {
      logEvent('warn', 'mutation', `${label} failed`, { detail: (e as { detail?: string } | null)?.detail });
      throw e;
    }
  };
}

export const postReading           = logged('postReading', repo.postReading);
export const putReading            = logged('putReading', repo.putReading);
export const deleteReading         = logged('deleteReading', repo.deleteReading);
export const postSpecialReading    = logged('postSpecialReading', repo.postSpecialReading);
export const deleteSpecialReading  = logged('deleteSpecialReading', repo.deleteSpecialReading);
export const postWeekdayReading    = logged('postWeekdayReading', repo.postWeekdayReading);
export const putWeekdayReading     = logged('putWeekdayReading', repo.putWeekdayReading);
export const deleteWeekdayReading  = logged('deleteWeekdayReading', repo.deleteWeekdayReading);
export const postHosafah           = logged('postHosafah', repo.postHosafah);
export const putHosafah            = logged('putHosafah', repo.putHosafah);
export const deleteHosafah         = logged('deleteHosafah', repo.deleteHosafah);
