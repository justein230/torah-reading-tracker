import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, type Mock } from 'vitest';
import HolidayGrid from '../../../src/components/HolidayGrid.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx } from '../../helpers/appContextMock.js';
import { makeOA } from '../../helpers/fixtures.js';
import type { OccasionRecord } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

const PESACH: OccasionRecord = { id: 1, name: 'פֶּסַח', nameEn: 'Pesach', category: 'yom_tov', sortOrder: 1 };
const CHANUKAH: OccasionRecord = { id: 2, name: 'חֲנֻכָּה', nameEn: 'Chanukah', category: 'chanukah', sortOrder: 2 };

function getCells(container: HTMLElement) {
  return Array.from(container.querySelectorAll('.acell')) as HTMLElement[];
}

describe('HolidayGrid — category grouping', () => {
  it('only shows categories that have occasion aliyot for the current shabbat mode', () => {
    const oa = makeOA({ occasionId: 1, aliyahKey: '1', isShabbatVariant: false });
    (useApp as Mock).mockReturnValue(makeCtx({ occasions: [PESACH, CHANUKAH], occasionAliyot: [oa] }));
    renderWithProviders(<HolidayGrid />);
    expect(screen.getByText('Yamim Tovim')).toBeInTheDocument();
    expect(screen.queryByText('Chanukah')).not.toBeInTheDocument();
  });

  it('shows read/total aliyot count per category', () => {
    const oa1 = makeOA({ occasionId: 1, aliyahKey: '1', isShabbatVariant: false, isReadPast: true });
    const oa2 = makeOA({ occasionId: 1, aliyahKey: '2', isShabbatVariant: false, isReadPast: false, isRead: false });
    (useApp as Mock).mockReturnValue(makeCtx({ occasions: [PESACH], occasionAliyot: [oa1, oa2] }));
    renderWithProviders(<HolidayGrid />);
    expect(screen.getByText(/1\/2 Aliyot/)).toBeInTheDocument();
  });

  it('hides an occasion row entirely when it has no occasion aliyot at all', () => {
    const SUKKOT: OccasionRecord = { id: 3, name: 'סֻכּוֹת', nameEn: 'Sukkot', category: 'yom_tov', sortOrder: 3 };
    const oa = makeOA({ occasionId: 1, aliyahKey: '1', isShabbatVariant: false });
    (useApp as Mock).mockReturnValue(makeCtx({ occasions: [PESACH, SUKKOT], occasionAliyot: [oa] }));
    renderWithProviders(<HolidayGrid />);
    expect(screen.getByText('Pesach')).toBeInTheDocument();
    expect(screen.queryByText('Sukkot')).not.toBeInTheDocument();
  });
});

describe('HolidayGrid — cell rendering', () => {
  it('past-read occasion aliyah gets the category color background (wiring smoke test)', () => {
    const oa = makeOA({ occasionId: 1, aliyahKey: '1', isShabbatVariant: false, isReadPast: true });
    (useApp as Mock).mockReturnValue(makeCtx({ occasions: [PESACH], occasionAliyot: [oa] }));
    const { container } = renderWithProviders(<HolidayGrid />);
    const cell = getCells(container)[0]!;
    expect(cell.style.background).toBe('rgb(124, 58, 237)');
  });

  it('future-scheduled occasion aliyah gets a dashed border (wiring smoke test)', () => {
    const oa = makeOA({ occasionId: 1, aliyahKey: '1', isShabbatVariant: false, isReadPast: false, isReadFuture: true });
    (useApp as Mock).mockReturnValue(makeCtx({ occasions: [PESACH], occasionAliyot: [oa] }));
    const { container } = renderWithProviders(<HolidayGrid />);
    const cell = getCells(container)[0]!;
    expect(cell).toHaveClass('dashed');
  });

  it('shows the reread dot when a past-read aliyah has a scheduled future re-read', () => {
    const oa = makeOA({ occasionId: 1, aliyahKey: '1', isShabbatVariant: false, isReadPast: true, hasFuture: true });
    (useApp as Mock).mockReturnValue(makeCtx({ occasions: [PESACH], occasionAliyot: [oa] }));
    const { container } = renderWithProviders(<HolidayGrid />);
    expect(container.querySelector('.acell .reread-dot')).toBeInTheDocument();
  });
});

describe('HolidayGrid — Shabbat mode toggle', () => {
  it('shows weekday occasion aliyot by default', () => {
    const weekday = makeOA({ occasionId: 1, aliyahKey: '1', isShabbatVariant: false, isReadPast: true });
    const shabbat = makeOA({ occasionId: 1, aliyahKey: '1', isShabbatVariant: true, isReadPast: false, isRead: false });
    (useApp as Mock).mockReturnValue(makeCtx({ occasions: [PESACH], occasionAliyot: [weekday, shabbat] }));
    const { container } = renderWithProviders(<HolidayGrid />);
    expect(getCells(container)[0]!.style.background).toBe('rgb(124, 58, 237)');
  });

  it('switches to Shabbat occasion aliyot when the toggle is checked', async () => {
    const weekday = makeOA({ occasionId: 1, aliyahKey: '1', isShabbatVariant: false, isReadPast: true });
    const shabbat = makeOA({ occasionId: 1, aliyahKey: '1', isShabbatVariant: true, isReadPast: false, isRead: false });
    (useApp as Mock).mockReturnValue(makeCtx({ occasions: [PESACH], occasionAliyot: [weekday, shabbat] }));
    const { container } = renderWithProviders(<HolidayGrid />);
    await userEvent.click(screen.getByRole('switch', { name: 'Shabbat reading' }));
    expect(screen.getByText('Showing expanded Shabbat aliyot (7+M) where available')).toBeInTheDocument();
    expect(getCells(container)[0]!.style.background).toBe('var(--cell-unread)');
  });
});
