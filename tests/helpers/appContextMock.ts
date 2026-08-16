import { vi } from 'vitest';
import type { AppContextValue, MappedRow } from '../../src/types/index.js';

export const MOCK_SEFER = 'בְּרֵאשִׁית';
export const MOCK_PARSHA = 'בְּרֵאשִׁית';
export const MOCK_PARSHA_2 = 'נֹחַ';
export const MOCK_COLOR = '#4a7c59';

const baseRow: MappedRow = {
  sefer: MOCK_SEFER,
  parsha: MOCK_PARSHA,
  aliyah: 1,
  pairName: '',
  pairNameEn: '',
  combinedAliyah: null,
  pseukim: 45,
  pct: 0.5,
  chapterStart: -1, verseStart: -1, chapterEnd: -1, verseEnd: -1,
  orig: '2024-01-01',
  directOrig: '2024-01-01',
  readAsDouble: false,
  partialOrig: '',
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
};

export function makeCtx(overrides: Partial<AppContextValue> = {}): AppContextValue {
  return {
    SEFER_ORDER: [MOCK_SEFER, 'שְׁמוֹת'],
    SEFER_MAP: {
      [MOCK_SEFER]: { en: 'Genesis', color: MOCK_COLOR,  chapterVerses: [] },
      'שְׁמוֹת':    { en: 'Exodus',  color: '#c87941',   chapterVerses: [] },
    },
    TLIT: {
      [MOCK_PARSHA]:  'Bereishit',
      [MOCK_PARSHA_2]: 'Noach',
    },
    pairs: [],
    parshaById: {},
    allRows: [baseRow],
    parshaIndex: { [MOCK_SEFER]: [MOCK_PARSHA, MOCK_PARSHA_2] },
    allYears: [2024],
    schedule: {},
    filters: { sefarim: [], years: [], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false },
    setFilters:        vi.fn(),
    sortMode:          'order',
    setSortMode:       vi.fn(),
    activeTab:         'overview',
    setActiveTab:      vi.fn(),
    forecastConfig:    { lookbackYears: 1, paceOverride: null },
    setForecastConfig: vi.fn(),
    stats:           null,
    refresh:         vi.fn().mockResolvedValue(undefined),
    ready:           true,
    canWrite:        true,
    refreshCanWrite: vi.fn().mockResolvedValue(undefined),
    occasions:       [],
    occasionAliyot:  [],
    specialReadings: [],
    refreshSpecial:  vi.fn().mockResolvedValue(undefined),
    weekdayAliyot:   [],
    refreshWeekday:  vi.fn().mockResolvedValue(undefined),
    hosafotReadings: [],
    refreshHosafot:  vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}
