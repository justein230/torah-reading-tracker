import { screen } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import WeekdayGrid from '../../../src/components/WeekdayGrid.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER, MOCK_PARSHA } from '../../helpers/appContextMock.js';
import { makeOA as baseOA, makeWA as baseWA } from '../../helpers/fixtures.js';
import type { MappedWeekdayAliyah, MappedOccasionAliyah } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

// jsdom normalizes hex colors to rgb() in element.style — use the rgb equivalent of MOCK_COLOR (#4a7c59)
const SEFER_COLOR_RGB = 'rgb(74, 124, 89)';

const OA_DEFAULTS = { parsha: MOCK_PARSHA, sefer: MOCK_SEFER, seferColor: '#4a7c59', id: 100 } as const;
const WA_DEFAULTS: Partial<MappedWeekdayAliyah> = { parsha: MOCK_PARSHA, sefer: MOCK_SEFER, seferColor: '#4a7c59', isReadPast: false, dateRead: '', readingId: 0, allDates: [] };

function makeOA(overrides: Partial<MappedOccasionAliyah> = {}) { return baseOA({ ...OA_DEFAULTS, ...overrides }); }
function makeWA(overrides: Partial<MappedWeekdayAliyah> = {})  { return baseWA({ ...WA_DEFAULTS, ...overrides }); }

const THREE_WA_UNREAD = [
  makeWA({ id: 1, aliyahNum: 1, chapterStart: 1, verseStart: 1,  chapterEnd: 1, verseEnd: 5  }),
  makeWA({ id: 2, aliyahNum: 2, chapterStart: 1, verseStart: 6,  chapterEnd: 1, verseEnd: 8  }),
  makeWA({ id: 3, aliyahNum: 3, chapterStart: 1, verseStart: 9,  chapterEnd: 1, verseEnd: 13 }),
];

const THREE_WA_READ = THREE_WA_UNREAD.map(wa => ({ ...wa, dateRead: '2024-03-15', readingId: 10, isReadPast: true }));

beforeEach(() => {
  (useApp as Mock).mockReturnValue(makeCtx({
    weekdayAliyot: THREE_WA_UNREAD,
    // allRows default has aliyah=1 isReadPast=true for MOCK_PARSHA — override to unread for most tests
    allRows: [],
    parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
  }));
});

// ── helper ────────────────────────────────────────────────────────────────────

function getCells(container: HTMLElement) {
  return Array.from(container.querySelectorAll('.acell')) as HTMLElement[];
}

// ── sefer header count ────────────────────────────────────────────────────────

describe('WeekdayGrid — sefer header count', () => {
  it('shows 0/3 when all weekday aliyot are unread and no Shabbat coverage', () => {
    renderWithProviders(<WeekdayGrid />);
    expect(screen.getByText(/0\/3 Aliyot/)).toBeInTheDocument();
  });

  it('shows 3/3 when all 3 weekday aliyot have dateRead', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_READ,
      allRows: [],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    renderWithProviders(<WeekdayGrid />);
    expect(screen.getByText(/3\/3 Aliyot/)).toBeInTheDocument();
  });

  it('shows 3/3 when Shabbat aliyah 1 is isReadPast (all weekday aliyot counted as covered)', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      // allRows default from makeCtx has aliyah=1 isReadPast=true for MOCK_PARSHA
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    renderWithProviders(<WeekdayGrid />);
    expect(screen.getByText(/3\/3 Aliyot/)).toBeInTheDocument();
  });

  it('shows 0/3 when only Shabbat aliyah 1 is future-scheduled (isReadFuture, not isReadPast)', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      allRows: [{ ...makeCtx().allRows[0]!, isReadPast: false, isReadFuture: true, isRead: true }],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    renderWithProviders(<WeekdayGrid />);
    expect(screen.getByText(/0\/3 Aliyot/)).toBeInTheDocument();
  });

  it('shows 3/3 when holiday covers all 3 weekday aliyot', () => {
    const oa = makeOA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 13 });
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      allRows: [],
      occasionAliyot: [oa],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    renderWithProviders(<WeekdayGrid />);
    expect(screen.getByText(/3\/3 Aliyot/)).toBeInTheDocument();
  });

  it('shows 2/3 when holiday covers only 2 of 3 weekday aliyot', () => {
    // holiday overlaps wa1 (1:1–1:5) and wa2 (1:6–1:8) but not wa3 (1:9–1:13)
    const oa = makeOA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 8 });
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      allRows: [],
      occasionAliyot: [oa],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    renderWithProviders(<WeekdayGrid />);
    expect(screen.getByText(/2\/3 Aliyot/)).toBeInTheDocument();
  });

  it('shows 3/3 when mix of holiday and direct weekday reads covers all 3', () => {
    // holiday covers wa1; wa2 + wa3 directly read
    const oa = makeOA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    const wa2Read = { ...THREE_WA_UNREAD[1]!, dateRead: '2024-03-15', isReadPast: true };
    const wa3Read = { ...THREE_WA_UNREAD[2]!, dateRead: '2024-03-15', isReadPast: true };
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: [THREE_WA_UNREAD[0]!, wa2Read, wa3Read],
      allRows: [],
      occasionAliyot: [oa],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    renderWithProviders(<WeekdayGrid />);
    expect(screen.getByText(/3\/3 Aliyot/)).toBeInTheDocument();
  });

  it('shows 0/3 when only Shabbat aliyah 2 is read (only aliyah 1 triggers Shabbat coverage)', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      allRows: [{ ...makeCtx().allRows[0]!, aliyah: 2, isReadPast: true }],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    renderWithProviders(<WeekdayGrid />);
    expect(screen.getByText(/0\/3 Aliyot/)).toBeInTheDocument();
  });
});

