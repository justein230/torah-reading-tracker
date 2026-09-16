import log from 'electron-log/renderer';
import type { LogLevel } from './types.js';
import { isDebugEnabled } from './types.js';

/**
 * electron-log/renderer proxies calls to the main process over the IPC bridge that
 * electron/preload.cjs wires up (via electron-log/preload); the main process writes them
 * to a real, rotated file at the OS-conventional log location — see main.cjs's
 * `log.initialize()`.
 */
export function logEvent(level: LogLevel, category: string, message: string, meta?: unknown): void {
  if (level === 'debug' && !isDebugEnabled()) return;
  const label = `[${category}] ${message}`;
  switch (level) {
    case 'error': log.error(label, meta ?? ''); break;
    case 'warn':  log.warn(label, meta ?? '');  break;
    case 'debug': log.debug(label, meta ?? ''); break;
    default:      log.info(label, meta ?? '');
  }
}

// Electron's embedded server serves the same /api/export/logs endpoint plain web does —
// nothing Electron-specific needed for exporting the mutation log.
export { exportLogs } from './web.js';
