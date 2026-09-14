export async function importDb(file: File): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('/api/import/db', {
    method: 'POST',
    headers: { 'Content-Type': 'application/vnd.sqlite3' },
    body: await file.arrayBuffer(),
  });
  if (res.ok) return { ok: true };
  const body = await res.json().catch(() => null);
  return { ok: false, error: body?.detail ?? 'Failed to import database.' };
}
