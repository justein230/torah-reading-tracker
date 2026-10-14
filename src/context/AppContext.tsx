import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchMeta, fetchAliyot, fetchHebcal, mapRow, enrichRows, mapOccasionAliyahRow, mapSpecialReadingRow,
         mapWeekdayAliyahRow, mapHosafahRow, fetchOccasions, fetchOccasionAliyot, fetchSpecialReadings,
         fetchWeekdayAliyot, fetchHosafotReadings, fetchCanWrite } from '../api.js';
import { computeStats, enrichPartialOrig, enrichOccasionPartialOrig, enrichWeekdayPartialOrig, enrichHosafotPartialOrig } from '../compute.js';
import { TABS } from '../constants.js';
import { logEvent } from '../utils/logger-client/index.js';
import { errText } from '../utils/errText.js';
import { NO_HOLIDAY_DATES } from '../utils/occasionDates.js';
import { buildMetaLookups, EMPTY_LOOKUPS, type MetaLookups } from '../utils/metaLookups.js';
import type { AppContextValue, HebcalData, MappedRow, MappedOccasionAliyah, MappedHosafah, OccasionRecord, SpecialReadingRecord,
              Filters, ForecastConfig, AppSettings } from '../types/index.js';

const SETTINGS_KEY = 'torah-tracker:settings';
const DEFAULT_SETTINGS: AppSettings = { liveHebcalLookups: false, debugLogging: false };

