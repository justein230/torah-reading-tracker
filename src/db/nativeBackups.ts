import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { backupsToPrune, parseBackupName } from '../utils/dbBackupName.js';

// Pre-migration backups on iOS/Android (the server keeps its own beside torah.db — see
// utils/backup-server.ts). They live in the app's private data folder (filesDir on Android,
// Documents on iOS), and the Settings drawer's Backups list exports, restores and deletes them.
// Lazily imported, like native.ts, so Capacitor plugins never load on web.
const BACKUP_DIR = 'backups';
const DB_BASE    = 'torah';

export interface NativeBackup {
  name:          string;
  date:          Date;
  schemaVersion: number;
  appVersion:    string;
  size:          number;
}

const backupPath = (name: string) => `${BACKUP_DIR}/${name}`;

async function ensureDir(): Promise<void> {
  await Filesystem.mkdir({ path: BACKUP_DIR, directory: Directory.Data, recursive: true }).catch(() => {
    // already exists — mkdir rejects in that case, which is fine
  });
}

// Copies the db file at `sourceUrl` (a file:// URL from CapacitorSQLite.getUrl) into the backups
// folder as `name`, then keeps only the newest MAX_MIGRATION_BACKUPS.
export async function saveBackup(sourceUrl: string, name: string): Promise<void> {
  await ensureDir();
  await Filesystem.copy({ from: sourceUrl, to: backupPath(name), toDirectory: Directory.Data });
  const { files } = await Filesystem.readdir({ path: BACKUP_DIR, directory: Directory.Data });
  for (const old of backupsToPrune(files.map(f => f.name), DB_BASE)) await deleteBackup(old);
}

export async function listBackups(): Promise<NativeBackup[]> {
  await ensureDir();
  const { files } = await Filesystem.readdir({ path: BACKUP_DIR, directory: Directory.Data });
  return files
    .flatMap(f => {
      const info = parseBackupName(f.name);
      return info?.dbBase === DB_BASE ? [{ name: f.name, date: info.date, schemaVersion: info.schemaVersion, appVersion: info.appVersion, size: f.size }] : [];
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

// Shares a copy from the cache dir, not the backup itself: Android's share sheet can only hand
// out files under the paths in its FileProvider config (cache and external storage), not filesDir.
export async function shareBackup(name: string): Promise<void> {
  await Filesystem.copy({ from: backupPath(name), directory: Directory.Data, to: name, toDirectory: Directory.Cache });
  const { uri } = await Filesystem.getUri({ path: name, directory: Directory.Cache });
  await Share.share({ url: uri, title: 'Torah Readings DB backup', dialogTitle: 'Export backup' });
}

export async function deleteBackup(name: string): Promise<void> {
  await Filesystem.deleteFile({ path: backupPath(name), directory: Directory.Data });
}

// The backup as a File, for the normal import path to validate, upgrade and swap in.
export async function readBackupFile(name: string): Promise<File> {
  const { data } = await Filesystem.readFile({ path: backupPath(name), directory: Directory.Data });
  const bytes = Uint8Array.from(atob(data as string), c => c.charCodeAt(0));
  return new File([bytes], name, { type: 'application/vnd.sqlite3' });
}
