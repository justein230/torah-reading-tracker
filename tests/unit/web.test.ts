import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  fetchCanWrite, fetchMeta, fetchHebcal,
  fetchAliyot, fetchReadings, fetchLocationStats,
  postReading, putReading, deleteReading,
  fetchOccasions, fetchOccasionAliyot, fetchSpecialReadings,
  postSpecialReading, deleteSpecialReading,
  fetchWeekdayAliyot, postWeekdayReading, putWeekdayReading, deleteWeekdayReading,
  fetchHosafotReadings, postHosafah, putHosafah, deleteHosafah,
} from '../../src/db/web.js';

function mockFetchOnce(impl: (...args: Parameters<typeof fetch>) => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 400): Response {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

afterEach(() => { vi.unstubAllGlobals(); });

// ── plain GET wrappers ────────────────────────────────────────────────────────

describe('fetchCanWrite', () => {
  it('returns canWrite from the response body', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ canWrite: true })));
    expect(await fetchCanWrite()).toBe(true);
  });

  it('falls back to false when the request rejects', async () => {
    mockFetchOnce(() => Promise.reject(new Error('network down')));
    expect(await fetchCanWrite()).toBe(false);
  });
});

describe('fetchMeta', () => {
  it('returns the parsed JSON body', async () => {
    const meta = { sefarim: [] };
    mockFetchOnce(() => Promise.resolve(jsonResponse(meta)));
    expect(await fetchMeta()).toEqual(meta);
  });
});

describe('plain GET wrappers', () => {
  it.each([
    ['fetchAliyot', fetchAliyot, [{ sefer: 'a' }]],
    ['fetchReadings', fetchReadings, [{ id: 1 }]],
    ['fetchLocationStats', fetchLocationStats, [{ location: 'Shul', count: 1 }]],
    ['fetchOccasions', fetchOccasions, [{ id: 1 }]],
    ['fetchOccasionAliyot', fetchOccasionAliyot, [{ id: 1 }]],
    ['fetchSpecialReadings', fetchSpecialReadings, [{ id: 1 }]],
    ['fetchWeekdayAliyot', fetchWeekdayAliyot, [{ id: 1 }]],
    ['fetchHosafotReadings', fetchHosafotReadings, [{ id: 1 }]],
  ] as const)('%s returns the parsed JSON body', async (_name, fn, body) => {
    mockFetchOnce(() => Promise.resolve(jsonResponse(body)));
    expect(await fn()).toEqual(body);
  });
});

// ── fetchHebcal — special !res.ok fallback ────────────────────────────────────

describe('fetchHebcal', () => {
  it('returns the parsed schedule on success', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ schedule: { '2024-01-01': 'Bo' } })));
    expect(await fetchHebcal()).toEqual({ schedule: { '2024-01-01': 'Bo' } });
  });

  it('returns an empty schedule when the response is not ok', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({}, false)));
    expect(await fetchHebcal()).toEqual({ schedule: {} });
  });
});

// ── POST wrappers — success / error-with-detail / error-without-body ─────────

describe('postReading', () => {
  it('returns the created id and reading_type on success', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ id: 1, reading_type: 'standard' })));
    const result = await postReading({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    expect(result).toEqual({ id: 1, reading_type: 'standard' });
  });

  it('throws the error body detail when the response is not ok', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ detail: 'Aliyah already read.' }, false)));
    await expect(postReading({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' }))
      .rejects.toEqual({ detail: 'Aliyah already read.' });
  });

  it('falls back to a default error message when the error body has no JSON', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error('bad json')) } as Response));
    await expect(postReading({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' }))
      .rejects.toEqual({ detail: 'Error adding reading.' });
  });
});

