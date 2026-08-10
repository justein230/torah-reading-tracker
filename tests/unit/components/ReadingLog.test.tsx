import { screen } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import ReadingLog from '../../../src/components/ReadingLog.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER, MOCK_PARSHA } from '../../helpers/appContextMock.js';
import { makeRow, makeHosafah, makeOA, makeWA, makeSpecial } from '../../helpers/fixtures.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

const ROW_DEFAULTS = { sefer: MOCK_SEFER, parsha: MOCK_PARSHA };

describe('ReadingLog — empty state', () => {
  it('shows EmptyState when there are no read rows and no hosafot', () => {
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [], hosafotReadings: [] }));
    renderWithProviders(<ReadingLog />);
    expect(screen.getByText('No readings match the current filters.')).toBeInTheDocument();
  });

  it('shows EmptyState when rows exist but none are read', () => {
    const row = makeRow({ ...ROW_DEFAULTS, isRead: false, orig: '' });
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [row], hosafotReadings: [] }));
    renderWithProviders(<ReadingLog />);
    expect(screen.getByText('No readings match the current filters.')).toBeInTheDocument();
  });

  it('shows EmptyState when sefer filter excludes all read rows', () => {
    const row = makeRow({ ...ROW_DEFAULTS, isRead: true, orig: '2020-01-01', yearRead: 2020 });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [row],
      hosafotReadings: [],
      filters: { sefarim: ['שְׁמוֹת'], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false },
    }));
    renderWithProviders(<ReadingLog />);
    expect(screen.getByText('No readings match the current filters.')).toBeInTheDocument();
  });
});

describe('ReadingLog — past readings grouped by year', () => {
  it('renders a year group with aliyot/pseukim/pct summary', () => {
    const row = makeRow({ ...ROW_DEFAULTS, isRead: true, orig: '2020-03-01', yearRead: 2020, pseukim: 30, pct: 5 });
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [row], hosafotReadings: [] }));
    renderWithProviders(<ReadingLog />);
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('1 aliyot · 30 pseukim · 5.00%')).toBeInTheDocument();
  });

  it('excludes maftir (aliyah 8) pseukim/pct from the year totals', () => {
    const standard = makeRow({ ...ROW_DEFAULTS, isRead: true, orig: '2020-03-01', yearRead: 2020, aliyah: 1, pseukim: 10, pct: 2 });
    const maftir   = makeRow({ ...ROW_DEFAULTS, isRead: true, orig: '2020-03-02', yearRead: 2020, aliyah: 8, pseukim: 999, pct: 999 });
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [standard, maftir], hosafotReadings: [] }));
    renderWithProviders(<ReadingLog />);
    expect(screen.getByText('2 aliyot · 10 pseukim · 2.00%')).toBeInTheDocument();
  });

  it('respects the year filter', () => {
    const row2020 = makeRow({ ...ROW_DEFAULTS, isRead: true, orig: '2020-03-01', yearRead: 2020 });
    const row2021 = makeRow({ ...ROW_DEFAULTS, isRead: true, orig: '2021-03-01', yearRead: 2021, aliyah: 2 });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [row2020, row2021],
      hosafotReadings: [],
      filters: { sefarim: [], years: [2021], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false },
    }));
    renderWithProviders(<ReadingLog />);
    expect(screen.queryByText('2020')).not.toBeInTheDocument();
    expect(screen.getByText('2021')).toBeInTheDocument();
  });
});

describe('ReadingLog — same-day grouping into a DayCard', () => {
  it('groups multiple aliyot read on the same day under one summary row', () => {
    const r1 = makeRow({ ...ROW_DEFAULTS, isRead: true, orig: '2020-03-01', yearRead: 2020, aliyah: 1, pseukim: 10 });
    const r2 = makeRow({ ...ROW_DEFAULTS, isRead: true, orig: '2020-03-01', yearRead: 2020, aliyah: 2, pseukim: 20 });
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [r1, r2], hosafotReadings: [] }));
    renderWithProviders(<ReadingLog />);
    expect(screen.getByText('2 aliyot')).toBeInTheDocument();
    expect(screen.getByText('30 pseukim')).toBeInTheDocument();
  });

  it('renders a single entry directly (no DayCard) when only one aliyah was read that day', () => {
    const row = makeRow({ ...ROW_DEFAULTS, isRead: true, orig: '2020-03-01', yearRead: 2020, aliyah: 1, pseukim: 10 });
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [row], hosafotReadings: [] }));
    renderWithProviders(<ReadingLog />);
    expect(screen.queryByText('1 aliyot read')).not.toBeInTheDocument();
  });
});

describe('ReadingLog — future re-reads', () => {
  it('includes a future re-read as an upcoming entry when includeFutureDates is set', () => {
    const row = makeRow({
      ...ROW_DEFAULTS, isRead: true, orig: '2020-01-01', yearRead: 2020,
      hasFuture: true, futDates: ['2099-06-01'],
    });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [row],
      hosafotReadings: [],
      filters: { sefarim: [], years: [], includeFutureDates: true, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false },
    }));
    renderWithProviders(<ReadingLog />);
    expect(screen.getByText('Upcoming Readings')).toBeInTheDocument();
    expect(screen.getByText('2099')).toBeInTheDocument();
  });

  it('omits future re-reads when includeFutureDates is false', () => {
    const row = makeRow({
      ...ROW_DEFAULTS, isRead: true, orig: '2020-01-01', yearRead: 2020,
      hasFuture: true, futDates: ['2099-06-01'],
    });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [row],
      hosafotReadings: [],
      filters: { sefarim: [], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false },
    }));
    renderWithProviders(<ReadingLog />);
    expect(screen.queryByText('Upcoming Readings')).not.toBeInTheDocument();
  });
});

