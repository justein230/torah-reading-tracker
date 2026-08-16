import type { MetaResult, RawRow, ReadingRecord, LocationStat, PostReadingBody, PutReadingBody, OccasionRecord, RawOccasionAliyahRow, RawSpecialReadingRow, PostSpecialReadingBody, RawWeekdayAliyahRow, PostWeekdayReadingBody, RawHosafahRow, PostHosafahBody, AuthStatus } from '../types/index.js';

// ── fetch helpers ────────────────────────────────────────────────────────────
// Every function below is a thin wrapper around one of these four shapes:
// plain GET, a mutation that returns JSON on success, a mutation whose success
// body is ignored (void), and a DELETE that reports a fixed error message.

const getJson = <T>(path: string): Promise<T> => fetch(path).then(r => r.json() as Promise<T>);

async function mutateJson<T>(path: string, method: string, body: unknown, fallback: string): Promise<T> {
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw await res.json().catch(() => ({ detail: fallback }));
  return res.json();
}

async function mutateVoid(path: string, method: string, body: unknown, fallback: string): Promise<void> {
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw await res.json().catch(() => ({ detail: fallback }));
}

async function del(path: string, fallback: string): Promise<void> {
  const res = await fetch(path, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw Object.assign(new Error(fallback), { detail: fallback });
}

// ── reading catalog / stats ───────────────────────────────────────────────────

export async function fetchCanWrite(): Promise<boolean> {
  return fetch('/api/can-write').then(r => r.json()).then(r => r.canWrite).catch(() => false);
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  return fetch('/api/can-write').then(r => r.json())
    .then(r => ({ authMode: r.authMode, insecureConfig: r.insecureConfig }))
    .catch(() => ({ authMode: 'password' as const, insecureConfig: false }));
}

export async function login(password: string): Promise<boolean> {
  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
  return res.ok;
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (res.ok) return { ok: true };
  const body = await res.json().catch(() => null);
  return { ok: false, error: body?.detail ?? 'Could not change password' };
}

export const fetchMeta          = (): Promise<MetaResult>              => getJson('/api/meta');
export const fetchAliyot        = (): Promise<RawRow[]>                => getJson('/api/aliyot');
export const fetchReadings      = (): Promise<ReadingRecord[]>         => getJson('/api/readings');
export const fetchLocationStats = (): Promise<LocationStat[]>          => getJson('/api/stats/location');

export async function fetchHebcal(): Promise<{ schedule: Record<string, string> }> {
  const res = await fetch('/api/hebcal');
  if (!res.ok) return { schedule: {} };
  return res.json();
}

// ── standard readings ─────────────────────────────────────────────────────────

export const postReading   = (body: PostReadingBody): Promise<{ id: number; reading_type: string }> =>
  mutateJson('/api/readings', 'POST', body, 'Error adding reading.');
export const putReading    = (id: number, body: PutReadingBody): Promise<{ id: number }> =>
  mutateJson(`/api/readings/${id}`, 'PUT', body, 'Error updating reading.');
export const deleteReading = (id: number): Promise<void> =>
  del(`/api/readings/${id}`, 'Error deleting reading.');

// ── occasions / special readings ──────────────────────────────────────────────

export const fetchOccasions         = (): Promise<OccasionRecord[]>          => getJson('/api/occasions');
export const fetchOccasionAliyot    = (): Promise<RawOccasionAliyahRow[]>    => getJson('/api/occasion-aliyot');
export const fetchSpecialReadings   = (): Promise<RawSpecialReadingRow[]>    => getJson('/api/readings/special');

export const postSpecialReading   = (body: PostSpecialReadingBody): Promise<{ id: number }> =>
  mutateJson('/api/readings/special', 'POST', body, 'Error adding special reading.');
export const deleteSpecialReading = (id: number): Promise<void> =>
  del(`/api/readings/special/${id}`, 'Error deleting special reading.');

// ── weekday readings ──────────────────────────────────────────────────────────

export const fetchWeekdayAliyot = (): Promise<RawWeekdayAliyahRow[]> => getJson('/api/weekday-aliyot');

export const postWeekdayReading = (body: PostWeekdayReadingBody): Promise<{ id: number }> =>
  mutateJson('/api/readings/weekday', 'POST', body, 'Error adding weekday reading.');
export const putWeekdayReading  = (id: number, body: { date_read: string; note?: string; location?: string }): Promise<void> =>
  mutateVoid(`/api/readings/weekday/${id}`, 'PUT', body, 'Error updating weekday reading.');
export const deleteWeekdayReading = (id: number): Promise<void> =>
  del(`/api/readings/weekday/${id}`, 'Error deleting weekday reading.');

// ── hosafot readings ──────────────────────────────────────────────────────────

export const fetchHosafotReadings = (): Promise<RawHosafahRow[]> => getJson('/api/readings/hosafot');

export const postHosafah   = (body: PostHosafahBody): Promise<{ id: number }> =>
  mutateJson('/api/readings/hosafot', 'POST', body, 'Error adding hosafah reading.');
export const putHosafah    = (id: number, body: { date_read: string; note?: string; location?: string }): Promise<void> =>
  mutateVoid(`/api/readings/hosafot/${id}`, 'PUT', body, 'Error updating hosafah reading.');
export const deleteHosafah = (id: number): Promise<void> =>
  del(`/api/readings/hosafot/${id}`, 'Error deleting hosafah reading.');
