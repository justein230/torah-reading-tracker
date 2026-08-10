import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, type Mock } from 'vitest';
import Details from '../../../src/components/Details.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER, MOCK_PARSHA } from '../../helpers/appContextMock.js';
import { makeRow } from '../../helpers/fixtures.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

function rowsFor(parsha: string, sefer: string) {
  return Array.from({ length: 7 }, (_, i) => makeRow({
    sefer, parsha, aliyah: i + 1, pseukim: 10, pct: 1,
    isRead: i === 0, isReadPast: i === 0, orig: i === 0 ? '2024-01-01' : '', yearRead: i === 0 ? 2024 : null,
  }));
}

describe('Details — table renders parsha rows', () => {
  it('renders a row per parsha with sefer English name', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: rowsFor(MOCK_PARSHA, MOCK_SEFER),
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    renderWithProviders(<Details />);
    expect(screen.getByText(MOCK_PARSHA)).toBeInTheDocument();
    expect(screen.getByText('Genesis')).toBeInTheDocument();
  });

  it('dims a parsha row when its sefer is excluded by filters', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: rowsFor(MOCK_PARSHA, MOCK_SEFER),
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
      filters: { sefarim: ['שְׁמוֹת'], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false },
    }));
    const { container } = renderWithProviders(<Details />);
    const row = container.querySelector('tbody tr');
    expect((row as HTMLElement).style.opacity).toBe('0.35');
  });

  it('shows a partial-read suffix when a parsha has a partially-read aliyah', () => {
    const rows = rowsFor(MOCK_PARSHA, MOCK_SEFER);
    rows[1] = { ...rows[1]!, partialOrig: '2024-02-01', isReadPast: false };
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: rows,
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    renderWithProviders(<Details />);
    expect(screen.getByText('1/7 (+1p)')).toBeInTheDocument();
  });

  it('shows — for last/next reading dates when none exist', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: rowsFor(MOCK_PARSHA, MOCK_SEFER).map(r => ({ ...r, isRead: false, isReadPast: false, orig: '', yearRead: null })),
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<Details />);
    const cells = container.querySelectorAll('td.td-sm');
    expect(cells[0]?.textContent).toBe('—');
    expect(cells[1]?.textContent).toBe('—');
  });
});

describe('Details — sort buttons', () => {
  it('changing sort calls setSortMode with the selected value', async () => {
    const setSortMode = vi.fn();
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: rowsFor(MOCK_PARSHA, MOCK_SEFER),
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
      setSortMode,
    }));
    renderWithProviders(<Details />);
    await userEvent.click(screen.getByRole('button', { name: 'Most Recent' }));
    expect(setSortMode).toHaveBeenCalledWith('recent');
  });
});

describe('Details — aliyah dots', () => {
  it('renders 8 dots per row (7 aliyot + maftir)', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: rowsFor(MOCK_PARSHA, MOCK_SEFER),
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<Details />);
    expect(container.querySelectorAll('.dot')).toHaveLength(8);
  });

  it('a read aliyah dot gets the sefer color background', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: rowsFor(MOCK_PARSHA, MOCK_SEFER),
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<Details />);
    const firstDot = container.querySelectorAll('.dot')[0] as HTMLElement;
    expect(firstDot.style.background).toBe('rgb(74, 124, 89)');
  });

  it('an unread aliyah dot gets the surface background', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: rowsFor(MOCK_PARSHA, MOCK_SEFER),
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<Details />);
    const secondDot = container.querySelectorAll('.dot')[1] as HTMLElement;
    expect(secondDot.style.background).toBe('var(--surface)');
  });
});
