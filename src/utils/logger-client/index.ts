import { Capacitor } from '@capacitor/core';
import * as webImpl from './web.js';
import type { LogLevel } from './types.js';

export type { LogLevel } from './types.js';

// native.ts's Capacitor plugin imports are native-only — a static import here would ship
// them to bundles that don't need them (same reasoning as src/db/index.ts's native.js
// split), so load lazily instead. window.torahElectron is set by electron/preload.cjs
// and only exists inside Electron's renderer — never in a plain web or Capacitor build.
const isElectron = typeof window !== 'undefined'
  && Boolean((window as { torahElectron?: { isElectron?: boolean } }).torahElectron?.isElectron);

let eventImpl;
if (isElectron) {
  eventImpl = await import('./electron.js');
} else if (Capacitor.isNativePlatform()) {
  eventImpl = await import('./native.js');
} else {
  eventImpl = webImpl;
}

const exportImpl = Capacitor.isNativePlatform() ? await import('./native.js') : webImpl;

export const logEvent: (level: LogLevel, category: string, message: string, meta?: unknown) => void = eventImpl.logEvent;
export const exportLogs: () => Promise<void> = exportImpl.exportLogs;
