import type { MetaResult, RawRow, ReadingRecord, LocationStat, PostReadingBody, PutReadingBody, OccasionRecord, RawOccasionAliyahRow, RawSpecialReadingRow, PostSpecialReadingBody, RawWeekdayAliyahRow, PostWeekdayReadingBody, RawHosafahRow, PostHosafahBody } from '../types/index.js';

export async function fetchCanWrite(): Promise<boolean> {
  return fetch('/api/can-write').then(r => r.json()).then(r => r.canWrite).catch(() => false);
}

export async function fetchMeta(): Promise<MetaResult> {
  return fetch('/api/meta').then(r => r.json());
}

export async function fetchAliyot(): Promise<RawRow[]> {
  return fetch('/api/aliyot').then(r => r.json());
}

export async function fetchReadings(): Promise<ReadingRecord[]> {
  return fetch('/api/readings').then(r => r.json());
}

export async function fetchLocationStats(): Promise<LocationStat[]> {
  return fetch('/api/stats/location').then(r => r.json());
}

export async function fetchHebcal(): Promise<{ schedule: Record<string, string> }> {
  const res = await fetch('/api/hebcal');
  if (!res.ok) return { schedule: {} };
  return res.json();
}

export async function postReading(body: PostReadingBody): Promise<{ id: number; reading_type: string }> {
  const res = await fetch('/api/readings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json().catch(() => ({ detail: 'Error adding reading.' }));
  return res.json();
}

export async function putReading(id: number, body: PutReadingBody): Promise<{ id: number }> {
  const res = await fetch(`/api/readings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json().catch(() => ({ detail: 'Error updating reading.' }));
  return res.json();
}

export async function deleteReading(id: number): Promise<void> {
  const res = await fetch(`/api/readings/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw Object.assign(new Error('Error deleting reading.'), { detail: 'Error deleting reading.' });
}

export async function fetchOccasions(): Promise<OccasionRecord[]> {
  return fetch('/api/occasions').then(r => r.json());
}

export async function fetchOccasionAliyot(): Promise<RawOccasionAliyahRow[]> {
  return fetch('/api/occasion-aliyot').then(r => r.json());
}

export async function fetchSpecialReadings(): Promise<RawSpecialReadingRow[]> {
  return fetch('/api/readings/special').then(r => r.json());
}

export async function postSpecialReading(body: PostSpecialReadingBody): Promise<{ id: number }> {
  const res = await fetch('/api/readings/special', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json().catch(() => ({ detail: 'Error adding special reading.' }));
  return res.json();
}

export async function deleteSpecialReading(id: number): Promise<void> {
  const res = await fetch(`/api/readings/special/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw Object.assign(new Error('Error deleting special reading.'), { detail: 'Error deleting special reading.' });
}

export async function fetchWeekdayAliyot(): Promise<RawWeekdayAliyahRow[]> {
  return fetch('/api/weekday-aliyot').then(r => r.json());
}

export async function postWeekdayReading(body: PostWeekdayReadingBody): Promise<{ id: number }> {
  const res = await fetch('/api/readings/weekday', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json().catch(() => ({ detail: 'Error adding weekday reading.' }));
  return res.json();
}

export async function putWeekdayReading(id: number, body: { date_read: string; note?: string; location?: string }): Promise<void> {
  const res = await fetch(`/api/readings/weekday/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json().catch(() => ({ detail: 'Error updating weekday reading.' }));
}

export async function deleteWeekdayReading(id: number): Promise<void> {
  const res = await fetch(`/api/readings/weekday/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw Object.assign(new Error('Error deleting weekday reading.'), { detail: 'Error deleting weekday reading.' });
}

export async function fetchHosafotReadings(): Promise<RawHosafahRow[]> {
  return fetch('/api/readings/hosafot').then(r => r.json());
}

export async function postHosafah(body: PostHosafahBody): Promise<{ id: number }> {
  const res = await fetch('/api/readings/hosafot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json().catch(() => ({ detail: 'Error adding hosafah reading.' }));
  return res.json();
}

export async function putHosafah(id: number, body: { date_read: string; note?: string; location?: string }): Promise<void> {
  const res = await fetch(`/api/readings/hosafot/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json().catch(() => ({ detail: 'Error updating hosafah reading.' }));
}

export async function deleteHosafah(id: number): Promise<void> {
  const res = await fetch(`/api/readings/hosafot/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw Object.assign(new Error('Error deleting hosafah reading.'), { detail: 'Error deleting hosafah reading.' });
}
