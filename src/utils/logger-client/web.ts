import type { LogLevel } from './types.js';
import { redact, isDebugEnabled } from './types.js';

/**
 * No persistence on plain web — DevTools' console and Network tab already cover this,
 * and building custom capture/export for something the browser handles natively would be
 * pure overhead. See "Client" in the logging plan's Library choices for the reasoning.
 *
 * Looks up console[level] on each call rather than capturing a reference at module load —
 * the latter would miss console being replaced later (e.g. vi.spyOn in tests).
 */
export function logEvent(level: LogLevel, category: string, message: string, meta?: unknown): void {
  if (level === 'debug' && !isDebugEnabled()) return;
  const label = `[${category}] ${message}`;
  if (meta !== undefined) console[level](label, redact(meta));
  else console[level](label);
}

/**
 * Downloads the server's own mutation log (GET /api/export/logs — authenticated, and
 * unrelated to any client-shipped data since there's no such thing on web). Electron
 * reuses this unchanged: its embedded server serves the same endpoint at its loopback port.
 */
export async function exportLogs(): Promise<void> {
  const res = await fetch('/api/export/logs');
  const blob = await res.blob();
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'torah-logs.txt';
  a.click();
  URL.revokeObjectURL(a.href);
}
