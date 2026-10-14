import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { makeCtx, MOCK_SEFER, MOCK_PARSHA } from '../../helpers/appContextMock.js';
import type { MappedOccasionAliyah, MappedWeekdayAliyah, MappedRow } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

import { useAliyahTooltip } from '../../../src/components/AliyahTooltip.js';

const mockUseApp = useApp as unknown as ReturnType<typeof vi.fn>;

const baseRow: MappedRow = {
  sefer: MOCK_SEFER,
  parsha: MOCK_PARSHA,
  aliyah: 3,
  pairName: '',
  pairNameEn: '',
  combinedAliyah: null,
  pseukim: 20,
  pct: 1.25,
  parshaPct: 10,
  chapterStart: 1, verseStart: 1, chapterEnd: 2, verseEnd: 5,
  orig: '2024-01-01',
  directOrig: '2024-01-01',
  readAsDouble: false,
  partialOrig: '',
  futurePartialOrig: '',
  isCoveredPast: false,
  futDates: [],
  isRead: true,
  isReadPast: true,
  isReadFuture: false,
  hasFuture: false,
  isFuture: false,
  isReread: false,
  yearRead: 2024,
  futureYear: null,
  allYears: [2024],
  occasion: '',
  location: '',
  rereadCount: 0,
} as MappedRow;

const baseOccasion: MappedOccasionAliyah = {
  id: 1, occasionId: 1, occasion: 'פורים', occasionEn: 'Purim', category: 'holiday',
  aliyahKey: 'purim-1', isShabbatVariant: false, parshaId: 1, parsha: MOCK_PARSHA, parshaEn: 'Bereishit',
  sefer: MOCK_SEFER, seferEn: 'Genesis', seferColor: '#4a7c59', pseukim: 15,
  chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 15,
  coversAliyahId: null, orig: '2024-03-01', allDates: ['2024-03-01'], readCount: 1,
  isRead: true, isReadPast: true, isReadFuture: false, hasFuture: false, partialOrig: '', futurePartialOrig: '', isCoveredPast: false,
};

const baseWeekday: MappedWeekdayAliyah = {
  id: 1, parshaId: 1, aliyahNum: 1, parsha: MOCK_PARSHA, parshaEn: 'Bereishit',
  sefer: MOCK_SEFER, seferEn: 'Genesis', seferColor: '#4a7c59', pseukim: 8,
  chapterStart: 1, verseStart: 1, chapterEnd: 1, verseEnd: 8,
  coversAliyahId: null, dateRead: '2024-01-04', allDates: ['2024-01-04'], readingId: 1,
  isReadPast: true, isReadFuture: false, hasFuture: false, partialOrig: '', futurePartialOrig: '', isCoveredPast: false,
  location: '', note: '',
};

function mouseEvent(clientX = 100, clientY = 100): React.MouseEvent {
  return { clientX, clientY } as unknown as React.MouseEvent;
}

beforeEach(() => {
  mockUseApp.mockReturnValue(makeCtx({ stats: { totalPseukim: 1000 } as never }));
});

describe('useAliyahTooltip — showTip', () => {
  it('builds tip rows from a standard aliyah row and positions from the event', () => {
    const { result } = renderHook(() => useAliyahTooltip());
    act(() => result.current.showTip(mouseEvent(50, 50), baseRow));

    expect(result.current.tip?._tlit).toBe('Bereishit');
    expect(result.current.tip?._tipRows.find(r => r.k === 'Aliyah')).toBeTruthy();
    expect(result.current.tip?._tipRows.find(r => r.k === 'Read')).toBeTruthy();
    expect(result.current.tipPos).toEqual({ x: 64, y: 64 });
  });

  it('labels a future reading as Upcoming instead of Read', () => {
    const { result } = renderHook(() => useAliyahTooltip());
    act(() => result.current.showTip(mouseEvent(), { ...baseRow, isReadFuture: true, isReadPast: false }));
    expect(result.current.tip?._tipRows.find(r => r.k === 'Upcoming')).toBeTruthy();
  });

  it('adds a Double Parsha row when pairName is set', () => {
    const { result } = renderHook(() => useAliyahTooltip());
    act(() => result.current.showTip(mouseEvent(), { ...baseRow, pairName: 'ניצבים-וילך' }));
    expect(result.current.tip?._tipRows.find(r => r.k === 'Double Parsha')).toBeTruthy();
  });

  it('falls back to a default color/name when SEFER_MAP has no entry', () => {
    mockUseApp.mockReturnValue(makeCtx({ SEFER_MAP: {}, TLIT: {} }));
    const { result } = renderHook(() => useAliyahTooltip());
    act(() => result.current.showTip(mouseEvent(), baseRow));
    expect(result.current.tip?._color).toBe('#888');
  });
});

// What each tooltip says is tested on the pure builders (tests/unit/utils/tooltipRows.test.ts);
// here we only check that every show* stores its builder's output.
describe('useAliyahTooltip — show* store the tip', () => {
  it('showOccasionTip / showWeekdayTip / showDoublePairTip each set the tip', () => {
    const { result } = renderHook(() => useAliyahTooltip());
    act(() => result.current.showOccasionTip(mouseEvent(), baseOccasion, 'Purim'));
    expect(result.current.tip?._tlit).toBe('Purim');
    act(() => result.current.showWeekdayTip(mouseEvent(), baseWeekday));
    expect(result.current.tip?._aliyah).toBe('Weekday 1');
    act(() => result.current.showDoublePairTip(mouseEvent(), 'ניצבים-וילך', 'Nitzavim-Vayeilech', 7, [baseRow], '#4a7c59', 40));
    expect(result.current.tip?._tlit).toBe('Nitzavim-Vayeilech');
  });

  it('uses the stats total for % of Torah, showing — when it is zero', () => {
    mockUseApp.mockReturnValue(makeCtx({ stats: { totalPseukim: 0 } as never }));
    const { result } = renderHook(() => useAliyahTooltip());
    act(() => result.current.showOccasionTip(mouseEvent(), baseOccasion, 'Purim'));
    expect(result.current.tip?._tipRows.find(r => r.k === '% of Torah')?.v).toBe('—');
  });
});

describe('useAliyahTooltip — hideTip / moveTipPos', () => {
  it('clears the tip and the active cell', () => {
    const { result } = renderHook(() => useAliyahTooltip());
    act(() => { result.current.showTip(mouseEvent(), baseRow); result.current.handlers.setActiveId('cell-1'); });
    expect(result.current.handlers.activeId).toBe('cell-1');
    act(() => result.current.hideTip());
    expect(result.current.tip).toBeNull();
    expect(result.current.handlers.activeId).toBeNull();
  });

  it('flips the tooltip to the left/above the cursor near the viewport edge', () => {
    const { result } = renderHook(() => useAliyahTooltip());
    act(() => result.current.moveTipPos(mouseEvent(globalThis.innerWidth - 5, globalThis.innerHeight - 5)));
    expect(result.current.tipPos.x).toBeLessThan(globalThis.innerWidth - 5);
    expect(result.current.tipPos.y).toBeLessThan(globalThis.innerHeight - 5);
  });
});
