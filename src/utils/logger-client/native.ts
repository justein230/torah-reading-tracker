import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { shareFile } from '../share.js';
import type { LogLevel } from './types.js';
import { redact, isDebugEnabled } from './types.js';

// Capacitor has no server to ship logs to, so this writes directly to on-device storage
// and relies on Share (same pattern as exportDb()/exportExcel() in src/utils/export.ts)
// to get the file off the device.
const LOG_DIR  = 'logs';
const LOG_PATH = `${LOG_DIR}/app.log`;
const MAX_BYTES = 2 * 1024 * 1024;

let dirReady: Promise<void> | null = null;

function ensureDir(): Promise<void> {
  dirReady ??= Filesystem.mkdir({ path: LOG_DIR, directory: Directory.Data, recursive: true }).catch(() => {
    // already exists — mkdir rejects in that case, which is fine
  });
  return dirReady;
}

async function rotateIfNeeded(): Promise<void> {
  try {
    const { size } = await Filesystem.stat({ path: LOG_PATH, directory: Directory.Data });
    if (size < MAX_BYTES) return;
  } catch {
    return; // no file yet
  }
  await Filesystem.deleteFile({ path: `${LOG_PATH}.1`, directory: Directory.Data }).catch(() => {});
  await Filesystem.rename({ from: LOG_PATH, to: `${LOG_PATH}.1`, directory: Directory.Data }).catch(() => {});
}

export function logEvent(level: LogLevel, category: string, message: string, meta?: unknown): void {
  if (level === 'debug' && !isDebugEnabled()) return;
  const line = `${JSON.stringify({ ts: new Date().toISOString(), level, category, message, meta: redact(meta) })}\n`;
  void (async () => {
    await ensureDir();
    await rotateIfNeeded();
    await Filesystem.appendFile({ path: LOG_PATH, directory: Directory.Data, data: line, encoding: Encoding.UTF8 });
  })();
}

// Shares a copy from the cache dir: Android's share sheet can only read files under the
// FileProvider roots in android/app/src/main/res/xml/file_paths.xml, and Directory.Data isn't one.
export async function exportLogs(): Promise<void> {
  await Filesystem.copy({ from: LOG_PATH, directory: Directory.Data, to: 'app.log', toDirectory: Directory.Cache });
  const { uri } = await Filesystem.getUri({ path: 'app.log', directory: Directory.Cache });
  await shareFile({ url: uri, title: 'Torah Tracker Logs', dialogTitle: 'Export Logs' });
}
