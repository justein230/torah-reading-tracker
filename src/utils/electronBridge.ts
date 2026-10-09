import type { LogLevel } from './logger-client/types.js';

// What electron/preload.cjs exposes as window.torahElectron (see that file for why it's a
// hand-rolled contextBridge rather than electron-log's own).
export interface TorahElectronBridge {
  isElectron: true;
  log(level: LogLevel, category: string, message: string, meta?: unknown): void;
  // Opens the folder holding the db and its pre-migration backups; resolves to '' on success,
  // else an error message.
  openBackupsFolder(): Promise<string>;
}

// The bridge, or undefined outside the desktop app (web, Capacitor, tests).
export function electronBridge(): TorahElectronBridge | undefined {
  return (globalThis as { torahElectron?: TorahElectronBridge }).torahElectron;
}
