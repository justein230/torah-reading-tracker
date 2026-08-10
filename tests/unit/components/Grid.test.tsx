import { vi, type Mock } from 'vitest';
import Grid from '../../../src/components/Grid.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER, MOCK_PARSHA } from '../../helpers/appContextMock.js';
import { makeRow } from '../../helpers/fixtures.js';
import type { Stats } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

const SEFER_COLOR_RGB = 'rgb(74, 124, 89)';

function makeStats(overrides: Partial<Stats['bySefer'][string]> = {}): Stats {
  const bs = { totalAliyot: 1, readAliyot: 0, totalPseukim: 0, readPseukim: 0, readPct: 0, rereadCount: 0, committedAliyot: 0, committedPseukim: 0, specialReadPseukim: 0, specialFuturePseukim: 0, ...overrides };
  return {
    totalAliyot: 1, totalPseukim: 0, readAliyot: 0, readPseukim: 0, readPct: 0, rereadCount: 0,
    committedAliyot: 0, committedPseukim: 0, committedPct: 0,
    bySefer: { [MOCK_SEFER]: bs, 'שְׁמוֹת': bs },
    byYear: {}, byYearFuture: {}, filteredRows: [],
    specialReadPseukim: 0, specialFuturePseukim: 0, specialTotalPseukim: 0,
  };
}

function getCells(container: HTMLElement) {
  return Array.from(container.querySelectorAll('.acell')) as HTMLElement[];
}

describe('Grid — renders nothing without stats', () => {
  it('returns null when stats is null', () => {
    (useApp as Mock).mockReturnValue(makeCtx({ stats: null }));
    const { container } = renderWithProviders(<Grid />);
    expect(container.querySelector('.sefer-grid')).not.toBeInTheDocument();
  });
});

describe('Grid — cell colors via cellStyle', () => {
  it('past-read aliyah with no year filter gets full sefer color', () => {
    const row = makeRow({ sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 1, isRead: true, isReadPast: true, orig: '2024-01-01', yearRead: 2024 });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [row], stats: makeStats(), parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<Grid />);
    const cell = getCells(container)[0]!;
    expect(cell.style.background).toBe(SEFER_COLOR_RGB);
  });

  it('past-read aliyah not matching the active year filter gets a hatch pattern (distinct border alpha)', () => {
    // jsdom can't parse the repeating-linear-gradient background value, but the
    // border color is unique to this branch (color + '88' alpha vs. solid color elsewhere).
    const row = makeRow({ sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 1, isRead: true, isReadPast: true, orig: '2024-01-01', yearRead: 2024 });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [row], stats: makeStats(), parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
      filters: { sefarim: [], years: [2099], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false },
    }));
    const { container } = renderWithProviders(<Grid />);
    const cell = getCells(container)[0]!;
    expect(cell.style.borderColor).toBe('rgba(74, 124, 89, 0.533)');
  });

  it('future-scheduled aliyah gets a dashed border', () => {
    const row = makeRow({ sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 1, isRead: true, isReadFuture: true });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [row], stats: makeStats(), parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<Grid />);
    const cell = getCells(container)[0]!;
    expect(cell).toHaveClass('dashed');
  });

  it('aliyah excluded by the sefer filter is dimmed regardless of read state', () => {
    const row = makeRow({ sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 1, isRead: true, isReadPast: true, orig: '2024-01-01' });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [row], stats: makeStats(), parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
      filters: { sefarim: ['שְׁמוֹת'], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false },
    }));
    const { container } = renderWithProviders(<Grid />);
    const cell = getCells(container)[0]!;
    expect(cell.style.background).toBe('var(--surface)');
  });

  it('read aliyah with a future re-read shows the reread dot', () => {
    const row = makeRow({ sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 1, isRead: true, isReadPast: true, hasFuture: true, orig: '2024-01-01' });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [row], stats: makeStats(), parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<Grid />);
    expect(container.querySelector('.acell .reread-dot')).toBeInTheDocument();
  });
});

describe('Grid — sefer header stats', () => {
  it('shows read/total aliyot and percentage for each sefer', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [], stats: makeStats({ totalAliyot: 4, readAliyot: 1 }), parshaIndex: {},
    }));
    const { container } = renderWithProviders(<Grid />);
    const badge = container.querySelector('.badge');
    expect(badge?.textContent).toContain('1/4 Aliyot');
    expect(badge?.textContent).toContain('25.00%');
  });

  it('dims the whole sefer section when the sefer is excluded by filters', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [], stats: makeStats(), parshaIndex: {},
      filters: { sefarim: ['שְׁמוֹת'], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false },
    }));
    const { container } = renderWithProviders(<Grid />);
    const sections = container.querySelectorAll('.sefer-section');
    const genesisSection = Array.from(sections).find(s => s.textContent?.includes(MOCK_SEFER));
    expect((genesisSection as HTMLElement).style.opacity).toBe('0.3');
  });
});