describe('ReadingLog — hosafot entries', () => {
  it('includes a hosafah reading in the log', () => {
    const hr = makeHosafah({ sefer: MOCK_SEFER, dateRead: '2020-05-01' });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [],
      hosafotReadings: [hr],
      stats: { totalPseukim: 100 } as never,
    }));
    renderWithProviders(<ReadingLog />);
    expect(screen.getByText('2020')).toBeInTheDocument();
  });

  it('excludes a hosafah reading filtered out by sefer', () => {
    const hr = makeHosafah({ sefer: 'שְׁמוֹת', dateRead: '2020-05-01' });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [],
      hosafotReadings: [hr],
      filters: { sefarim: [MOCK_SEFER], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false },
    }));
    renderWithProviders(<ReadingLog />);
    expect(screen.getByText('No readings match the current filters.')).toBeInTheDocument();
  });

  it('excludes a hosafah reading with no dateRead', () => {
    const hr = makeHosafah({ sefer: MOCK_SEFER, dateRead: '' });
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [], hosafotReadings: [hr] }));
    renderWithProviders(<ReadingLog />);
    expect(screen.getByText('No readings match the current filters.')).toBeInTheDocument();
  });
});

describe('ReadingLog — holiday & weekday readings', () => {
  it('renders a holiday reading and suppresses the standard row it derived', () => {
    // Bo aliyah 5 shows as "read" only because Pesach sub-aliyot covered it: directOrig is empty.
    const derived = makeRow({ ...ROW_DEFAULTS, aliyah: 5, isRead: true, orig: '2024-04-23', directOrig: '', yearRead: 2024, pseukim: 8 });
    const oa = makeOA({ id: 7, sefer: MOCK_SEFER, parsha: MOCK_PARSHA });
    const sr = makeSpecial({ occasionAliyahId: 7, occasionEn: 'Pesach', dateRead: '2024-04-23', pseukim: 8 });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [derived], specialReadings: [sr], occasionAliyot: [oa],
      stats: { totalPseukim: 100 } as never,
    }));
    renderWithProviders(<ReadingLog />);
    // Only the holiday reading is counted — the derived standard row is gone (else it'd be 2 aliyot).
    expect(screen.getByText('1 aliyot · 8 pseukim · 8.00%')).toBeInTheDocument();
  });

  it('renders a weekday reading in the log', () => {
    const wa = makeWA({ sefer: MOCK_SEFER, parsha: MOCK_PARSHA, dateRead: '2024-01-15', pseukim: 5, aliyahNum: 3 });
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [], weekdayAliyot: [wa], stats: { totalPseukim: 100 } as never,
    }));
    renderWithProviders(<ReadingLog />);
    expect(screen.getByText('2024')).toBeInTheDocument();
    expect(screen.getByText('1 aliyot · 5 pseukim · 5.00%')).toBeInTheDocument();
  });
});

describe('ReadingLog — double parsha grouping', () => {
  const dpRow = (aliyah: number, pseukim: number, pct: number) => makeRow({
    sefer: MOCK_SEFER, parsha: MOCK_PARSHA,
    pairName: 'תזריע-מצורע', pairNameEn: 'Tazria-Metzora', combinedAliyah: 1, readAsDouble: true,
    aliyah, pseukim, pct, isRead: true, orig: '2024-04-13', directOrig: '2024-04-13', yearRead: 2024,
  });

  it('collapses the components into one combined-aliyah row counted once in the year totals', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [dpRow(1, 13, 1), dpRow(2, 12, 1), dpRow(3, 6, 1)], hosafotReadings: [],
    }));
    const { container } = renderWithProviders(<ReadingLog />);
    // One combined aliyah, pseukim summed (13+12+6), pct summed (3) — not three separate rows.
    expect(screen.getByText('1 aliyot · 31 pseukim · 3.00%')).toBeInTheDocument();
    // The pair label and the underlying component aliyot both appear (components live in the expansion).
    expect(container.textContent).toContain('תזריע-מצורע');
    expect(container.textContent).toContain('Tazria-Metzora');
  });

  it('does NOT collapse a pairable parsha read standalone (readAsDouble false)', () => {
    // Two aliyot of Balak (a Chukat-Balak pair member) read standalone: each carries pair metadata
    // but readAsDouble is false, so they stay as ordinary same-day rows, not a combined card.
    const balak = (aliyah: number, pseukim: number) => makeRow({
      sefer: MOCK_SEFER, parsha: MOCK_PARSHA,
      pairName: 'חוקת-בלק', pairNameEn: 'Chukat-Balak', combinedAliyah: 5, readAsDouble: false,
      aliyah, pseukim, pct: 1, isRead: true, orig: '2026-07-04', directOrig: '2026-07-04', yearRead: 2026,
    });
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [balak(1, 10), balak(2, 20)], hosafotReadings: [] }));
    renderWithProviders(<ReadingLog />);
    // Two standalone aliyot grouped only by day (DayCard), never as a double parsha.
    expect(screen.getByText('2 aliyot')).toBeInTheDocument();
    expect(screen.queryByText(/Chukat-Balak/)).not.toBeInTheDocument();
  });
});
