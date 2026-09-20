import { Capacitor } from '@capacitor/core';

export async function importDb(file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  // Mobile app: no server to upload to, so swap the on-device SQLite file directly.
  // Lazy-imported so the native-only SQLite plugin never ships in the web bundle.
  if (Capacitor.isNativePlatform()) {
    const { importDatabase } = await import('../db/native.js');
    return importDatabase(file);
  }

  // Web/desktop: upload to the server, which does the swap on its own filesystem.
  const res = await fetch('/api/import/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.sqlite3' },
    body: await file.arrayBuffer(),
  });
  if (res.ok) return { ok: true };
  const body = await res.json().catch(() => null);
  return { ok: false, error: body?.detail ?? 'Failed to import database.' };
}
