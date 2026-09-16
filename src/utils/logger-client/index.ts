import { Capacitor } from '@capacitor/core';
import * as webImpl from './web.js';
import type { LogLevel } from './types.js';

export type { LogLevel } from './types.js';

// electron.ts's electron-log import and native.ts's Capacitor plugin imports are Node/
// native-only — a static import here would ship them to bundles that don't need them
// (same reasoning as src/db/index.ts's native.js split), so load lazily instead.
// window.torahElectron is set by electron/preload.cjs and only exists inside Electron's
// renderer — never in a plain web or Capacitor build.
const isElectron = typeof window !== 'undefined' && Boolean((window as { torahElectron?: unknown }).torahElectron);

const eventImpl = isElectron
  ? await import('./electron.js')
  : Capacitor.isNativePlatform()
    ? await import('./native.js')
    : webImpl;

const exportImpl = Capacitor.isNativePlatform() ? await import('./native.js') : webImpl;

export const logEvent: (level: LogLevel, category: string, message: string, meta?: unknown) => void = eventImpl.logEvent;
export const exportLogs: () => Promise<void> = exportImpl.exportLogs;
