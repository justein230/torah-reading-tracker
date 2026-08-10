import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, type Mock } from 'vitest';
import Forecast from '../../../src/components/Forecast.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER } from '../../helpers/appContextMock.js';
import { makeRow } from '../../helpers/fixtures.js';
import type { Stats } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

const STATS = { specialReadPseukim: 0, specialFuturePseukim: 0, specialTotalPseukim: 0 } as Stats;

describe('Forecast — pace window selection', () => {
  it('clicking a window button updates forecastConfig and clears the pace override', async () => {
    const setForecastConfig = vi.fn();
    (useApp as Mock).mockReturnValue(makeCtx({ stats: STATS, setForecastConfig }));
    renderWithProviders(<Forecast />);
    await userEvent.click(screen.getByRole('button', { name: '3 yr' }));
    expect(setForecastConfig).toHaveBeenCalledWith({ lookbackYears: 3, paceOverride: null });
  });

  it('"All time" window passes lookbackYears: null', async () => {
    const setForecastConfig = vi.fn();
    (useApp as Mock).mockReturnValue(makeCtx({ stats: STATS, setForecastConfig }));
    renderWithProviders(<Forecast />);
    await userEvent.click(screen.getByRole('button', { name: 'All time' }));
    expect(setForecastConfig).toHaveBeenCalledWith({ lookbackYears: null, paceOverride: null });
  });
});

describe('Forecast — pace override input', () => {
  it('sets a positive paceOverride on blur', () => {
    const setForecastConfig = vi.fn();
    (useApp as Mock).mockReturnValue(makeCtx({ stats: STATS, setForecastConfig }));
    renderWithProviders(<Forecast />);
    const input = screen.getByPlaceholderText('e.g. 2000');
    fireEvent.change(input, { target: { value: '1500' } });
    fireEvent.blur(input);
    const [updater] = setForecastConfig.mock.calls[0] as [(c: { lookbackYears: number | null; paceOverride: number | null }) => unknown];
    expect(updater({ lookbackYears: 1, paceOverride: null })).toEqual({ lookbackYears: 1, paceOverride: 1500 });
  });

  it('clears paceOverride when the input is not a positive number', () => {
    const setForecastConfig = vi.fn();
    (useApp as Mock).mockReturnValue(makeCtx({ stats: STATS, setForecastConfig }));
    renderWithProviders(<Forecast />);
    const input = screen.getByPlaceholderText('e.g. 2000');
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.blur(input);
    const [updater] = setForecastConfig.mock.calls[0] as [(c: { lookbackYears: number | null; paceOverride: number | null }) => unknown];
    expect(updater({ lookbackYears: 1, paceOverride: 99 })).toEqual({ lookbackYears: 1, paceOverride: null });
  });
});

describe('Forecast — target-year reverse calculation', () => {
  it('shows the pseukim/yr needed for a valid future target year', async () => {
    const row = makeRow({ sefer: MOCK_SEFER, isRead: true, orig: '2020-01-01', pseukim: 100 });
    const unread = makeRow({ sefer: MOCK_SEFER, isRead: false, orig: '', pseukim: 900 });
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [row, unread], stats: STATS }));
    renderWithProviders(<Forecast />);
    const input = screen.getByPlaceholderText(/^20\d\d$/);
    await userEvent.type(input, '2099');
    expect(screen.getByText(/You'd need [\d,]+ pseukim \/ yr/)).toBeInTheDocument();
  });

  it('clears the result for a year that is not in the future', async () => {
    const row = makeRow({ sefer: MOCK_SEFER, isRead: true, orig: '2020-01-01', pseukim: 100 });
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [row], stats: STATS }));
    renderWithProviders(<Forecast />);
    const input = screen.getByPlaceholderText(/^20\d\d$/);
    await userEvent.type(input, '1999');
    expect(screen.queryByText(/You'd need/)).not.toBeInTheDocument();
  });
});

// Breakdown by book — component is commented out (kept for potential reuse elsewhere).
// describe('Forecast — breakdown by book', () => {
//   it('shows read/total pseukim per sefer and remaining count', () => {
//     const r1 = makeRow({ sefer: MOCK_SEFER, isRead: true, isReadPast: true, orig: '2024-01-01', pseukim: 30 });
//     const r2 = makeRow({ sefer: MOCK_SEFER, isRead: false, orig: '', pseukim: 70 });
//     (useApp as Mock).mockReturnValue(makeCtx({ allRows: [r1, r2], stats: STATS }));
//     renderWithProviders(<Forecast />);
//     expect(screen.getByText('30 / 100')).toBeInTheDocument();
//     expect(screen.getByText('70')).toBeInTheDocument();
//   });
//
//   it('shows ✓ Done when a sefer has no remaining pseukim', () => {
//     const r1 = makeRow({ sefer: MOCK_SEFER, isRead: true, isReadPast: true, orig: '2024-01-01', pseukim: 100 });
//     (useApp as Mock).mockReturnValue(makeCtx({ allRows: [r1], stats: STATS }));
//     renderWithProviders(<Forecast />);
//     // both seferim in SEFER_ORDER have 0 remaining here (the other has no rows at all)
//     expect(screen.getAllByText('✓ Done')).toHaveLength(2);
//   });
// });