// ── cell colors ───────────────────────────────────────────────────────────────

describe('WeekdayGrid — cell background colors', () => {
  it('cells with dateRead get the sefer color as background (wiring smoke test)', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_READ,
      allRows: [],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<WeekdayGrid />);
    getCells(container).forEach(cell => {
      expect(cell.style.background).toBe(SEFER_COLOR_RGB);
    });
  });

  it('cells get sefer color when Shabbat aliyah 1 is isReadPast (shabbatCovered)', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
      // makeCtx default allRows has aliyah=1 isReadPast=true
    }));
    const { container } = renderWithProviders(<WeekdayGrid />);
    getCells(container).forEach(cell => {
      expect(cell.style.background).toBe(SEFER_COLOR_RGB);
    });
  });

  it('cells stay unread when Shabbat aliyah 1 is future-only (not isReadPast)', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      allRows: [{ ...makeCtx().allRows[0]!, isReadPast: false, isReadFuture: true, isRead: true }],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<WeekdayGrid />);
    getCells(container).forEach(cell => {
      expect(cell.style.background).toBe('var(--cell-unread)');
    });
  });

  it('cells stay unread when only Shabbat aliyah 2 is read (not aliyah 1)', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      allRows: [{ ...makeCtx().allRows[0]!, aliyah: 2, isReadPast: true }],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<WeekdayGrid />);
    getCells(container).forEach(cell => {
      expect(cell.style.background).toBe('var(--cell-unread)');
    });
  });

  it('cell overlapped by a read holiday aliyah gets sefer color', () => {
    // wa1 covers 1:1–1:5; holiday covers 1:1–1:5 → overlaps → wa1 is covered
    const oa = makeOA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 5 });
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      allRows: [],
      occasionAliyot: [oa],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<WeekdayGrid />);
    const cells = getCells(container);
    // wa1 (1:1–1:5) covered; wa2 (1:6–1:8) and wa3 (1:9–1:13) not overlapped by oa
    expect(cells[0]!.style.background).toBe(SEFER_COLOR_RGB);
    expect(cells[1]!.style.background).toBe('var(--cell-unread)');
    expect(cells[2]!.style.background).toBe('var(--cell-unread)');
  });

  it('holiday covering entire weekday range fills all 3 cells', () => {
    const oa = makeOA({ chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 13 });
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      allRows: [],
      occasionAliyot: [oa],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<WeekdayGrid />);
    getCells(container).forEach(cell => {
      expect(cell.style.background).toBe(SEFER_COLOR_RGB);
    });
  });

  it('non-overlapping holiday leaves cells unread', () => {
    // holiday in chapter 3 — no overlap with any weekday aliyah
    const oa = makeOA({ chapterStart: 3, verseStart: 1, chapterEnd: 3, verseEnd: 5 });
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      allRows: [],
      occasionAliyot: [oa],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<WeekdayGrid />);
    getCells(container).forEach(cell => {
      expect(cell.style.background).toBe('var(--cell-unread)');
    });
  });

  it('unread holiday does not cover weekday cells', () => {
    const oa = makeOA({ isRead: false, isReadPast: false, chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 13 });
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: THREE_WA_UNREAD,
      allRows: [],
      occasionAliyot: [oa],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<WeekdayGrid />);
    getCells(container).forEach(cell => {
      expect(cell.style.background).toBe('var(--cell-unread)');
    });
  });

  it('read cell with a future re-read shows the reread dot inside the cell', () => {
    const wa = makeWA({ id: 1, aliyahNum: 1, dateRead: '2024-03-15', isReadPast: true, hasFuture: true });
    (useApp as Mock).mockReturnValue(makeCtx({
      weekdayAliyot: [wa],
      allRows: [],
      parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA] },
    }));
    const { container } = renderWithProviders(<WeekdayGrid />);
    // scope to .acell to exclude the reread-dot that lives in the GridLegend swatch
    expect(container.querySelector('.acell .reread-dot')).toBeInTheDocument();
  });
});
