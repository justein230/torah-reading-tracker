import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  fetchCanWrite, fetchAuthStatus, login, logout, changePassword,
  fetchMeta, fetchHebcal, fetchHebcalOnDate,
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

describe('fetchAuthStatus', () => {
  it('maps authMode and insecureConfig from the response body', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ canWrite: true, authMode: 'password', insecureConfig: true })));
    expect(await fetchAuthStatus()).toEqual({ authMode: 'password', insecureConfig: true });
  });

  it('falls back to password/no-insecure-config when the request rejects', async () => {
    mockFetchOnce(() => Promise.reject(new Error('network down')));
    expect(await fetchAuthStatus()).toEqual({ authMode: 'password', insecureConfig: false });
  });
});

describe('login', () => {
  it('returns true when the login request succeeds', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({}, true)));
    expect(await login('secret')).toBe(true);
  });

  it('returns false when the login request fails', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({}, false)));
    expect(await login('wrong')).toBe(false);
  });
});

describe('logout', () => {
  it('POSTs to the logout endpoint', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({})));
    vi.stubGlobal('fetch', fetchMock);
    await logout();
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
  });
});

describe('changePassword', () => {
  it('returns ok:true when the change succeeds', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({}, true)));
    expect(await changePassword('old', 'new')).toEqual({ ok: true });
  });

  it('returns the detail message from the error body when the change fails', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ detail: 'Wrong current password' }, false)));
    expect(await changePassword('old', 'new')).toEqual({ ok: false, error: 'Wrong current password' });
  });

  it('falls back to a default error message when the error body has no detail', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 400, json: () => Promise.reject(new Error('bad json')) } as Response));
    expect(await changePassword('old', 'new')).toEqual({ ok: false, error: 'Could not change password' });
  });
});

describe('plain GET wrappers', () => {
  it.each([
    ['fetchMeta', fetchMeta, { sefarim: [] }],
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
    expect(await (fn as () => Promise<unknown>)()).toEqual(body);
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
    expect(await fetchHebcal()).toEqual({
      schedule: {}, datesByParsha: {}, cacheYears: [0, 0],
      holidayDates: { occasionDates: {}, morningReadingDates: [], noMinchaDates: [] },
    });
  });
});

describe('fetchHebcalOnDate', () => {
  it('returns the parshiot found for the date on success', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ parshiot: ['Bo'] })));
    expect(await fetchHebcalOnDate('2024-01-01')).toEqual({ parshiot: ['Bo'] });
  });

  it('returns an empty result when the response is not ok', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({}, false)));
    expect(await fetchHebcalOnDate('2024-01-01')).toEqual({ parshiot: [] });
  });
});

// ── mutations ─────────────────────────────────────────────────────────────────
// Every write goes through the same send/del helpers, so one table drives them all: what each
// call sends, what it returns on success, and the fallback error it throws when the server's
// reply has no usable JSON body.

const HOSAFAH = { sefer: 'במדבר', chapter_start: 1, verse_start: 1, chapter_end: 1, verse_end: 5, pseukim: 5, date_read: '2024-01-01' };

