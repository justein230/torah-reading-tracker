import type { LogLevel } from './types.js';
import { redact, isDebugEnabled } from './types.js';

interface TorahElectronBridge {
  isElectron: true;
  log(level: LogLevel, category: string, message: string, meta?: unknown): void;
}

/**
 * Relays to the main process over the bridge electron/preload.cjs exposes via
 * contextBridge — a hand-rolled IPC call rather than electron-log/renderer, since that
 * package's own bridge (electron-log/preload) needs require() to resolve an npm package
 * from inside the preload script, which Electron's sandboxed preload (kept on
 * deliberately — see main.cjs) doesn't allow. main.cjs's ipcMain listener is what
 * actually calls electron-log and writes the rotated file.
 */
export function logEvent(level: LogLevel, category: string, message: string, meta?: unknown): void {
  if (level === 'debug' && !isDebugEnabled()) return;
  (window as unknown as { torahElectron: TorahElectronBridge }).torahElectron.log(level, category, message, redact(meta));
}

// Electron's embedded server serves the same /api/export/logs endpoint plain web does —
// nothing Electron-specific needed for exporting the mutation log.
export { exportLogs } from './web.js';
