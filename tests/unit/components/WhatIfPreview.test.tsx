import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, type Mock } from 'vitest';
import { WhatIfPreview, buildAliyahOptions } from '../../../src/components/WhatIfPreview.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER, MOCK_PARSHA } from '../../helpers/appContextMock.js';
import { makeRow, makeOA } from '../../helpers/fixtures.js';
import { computeStats } from '../../../src/compute.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

const SEFER_ORDER = [MOCK_SEFER, 'שְׁמוֹת'];
const SEFER_MAP = {
  [MOCK_SEFER]: { en: 'Genesis', color: '#4a7c59', chapterVerses: [] },
  'שְׁמוֹת':    { en: 'Exodus',  color: '#c87941', chapterVerses: [] },
};
const FILTERS = { sefarim: [], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false };

describe('WhatIfPreview — removing an already-scheduled future aliyah', () => {
  it('un-schedules it in the ring and drops the committed total', async () => {
    const pastRow = makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 1, pseukim: 10,
      chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10,
      isRead: true, isReadPast: true, orig: '2024-01-01', yearRead: 2024, allYears: [2024],
    });
    const futureRow = makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 2, pseukim: 20,
      chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 20,
      isRead: true, isReadFuture: true, orig: '2099-01-01', yearRead: 2099, allYears: [2099],
    });
    const allRows = [pastRow, futureRow];
    const stats = computeStats(allRows, [], SEFER_ORDER, SEFER_MAP, FILTERS);

    (useApp as Mock).mockReturnValue(makeCtx({
      allRows, SEFER_ORDER, SEFER_MAP, filters: FILTERS, stats,
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));

    renderWithProviders(<WhatIfPreview opened onClose={vi.fn()} />);

    // Seeded on open: the real future-scheduled aliyah shows up as a removable preview row,
    // and its 20 pseukim are still reflected in the committed total (30 = 10 + 20).
    expect(screen.getByText(/already scheduled/)).toBeInTheDocument();
    expect(screen.getByText(/30 committed/)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Remove'));

    // Removing it reverts that aliyah to unscheduled — committed total drops back to just the
    // 10 pseukim actually read, and the ring's "→ N committed" delta text disappears entirely.
    expect(screen.queryByText(/already scheduled/)).not.toBeInTheDocument();
    expect(screen.queryByText(/→ .*committed/)).not.toBeInTheDocument();
  });

  it('Reset to committed restores the seeded row after it was removed', async () => {
    const futureRow = makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 2, pseukim: 20,
      chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 20,
      isRead: true, isReadFuture: true, orig: '2099-01-01', yearRead: 2099, allYears: [2099],
    });
    const allRows = [futureRow];
    const stats = computeStats(allRows, [], SEFER_ORDER, SEFER_MAP, FILTERS);

    (useApp as Mock).mockReturnValue(makeCtx({
      allRows, SEFER_ORDER, SEFER_MAP, filters: FILTERS, stats,
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));

    renderWithProviders(<WhatIfPreview opened onClose={vi.fn()} />);
    expect(screen.getByText(/already scheduled/)).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Remove'));
    expect(screen.queryByText(/already scheduled/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reset to committed' }));
    expect(screen.getByText(/already scheduled/)).toBeInTheDocument();
  });
});

describe('WhatIfPreview — progressive per-row stats', () => {
  it('shows each seeded row\'s own marginal % and the running cumulative total, in date order', () => {
    // Two real future-scheduled aliyot, deliberately out of chronological order in allRows —
    // the later-dated one (aliyah 2) appears first, the earlier-dated one (aliyah 1) second.
    const laterRow = makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 2, pseukim: 10,
      chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 10,
      isRead: true, isReadFuture: true, orig: '2099-06-01', yearRead: 2099, allYears: [2099],
    });
    const earlierRow = makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 1, pseukim: 10,
      chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10,
      isRead: true, isReadFuture: true, orig: '2099-01-01', yearRead: 2099, allYears: [2099],
    });
    const allRows = [laterRow, earlierRow];
    const stats = computeStats(allRows, [], SEFER_ORDER, SEFER_MAP, FILTERS); // 0/20 completed, both future

    (useApp as Mock).mockReturnValue(makeCtx({
      allRows, SEFER_ORDER, SEFER_MAP, filters: FILTERS, stats,
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));

    renderWithProviders(<WhatIfPreview opened onClose={vi.fn()} />);

    // Both rows contribute 10/20 = 50% each; the first chronological row (aliyah 1, earlier
    // date) shows its own +50% reaching a 50% running total, and the second (aliyah 2) shows
    // its own +50% pushing the cumulative total to 100% — regardless of allRows order.
    const marginals = screen.getAllByText('+50.00%');
    const totals = [screen.getByText('50.00% total'), screen.getByText('100.00% total')];
    expect(marginals).toHaveLength(2);
    expect(totals[0]).toBeInTheDocument();
    expect(totals[1]).toBeInTheDocument();

    // The list itself renders in date order: aliyah 1 (earlier) before aliyah 2 (later).
    const rowTexts = screen.getAllByText(/· Aliyah \d ·/).map(el => el.textContent);
    expect(rowTexts[0]).toContain('Aliyah 1');
    expect(rowTexts[1]).toContain('Aliyah 2');
  });
});

