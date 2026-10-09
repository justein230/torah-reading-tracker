// Names for the backups both platforms take just before running a pending migration, e.g.
// torah-backup-2026-10-08T14-03-22Z-schema7-app1.0.8.db. The name records when the copy was made,
// the copy's own schema version (which app versions can open it) and the app version that last
// used the file (app_meta.last_app_version, or 'unknown' for a file from before that table).
// Free of Node/Capacitor imports so the server and the native app share it.

export const MAX_MIGRATION_BACKUPS = 5;
export const APP_VERSION_KEY       = 'last_app_version';
export const UNKNOWN_APP_VERSION   = 'unknown';

export interface BackupNameInfo {
  dbBase:        string; // the live db's file name without extension, e.g. 'torah'
  date:          Date;
  schemaVersion: number;
  appVersion:    string;
}

const BACKUP_NAME_RE = /^(.+)-backup-(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})Z-schema(\d+)-app([A-Za-z0-9.+-]+)\.db$/;

// Seconds-precision UTC with ':' swapped for '-' (not allowed in Windows file names), so names
// still sort chronologically as plain strings.
function stamp(date: Date): string {
  return date.toISOString().slice(0, 19).replace(/:/g, '-') + 'Z';
}

export function formatBackupName({ dbBase, date, schemaVersion, appVersion }: BackupNameInfo): string {
  const safeVersion = appVersion.replace(/[^A-Za-z0-9.+-]/g, '-') || UNKNOWN_APP_VERSION;
  return `${dbBase}-backup-${stamp(date)}-schema${schemaVersion}-app${safeVersion}.db`;
}

export function parseBackupName(name: string): BackupNameInfo | null {
  const m = BACKUP_NAME_RE.exec(name);
  if (!m) return null;
  const [, dbBase, day, hh, mm, ss, schema, appVersion] = m;
  const date = new Date(`${day}T${hh}:${mm}:${ss}Z`);
  if (Number.isNaN(date.getTime())) return null;
  return { dbBase: dbBase!, date, schemaVersion: Number(schema), appVersion: appVersion! };
}

// Which of `names` to delete so only the newest `keep` backups of `dbBase` remain. Anything that
// isn't one of this db's backups is never returned, so it's safe to pass a whole directory listing.
export function backupsToPrune(names: readonly string[], dbBase: string, keep = MAX_MIGRATION_BACKUPS): string[] {
  const ours = names
    .map(name => ({ name, info: parseBackupName(name) }))
    .filter(b => b.info?.dbBase === dbBase)
    .sort((a, b) => b.info!.date.getTime() - a.info!.date.getTime() || b.name.localeCompare(a.name));
  return ours.slice(keep).map(b => b.name);
}