describe('postSpecialReading / postWeekdayReading / postHosafah', () => {
  it('postSpecialReading returns id on success', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ id: 9 })));
    expect(await postSpecialReading({ occasion_aliyah_id: 1, date_read: '2024-01-01' })).toEqual({ id: 9 });
  });

  it('postSpecialReading falls back to its own default error message', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error('x')) } as Response));
    await expect(postSpecialReading({ occasion_aliyah_id: 1, date_read: '2024-01-01' }))
      .rejects.toEqual({ detail: 'Error adding special reading.' });
  });

  it('postWeekdayReading returns id on success', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ id: 5 })));
    expect(await postWeekdayReading({ weekday_aliyah_id: 1, date_read: '2024-01-01' })).toEqual({ id: 5 });
  });

  it('postWeekdayReading falls back to its own default error message', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error('x')) } as Response));
    await expect(postWeekdayReading({ weekday_aliyah_id: 1, date_read: '2024-01-01' }))
      .rejects.toEqual({ detail: 'Error adding weekday reading.' });
  });

  it('postHosafah returns id on success', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ id: 7 })));
    expect(await postHosafah({
      sefer: 'במדבר', chapter_start: 1, verse_start: 1, chapter_end: 1, verse_end: 5, pseukim: 5, date_read: '2024-01-01',
    })).toEqual({ id: 7 });
  });

  it('postHosafah falls back to its own default error message', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error('x')) } as Response));
    await expect(postHosafah({
      sefer: 'במדבר', chapter_start: 1, verse_start: 1, chapter_end: 1, verse_end: 5, pseukim: 5, date_read: '2024-01-01',
    })).rejects.toEqual({ detail: 'Error adding hosafah reading.' });
  });
});

// ── PUT wrappers ───────────────────────────────────────────────────────────────

describe('putReading / putWeekdayReading / putHosafah', () => {
  it('putReading returns the body on success', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ id: 1 })));
    expect(await putReading(1, { location: 'Shul' })).toEqual({ id: 1 });
  });

  it('putWeekdayReading throws the error detail on failure', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ detail: 'Not found.' }, false)));
    await expect(putWeekdayReading(1, { date_read: '2024-01-01' })).rejects.toEqual({ detail: 'Not found.' });
  });

  it('putHosafah resolves without a body on success', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({})));
    await expect(putHosafah(1, { date_read: '2024-01-01' })).resolves.toBeUndefined();
  });
});

// ── DELETE wrappers — 204, ok, and error paths ───────────────────────────────

describe('deleteReading / deleteSpecialReading / deleteWeekdayReading / deleteHosafah', () => {
  it('deleteReading resolves on 204', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 204 } as Response));
    await expect(deleteReading(1)).resolves.toBeUndefined();
  });

  it('deleteReading resolves when ok', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: true, status: 200 } as Response));
    await expect(deleteReading(1)).resolves.toBeUndefined();
  });

  it('deleteReading throws when neither ok nor 204', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 404 } as Response));
    await expect(deleteReading(1)).rejects.toMatchObject({ detail: 'Error deleting reading.' });
  });

  it('deleteSpecialReading throws its own message on failure', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 404 } as Response));
    await expect(deleteSpecialReading(1)).rejects.toMatchObject({ detail: 'Error deleting special reading.' });
  });

  it('deleteWeekdayReading resolves on 204', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 204 } as Response));
    await expect(deleteWeekdayReading(1)).resolves.toBeUndefined();
  });

  it('deleteWeekdayReading throws its own message on failure', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 404 } as Response));
    await expect(deleteWeekdayReading(1)).rejects.toMatchObject({ detail: 'Error deleting weekday reading.' });
  });

  it('deleteHosafah throws its own message on failure', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 404 } as Response));
    await expect(deleteHosafah(1)).rejects.toMatchObject({ detail: 'Error deleting hosafah reading.' });
  });
});

describe('putWeekdayReading / putHosafah — error path', () => {
  it('putWeekdayReading throws its own message on failure', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error('x')) } as Response));
    await expect(putWeekdayReading(1, { date_read: '2024-01-01' })).rejects.toEqual({ detail: 'Error updating weekday reading.' });
  });

  it('putHosafah throws its own message on failure', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error('x')) } as Response));
    await expect(putHosafah(1, { date_read: '2024-01-01' })).rejects.toEqual({ detail: 'Error updating hosafah reading.' });
  });
});
