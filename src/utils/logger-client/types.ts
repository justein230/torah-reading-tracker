export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

// Sensitive fields that must never reach a log, even at debug level.
const REDACT_KEYS = new Set(['password', 'currentPassword', 'newPassword', 'token']);

/** Shallow-redacts known credential fields before an object is logged. */
export function redact(meta: unknown): unknown {
  if (typeof meta !== 'object' || meta === null) return meta;
  const out: Record<string, unknown> = { ...(meta as Record<string, unknown>) };
  for (const key of Object.keys(out)) {
    if (REDACT_KEYS.has(key)) out[key] = '[redacted]';
  }
  return out;
}

const SETTINGS_KEY = 'torah-tracker:settings'; // same key AppContext.tsx persists AppSettings under

/** Whether the user has opted into verbose debug-level logging (Settings > Diagnostics). */
export function isDebugEnabled(): boolean {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? Boolean((JSON.parse(raw) as { debugLogging?: boolean }).debugLogging) : false;
  } catch {
    return false;
  }
}