const mutations = [
  { name: 'postReading',          call: () => postReading({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' }), method: 'POST', path: '/api/readings',
    reply: { id: 1, reading_type: 'standard' }, fallback: 'Error adding reading.' },
  { name: 'putReading',           call: () => putReading(1, { location: 'Shul' }), method: 'PUT', path: '/api/readings/1',
    reply: { id: 1 }, fallback: 'Error updating reading.' },
  { name: 'postSpecialReading',   call: () => postSpecialReading({ occasion_aliyah_id: 1, date_read: '2024-01-01' }), method: 'POST', path: '/api/readings/special',
    reply: { id: 9 }, fallback: 'Error adding special reading.' },
  { name: 'postWeekdayReading',   call: () => postWeekdayReading({ weekday_aliyah_id: 1, date_read: '2024-01-01' }), method: 'POST', path: '/api/readings/weekday',
    reply: { id: 5 }, fallback: 'Error adding weekday reading.' },
  { name: 'postHosafah',          call: () => postHosafah(HOSAFAH), method: 'POST', path: '/api/readings/hosafot',
    reply: { id: 7 }, fallback: 'Error adding hosafah reading.' },
  // These two return nothing on success.
  { name: 'putWeekdayReading',    call: () => putWeekdayReading(1, { date_read: '2024-01-01' }), method: 'PUT', path: '/api/readings/weekday/1',
    reply: undefined, fallback: 'Error updating weekday reading.' },
  { name: 'putHosafah',           call: () => putHosafah(1, { date_read: '2024-01-01' }), method: 'PUT', path: '/api/readings/hosafot/1',
    reply: undefined, fallback: 'Error updating hosafah reading.' },
];

describe.each(mutations)('$name', ({ call, method, path, reply, fallback }) => {
  it(`sends ${method} ${path} and returns the reply`, async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse(reply ?? {})));
    vi.stubGlobal('fetch', fetchMock);
    expect(await call()).toEqual(reply);
    expect(fetchMock).toHaveBeenCalledWith(path, expect.objectContaining({ method }));
  });

  it('throws the server’s error detail when the response is not ok', async () => {
    mockFetchOnce(() => Promise.resolve(jsonResponse({ detail: 'Nope.' }, false)));
    await expect(call()).rejects.toEqual({ detail: 'Nope.' });
  });

  it('throws its own fallback message when the error body is not JSON', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error('bad json')) } as Response));
    await expect(call()).rejects.toEqual({ detail: fallback });
  });
});

const deletions = [
  { name: 'deleteReading',        call: () => deleteReading(1),        path: '/api/readings/1',          fallback: 'Error deleting reading.' },
  { name: 'deleteSpecialReading', call: () => deleteSpecialReading(1), path: '/api/readings/special/1',  fallback: 'Error deleting special reading.' },
  { name: 'deleteWeekdayReading', call: () => deleteWeekdayReading(1), path: '/api/readings/weekday/1',  fallback: 'Error deleting weekday reading.' },
  { name: 'deleteHosafah',        call: () => deleteHosafah(1),        path: '/api/readings/hosafot/1',  fallback: 'Error deleting hosafah reading.' },
];

describe.each(deletions)('$name', ({ call, path, fallback }) => {
  it.each([200, 204])('DELETEs %i and resolves', async status => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, status } as Response));
    vi.stubGlobal('fetch', fetchMock);
    await expect(call()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(path, { method: 'DELETE' });
  });

  it('throws its own message when the response is not ok', async () => {
    mockFetchOnce(() => Promise.resolve({ ok: false, status: 404 } as Response));
    await expect(call()).rejects.toMatchObject({ detail: fallback });
  });
});

describe('mutation logging', () => {
  // web.ts's logEvent (default, non-debug settings) writes via console.* — see
  // src/utils/logger-client/web.ts. A successful mutation logs at info, a failed one at warn;
  // both go through send/del, so postReading/deleteReading stand in for every write in the app.
  afterEach(() => { vi.restoreAllMocks(); });

  it('logs at info on a successful mutation', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    mockFetchOnce(() => Promise.resolve(jsonResponse({ id: 1, reading_type: 'standard' })));
    await postReading({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' });
    expect(info).toHaveBeenCalledWith(expect.stringContaining('POST /api/readings ok'), expect.anything());
  });

  it('logs at warn on a failed mutation and on a failed delete', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFetchOnce(() => Promise.resolve(jsonResponse({ detail: 'Aliyah already read.' }, false)));
    await postReading({ parsha: 'בראשית', aliyah: 1, date_read: '2024-01-01' }).catch(() => {});
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('POST /api/readings failed'), expect.anything());

    mockFetchOnce(() => Promise.resolve({ ok: false, status: 404 } as Response));
    await deleteReading(999).catch(() => {});
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('DELETE /api/readings/999 failed'), expect.anything());
  });
});
