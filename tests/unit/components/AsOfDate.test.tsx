import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, type Mock } from 'vitest';
import AsOfDate from '../../../src/components/AsOfDate.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER, MOCK_PARSHA } from '../../helpers/appContextMock.js';
import { makeRow } from '../../helpers/fixtures.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

const SEFER_ORDER = [MOCK_SEFER];
const SEFER_MAP = { [MOCK_SEFER]: { en: 'Genesis', color: '#4a7c59', chapterVerses: [] } };
const FILTERS = { sefarim: [], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false };

function nextYearDateStr(): string {
  return `${new Date().getFullYear() + 1}-01-01`;
}

describe('AsOfDate', () => {
  it('starts collapsed with no calendar visible', () => {
    (useApp as Mock).mockReturnValue(makeCtx({ SEFER_ORDER, SEFER_MAP, filters: FILTERS }));
    renderWithProviders(<AsOfDate />);
    expect(screen.queryByText(/pseukim/)).not.toBeInTheDocument();
    expect(screen.getByText('% Complete As Of Date')).toBeInTheDocument();
  });

  it('expands on click and shows the completion percentage as of the picked date', async () => {
    const includedRow = makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 1, pseukim: 50,
      chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 50,
      isRead: true, isReadPast: true, orig: '2020-01-01', yearRead: 2020, allYears: [2020],
    });
    const excludedRow = makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 2, pseukim: 50,
      chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 50,
      isRead: true, isReadFuture: true, orig: nextYearDateStr(), yearRead: new Date().getFullYear() + 1, allYears: [new Date().getFullYear() + 1],
    });
    const allRows = [includedRow, excludedRow];

    (useApp as Mock).mockReturnValue(makeCtx({ allRows, SEFER_ORDER, SEFER_MAP, filters: FILTERS }));
    renderWithProviders(<AsOfDate />);

    await userEvent.click(screen.getByText('% Complete As Of Date'));

    // Pick the 1st of the currently-displayed (real) month — always <= today, and both rows
    // above are dated either well before or well after it, so the split is unambiguous.
    const day1Buttons = screen.getAllByText('1', { selector: 'button' });
    const day1 = day1Buttons.find(b => !b.hasAttribute('data-outside'));
    expect(day1).toBeDefined();
    await userEvent.click(day1 as HTMLElement);

    expect(await screen.findByText('50.00% pseukim')).toBeInTheDocument();
    expect(screen.getByText('50.00% aliyot')).toBeInTheDocument();
  });
});
