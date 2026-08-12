/**
 * Renders an unknown thrown value as a log-safe string.
 *
 * `err instanceof Error` is not reliable on its own: an error created in another
 * realm (a Node `vm` context, as vitest's `vmForks` pool uses, or a native module
 * loaded outside it) chains to that realm's `Error.prototype`, so the check fails
 * and the raw object would be logged instead of its message. Falling back to
 * `String(err)` keeps the output a string either way.
 */
export function errText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null && typeof (err as { message?: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return String(err);
}
