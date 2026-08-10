import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../../../src/api.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/api.js')>('../../../src/api.js');
  return {
    ...actual,
    fetchMeta: vi.fn(),
    fetchAliyot: vi.fn(),
    fetchHebcal: vi.fn(),
    fetchOccasions: vi.fn(),
    fetchOccasionAliyot: vi.fn(),
    fetchSpecialReadings: vi.fn(),
    fetchWeekdayAliyot: vi.fn(),
  };
});
vi.mock('../../../src/db/web.js', async () => {
  const actual = await vi.importActual<typeof import('../../../src/db/web.js')>('../../../src/db/web.js');
  return { ...actual, fetchHosafotReadings: vi.fn() };
});

import { AppProvider, useApp } from '../../../src/context/AppContext.js';
import * as api from '../../../src/api.js';
import { fetchHosafotReadings } from '../../../src/db/web.js';
import type { Mock } from 'vitest';

const META = {
  sefarim: [{ name: 'בְּרֵאשִׁית', name_en: 'Genesis', color: '#4a7c59', chapter_verses: [31, 25] }],
  parshiot: [{ id: 1, name: 'בְּרֵאשִׁית', name_en: 'Bereishit' }],
  pairs: [],
};

const RAW_ROW = {
  sefer: 'בְּרֵאשִׁית', parsha: 'בְּרֵאשִׁית', aliyah: 1, pseukim: 10, pct: 1,
  orig: '2024-01-01', fut: '2099-01-01', occasion: '', location: '', reread_count: 0,
};

beforeEach(() => { vi.clearAllMocks(); });

function mockFetches(overrides: Partial<{ aliyot: unknown[] }> = {}) {
  (api.fetchMeta as Mock).mockResolvedValue(META);
  (api.fetchAliyot as Mock).mockResolvedValue(overrides.aliyot ?? [RAW_ROW]);
  (api.fetchHebcal as Mock).mockResolvedValue({ schedule: {} });
  (api.fetchOccasions as Mock).mockResolvedValue([]);
  (api.fetchOccasionAliyot as Mock).mockResolvedValue([]);
  (api.fetchSpecialReadings as Mock).mockResolvedValue([]);
  (api.fetchWeekdayAliyot as Mock).mockResolvedValue([]);
  (fetchHosafotReadings as Mock).mockResolvedValue([]);
}

function Probe() {
  const ctx = useApp();
  return (
    <div>
      <div data-testid="ready">{String(ctx.ready)}</div>
      <div data-testid="sefer-order">{ctx.SEFER_ORDER.join(',')}</div>
      <div data-testid="parsha-index">{JSON.stringify(ctx.parshaIndex)}</div>
      <div data-testid="all-years">{ctx.allYears.join(',')}</div>
      <div data-testid="stats">{ctx.stats ? 'has-stats' : 'no-stats'}</div>
      <button onClick={() => { ctx.refresh().catch(() => {}); }}>refresh</button>
    </div>
  );
}

describe('AppProvider — initial load', () => {
  it('builds SEFER_ORDER, parshaIndex, and flips ready once meta + aliyot resolve', async () => {
    mockFetches();
    render(<AppProvider><Probe /></AppProvider>);
    expect(screen.getByTestId('ready').textContent).toBe('false');
    await screen.findByText('true');
    expect(screen.getByTestId('sefer-order').textContent).toBe('בְּרֵאשִׁית');
    expect(screen.getByTestId('parsha-index').textContent).toBe('{"בְּרֵאשִׁית":["בְּרֵאשִׁית"]}');
  });

  it('computes stats once ready', async () => {
    mockFetches();
    render(<AppProvider><Probe /></AppProvider>);
    expect(screen.getByTestId('stats').textContent).toBe('no-stats');
    await screen.findByText('has-stats');
  });

  it('builds allYears from yearRead and futureYear, deduplicated and sorted', async () => {
    // mid-year dates avoid timezone year-boundary shifts (see mapRow.test.ts)
    mockFetches({
      aliyot: [
        { ...RAW_ROW, parsha: 'בְּרֵאשִׁית', orig: '2023-06-15', fut: '' },
        { ...RAW_ROW, aliyah: 2, orig: '2021-06-15', fut: '2023-06-15' },
      ],
    });
    render(<AppProvider><Probe /></AppProvider>);
    await screen.findByText('true');
    expect(screen.getByTestId('all-years').textContent).toBe('2021,2023');
  });
});

describe('AppProvider — refresh', () => {
  it('refetches aliyot and reflects updated data', async () => {
    mockFetches();
    render(<AppProvider><Probe /></AppProvider>);
    await screen.findByText('true');

    (api.fetchAliyot as Mock).mockResolvedValue([{ ...RAW_ROW, orig: '2025-12-31' }]);
    fireEvent.click(screen.getByText('refresh'));

    await screen.findByText('has-stats'); // still has-stats after refresh resolves
    expect(api.fetchAliyot).toHaveBeenCalledTimes(2);
  });
});

function Bare() { useApp(); return null; }

describe('useApp — outside provider', () => {
  it('throws when called without an AppProvider ancestor', () => {
    expect(() => render(<Bare />)).toThrow('useApp must be used within AppProvider');
  });
});