describe('WhatIfPreview — pseukim-by-year stat', () => {
  it('sums pseukim within the same calendar year and keeps other years separate', () => {
    // Two future picks in 2099 (non-overlapping verse ranges), one in 2100. Dates are kept
    // away from Jan 1 / Dec 31 boundaries — new Date('YYYY-MM-DD').getFullYear() is UTC-based
    // and can roll over a day in negative-UTC-offset timezones, same as api.ts's mapRow().
    const mar2099 = makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 1, pseukim: 10,
      chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 10,
      isRead: true, isReadFuture: true, orig: '2099-03-01', yearRead: 2099, allYears: [2099],
    });
    const jun2099 = makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 2, pseukim: 15,
      chapterStart: 2, verseStart: 1, chapterEnd: 2, verseEnd: 15,
      isRead: true, isReadFuture: true, orig: '2099-06-01', yearRead: 2099, allYears: [2099],
    });
    const jun2100 = makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 3, pseukim: 5,
      chapterStart: 3, verseStart: 1, chapterEnd: 3, verseEnd: 5,
      isRead: true, isReadFuture: true, orig: '2100-06-01', yearRead: 2100, allYears: [2100],
    });
    const allRows = [mar2099, jun2099, jun2100];
    const stats = computeStats(allRows, [], SEFER_ORDER, SEFER_MAP, FILTERS);

    (useApp as Mock).mockReturnValue(makeCtx({
      allRows, SEFER_ORDER, SEFER_MAP, filters: FILTERS, stats,
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));

    renderWithProviders(<WhatIfPreview opened onClose={vi.fn()} />);

    // First 2099 row: only its own 10 pseukim. Second 2099 row: cumulative 10+15=25 within
    // the same year. The 2100 row is a separate bucket: just its own 5 pseukim.
    expect(screen.getByText('10 pseukim (2099)')).toBeInTheDocument();
    expect(screen.getByText('25 pseukim (2099)')).toBeInTheDocument();
    expect(screen.getByText('5 pseukim (2100)')).toBeInTheDocument();
  });
});

describe('WhatIfPreview — future special (holiday) readings', () => {
  it('seeds a future-scheduled holiday reading as a removable row, with its aliyah number and occasion', async () => {
    // A future occasion reading (Rosh Hashana, aliyah 3) that partially overlaps a standard
    // aliyah — the exact case that used to be omitted because seeding scanned only standard rows.
    const holiday = makeOA({
      id: 42, occasion: 'ראש השנה א׳', occasionEn: 'Rosh Hashana Day 1', aliyahKey: '3',
      parsha: MOCK_PARSHA, parshaEn: 'Vayera', sefer: MOCK_SEFER, seferEn: 'Genesis',
      pseukim: 4, chapterStart: 21, verseStart: 1, chapterEnd: 21, verseEnd: 4,
      orig: '2099-09-12', allDates: ['2099-09-12'], readCount: 1,
      isRead: true, isReadPast: false, isReadFuture: true,
    });
    const allRows = [makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA, aliyah: 1, pseukim: 10,
      chapterStart: 30, verseStart: 1, chapterEnd: 30, verseEnd: 10,
      isRead: true, isReadPast: true, orig: '2024-01-01', yearRead: 2024, allYears: [2024],
    })];
    const stats = computeStats(allRows, [holiday], SEFER_ORDER, SEFER_MAP, FILTERS);

    (useApp as Mock).mockReturnValue(makeCtx({
      allRows, occasionAliyot: [holiday], SEFER_ORDER, SEFER_MAP, filters: FILTERS, stats,
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));

    renderWithProviders(<WhatIfPreview opened onClose={vi.fn()} />);

    // The holiday reading shows up as a seeded row, labelled with its occasion + aliyah number,
    // and its 4 future pseukim land in the committed total (10 read + 4 = 14).
    expect(screen.getByText(/Rosh Hashana Day 1 · Vayera · Aliyah 3/)).toBeInTheDocument();
    expect(screen.getByText(/already scheduled/)).toBeInTheDocument();
    expect(screen.getByText(/14 committed/)).toBeInTheDocument();

    // Removing it un-schedules the reading — the committed delta disappears.
    await userEvent.click(screen.getByLabelText('Remove'));
    expect(screen.queryByText(/already scheduled/)).not.toBeInTheDocument();
    expect(screen.queryByText(/→ .*committed/)).not.toBeInTheDocument();
  });
});

describe('buildAliyahOptions', () => {
  it('lists every aliyah in the parsha, greying out ones already read or scheduled instead of hiding them', () => {
    const unread = makeRow({ parsha: MOCK_PARSHA, aliyah: 1, pseukim: 15 });
    const alreadyRead = makeRow({
      parsha: MOCK_PARSHA, aliyah: 3, pseukim: 20,
      isRead: true, isReadPast: true, orig: '2024-01-01',
    });
    const alreadyScheduled = makeRow({
      parsha: MOCK_PARSHA, aliyah: 5, pseukim: 25,
      isRead: true, isReadFuture: true, orig: '2099-01-01',
    });
    const options = buildAliyahOptions([unread, alreadyRead, alreadyScheduled], MOCK_PARSHA);

    expect(options).toHaveLength(3);
    expect(options[0]).toMatchObject({ value: '1', disabled: false });
    expect(options[1]).toMatchObject({ value: '3', disabled: true });
    expect(options[1]!.label).toMatch(/\(read\)/);
    expect(options[2]).toMatchObject({ value: '5', disabled: true });
    expect(options[2]!.label).toMatch(/\(scheduled\)/);
  });

  it('returns an empty list when no parsha is selected', () => {
    const row = makeRow({ parsha: MOCK_PARSHA, aliyah: 1 });
    expect(buildAliyahOptions([row], '')).toEqual([]);
  });
});
