import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { makeCtx } from '../../helpers/appContextMock.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

const fetchHebcalOnDate = vi.fn();
vi.mock('../../../src/api.js', () => ({ fetchHebcalOnDate: (date: string) => fetchHebcalOnDate(date) }));

import { useParshaForDate } from '../../../src/hooks/useParshaForDate.js';

const mockUseApp = useApp as unknown as ReturnType<typeof vi.fn>;

function setCtx(overrides: Parameters<typeof makeCtx>[0] = {}) {
  mockUseApp.mockReturnValue(makeCtx({
    datesByParsha: { Bereshit: ['2026-01-03', '2011-01-01'] },
    cacheYears: [1990, 2050],
    settings: { liveHebcalLookups: false },
    ...overrides,
  }));
}

describe('useParshaForDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchHebcalOnDate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves in-range dates synchronously from datesByParsha', () => {
    setCtx();
    const { result } = renderHook(() => useParshaForDate('2011-01-01'));
    expect(result.current).toEqual({ status: 'in-range', parshiot: ['Bereshit'] });
  });

  it('resolves an in-range date with no match to an empty parshiot list', () => {
    setCtx();
    const { result } = renderHook(() => useParshaForDate('2026-06-01'));
    expect(result.current).toEqual({ status: 'in-range', parshiot: [] });
  });

  it('reports live-disabled for an out-of-range date when the setting is off', () => {
    setCtx({ settings: { liveHebcalLookups: false } });
    const { result } = renderHook(() => useParshaForDate('1950-01-01'));
    expect(result.current).toEqual({ status: 'live-disabled', parshiot: [] });
  });

  it('debounces then resolves a live lookup for an out-of-range date when the setting is on', async () => {
    setCtx({ settings: { liveHebcalLookups: true } });
    fetchHebcalOnDate.mockResolvedValue({ parshiot: ['Vayigash'] });

    const { result } = renderHook(() => useParshaForDate('1950-01-01'));
    expect(result.current.status).toBe('live-pending');
    expect(fetchHebcalOnDate).not.toHaveBeenCalled();

    await act(async () => { vi.advanceTimersByTime(400); await Promise.resolve(); await Promise.resolve(); });

    expect(fetchHebcalOnDate).toHaveBeenCalledWith('1950-01-01');
    expect(result.current).toEqual({ status: 'live', parshiot: ['Vayigash'] });
  });

  it('discards a stale in-flight request when the date changes before it resolves', async () => {
    setCtx({ settings: { liveHebcalLookups: true } });
    let resolveFirst: (v: { parshiot: string[] }) => void = () => {};
    fetchHebcalOnDate.mockImplementationOnce(() => new Promise(r => { resolveFirst = r; }));
    fetchHebcalOnDate.mockResolvedValueOnce({ parshiot: ['Second'] });

    const { result, rerender } = renderHook(({ date }) => useParshaForDate(date), {
      initialProps: { date: '1950-01-01' },
    });
    await act(async () => { vi.advanceTimersByTime(400); });

    rerender({ date: '1951-01-01' });
    await act(async () => { vi.advanceTimersByTime(400); await Promise.resolve(); await Promise.resolve(); });
    expect(result.current).toEqual({ status: 'live', parshiot: ['Second'] });

    // The first (stale) request resolving afterward must not overwrite the second's result.
    await act(async () => { resolveFirst({ parshiot: ['First'] }); await Promise.resolve(); });
    expect(result.current).toEqual({ status: 'live', parshiot: ['Second'] });
  });
});