// Persisted across reloads (unlike filters/sortMode/etc., which are plain in-memory
// state) since it's an opt-in "make a live third-party call" preference — resetting it
// on every reload would defeat the point of it being a toggle at all.
function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) as Partial<AppSettings> };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// [0, 9999] cache years until the initial /api/hebcal load resolves (or if it fails), so no date is
// misreported as "outside the cache" before we actually know its real coverage.
const HEBCAL_PENDING: HebcalData = { schedule: {}, datesByParsha: {}, cacheYears: [0, 9999], holidayDates: NO_HOLIDAY_DATES };

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [lookups,     setLookups]     = useState<MetaLookups>(EMPTY_LOOKUPS);
  const [rawRows,     setRawRows]     = useState<MappedRow[]>([]);
  const [hebcal,      setHebcal]      = useState<HebcalData>(HEBCAL_PENDING);
  const { SEFER_ORDER, SEFER_MAP, TLIT, pairs, parshaById, parshaIndex, allYears } = lookups;
  const { schedule, datesByParsha, cacheYears, holidayDates } = hebcal;
  const [settings,   setSettings]    = useState<AppSettings>(loadSettings);
  const [ready,       setReady]       = useState(false);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const [canWrite,    setCanWrite]    = useState(false);

  const [occasions,       setOccasions]       = useState<OccasionRecord[]>([]);
  const [occasionAliyot,  setOccasionAliyot]  = useState<MappedOccasionAliyah[]>([]);
  const [specialReadings, setSpecialReadings] = useState<SpecialReadingRecord[]>([]);
  const [weekdayAliyot,   setWeekdayAliyot]   = useState<ReturnType<typeof mapWeekdayAliyahRow>[]>([]);
  const [hosafotReadings, setHosafotReadings] = useState<MappedHosafah[]>([]);

  const [filters, setFilters] = useState<Filters>({
    sefarim: [], years: [],
    includeFutureDates: false, pctMode: 'pseukim',
    showHolidayRing: false, showWeekdayRing: false,
  });
  const [sortMode,       setSortMode]       = useState('order');
  const [activeTab,      setActiveTab]      = useState(() => {
    const p = new URLSearchParams(globalThis.location.search);
    const t = p.get('tab') || 'overview';
    return TABS.includes(t) ? t : 'overview';
  });
  const [whatIfOpen,     setWhatIfOpen]     = useState(false);
  const [forecastConfig, setForecastConfig] = useState<ForecastConfig>({ lookbackYears: 1, paceOverride: null });

  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // private browsing / storage full — the toggle just won't survive a reload
    }
  }, [settings]);

  // A silent JS exception (e.g. in a click handler) would otherwise look like "the
  // delete button just didn't do anything" with no trace of why — catch it here.
  useEffect(() => {
    function onError(e: ErrorEvent) {
      logEvent('error', 'client', e.message, { filename: e.filename, lineno: e.lineno });
    }
    function onRejection(e: PromiseRejectionEvent) {
      logEvent('error', 'client', 'Unhandled promise rejection', { reason: String(e.reason) });
    }
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  useEffect(() => {
    async function load() {
      const [meta, raw, hebcal, occ, oa, sr, wa, hr] = await Promise.all([
        fetchMeta(),
        fetchAliyot(),
        fetchHebcal().catch(() => HEBCAL_PENDING),
        fetchOccasions().catch(() => []),
        fetchOccasionAliyot().catch(() => []),
        fetchSpecialReadings().catch(() => []),
        fetchWeekdayAliyot().catch(() => []),
        fetchHosafotReadings().catch(() => []),
      ]);

      const rows = enrichRows(raw.map(mapRow));
      setLookups(buildMetaLookups(meta, rows));
      setRawRows(rows);
      setHebcal({ ...hebcal, holidayDates: hebcal.holidayDates ?? NO_HOLIDAY_DATES });
      setOccasions(occ);
      setOccasionAliyot(oa.map(mapOccasionAliyahRow));
      setSpecialReadings(sr.map(mapSpecialReadingRow));
      setWeekdayAliyot(wa.map(mapWeekdayAliyahRow));
      setHosafotReadings(hr.map(mapHosafahRow));
      setReady(true);
    }
    load().catch((e: unknown) => {
      logEvent('error', 'client', 'Initial data load failed', { detail: errText(e) });
      setLoadError(errText(e));
    });
    void fetchCanWrite().then(setCanWrite);
  }, []);

  const refreshCanWrite = useCallback(async () => {
    setCanWrite(await fetchCanWrite());
  }, []);

  const allRows = useMemo(
    () => enrichPartialOrig(rawRows, occasionAliyot, weekdayAliyot, hosafotReadings),
    [rawRows, occasionAliyot, weekdayAliyot, hosafotReadings],
  );

  const enrichedOccasionAliyot = useMemo(
    () => enrichOccasionPartialOrig(occasionAliyot, rawRows, weekdayAliyot, hosafotReadings),
    [occasionAliyot, rawRows, weekdayAliyot, hosafotReadings],
  );

  const enrichedWeekdayAliyot = useMemo(
    () => enrichWeekdayPartialOrig(weekdayAliyot, rawRows, occasionAliyot, hosafotReadings),
    [weekdayAliyot, rawRows, occasionAliyot, hosafotReadings],
  );

  const enrichedHosafotReadings = useMemo(
    () => enrichHosafotPartialOrig(hosafotReadings, rawRows, occasionAliyot, weekdayAliyot),
    [hosafotReadings, rawRows, occasionAliyot, weekdayAliyot],
  );

  const refresh = useCallback(async () => {
    const raw = await fetchAliyot();
    setRawRows(enrichRows(raw.map(mapRow)));
  }, []);

  const refreshSpecial = useCallback(async () => {
    const [oa, sr] = await Promise.all([fetchOccasionAliyot(), fetchSpecialReadings()]);
    setOccasionAliyot(oa.map(mapOccasionAliyahRow));
    setSpecialReadings(sr.map(mapSpecialReadingRow));
  }, []);

  const refreshWeekday = useCallback(async () => {
    const wa = await fetchWeekdayAliyot();
    setWeekdayAliyot(wa.map(mapWeekdayAliyahRow));
  }, []);

  const refreshHosafot = useCallback(async () => {
    const hr = await fetchHosafotReadings();
    setHosafotReadings(hr.map(mapHosafahRow));
  }, []);

  const stats = useMemo(
    () => ready ? computeStats(allRows, enrichedOccasionAliyot, SEFER_ORDER, SEFER_MAP, filters, enrichedWeekdayAliyot, enrichedHosafotReadings) : null,
    [allRows, enrichedOccasionAliyot, SEFER_ORDER, SEFER_MAP, filters, enrichedWeekdayAliyot, enrichedHosafotReadings, ready]
  );

  const value = useMemo<AppContextValue>(() => ({
    SEFER_ORDER, SEFER_MAP, TLIT, pairs, parshaById,
    allRows, parshaIndex, allYears, schedule, datesByParsha, cacheYears, holidayDates,
    settings, setSettings,
    filters, setFilters,
    sortMode, setSortMode,
    activeTab, setActiveTab,
    whatIfOpen, setWhatIfOpen,
    forecastConfig, setForecastConfig,
    stats, refresh, ready, loadError,
    canWrite, refreshCanWrite,
    occasions, occasionAliyot: enrichedOccasionAliyot, specialReadings, refreshSpecial,
    weekdayAliyot: enrichedWeekdayAliyot, refreshWeekday,
    hosafotReadings: enrichedHosafotReadings, refreshHosafot,
  }), [SEFER_ORDER, SEFER_MAP, TLIT, pairs, parshaById, allRows, parshaIndex, allYears, schedule,
       datesByParsha, cacheYears, holidayDates, settings,
       filters, sortMode, activeTab, whatIfOpen, forecastConfig, stats, refresh, ready, loadError,
       canWrite, refreshCanWrite,
       occasions, enrichedOccasionAliyot, specialReadings, refreshSpecial,
       enrichedWeekdayAliyot, refreshWeekday,
       enrichedHosafotReadings, refreshHosafot]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
