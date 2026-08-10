import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchMeta, fetchAliyot, fetchHebcal, mapRow, enrichRows, mapOccasionAliyahRow, mapSpecialReadingRow,
         mapWeekdayAliyahRow, mapHosafahRow, fetchOccasions, fetchOccasionAliyot, fetchSpecialReadings,
         fetchWeekdayAliyot } from '../api.js';
import { fetchHosafotReadings } from '../db/web.js';
import { computeStats, enrichPartialOrig, enrichOccasionPartialOrig, enrichWeekdayPartialOrig, enrichHosafotPartialOrig } from '../compute.js';
import { TABS } from '../constants.js';
import type { AppContextValue, MappedRow, MappedOccasionAliyah, MappedHosafah, OccasionRecord, SpecialReadingRecord,
              Filters, ForecastConfig, ParshaPair, SeferMeta } from '../types/index.js';

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [SEFER_ORDER, setSEFER_ORDER] = useState<string[]>([]);
  const [SEFER_MAP,   setSEFER_MAP]   = useState<Record<string, SeferMeta>>({});
  const [TLIT,        setTLIT]        = useState<Record<string, string>>({});
  const [pairs,       setPairs]       = useState<ParshaPair[]>([]);
  const [parshaById,  setParshaById]  = useState<Record<number, string>>({});
  const [rawRows,     setRawRows]     = useState<MappedRow[]>([]);
  const [parshaIndex, setParshaIndex] = useState<Record<string, string[]>>({});
  const [allYears,    setAllYears]    = useState<number[]>([]);
  const [schedule,    setSchedule]    = useState<Record<string, string>>({});
  const [ready,       setReady]       = useState(false);

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
  const [forecastConfig, setForecastConfig] = useState<ForecastConfig>({ lookbackYears: 1, paceOverride: null });

  useEffect(() => {
    (async () => {
      const [meta, raw, hebcal, occ, oa, sr, wa, hr] = await Promise.all([
        fetchMeta(),
        fetchAliyot(),
        fetchHebcal().catch(() => ({ schedule: {} })),
        fetchOccasions().catch(() => []),
        fetchOccasionAliyot().catch(() => []),
        fetchSpecialReadings().catch(() => []),
        fetchWeekdayAliyot().catch(() => []),
        fetchHosafotReadings().catch(() => []),
      ]);

      const order = meta.sefarim.map(s => s.name);
      const map: Record<string, { en: string; color: string; chapterVerses: number[] }> = {};
      meta.sefarim.forEach(s => { map[s.name] = { en: s.name_en, color: s.color, chapterVerses: s.chapter_verses }; });
      const tlit: Record<string, string> = {};
      meta.parshiot.forEach(p => { tlit[p.name] = p.name_en; });
      const rows  = enrichRows(raw.map(mapRow));

      const idx: Record<string, string[]>  = {};
      const seen = new Set<string>();
      for (const s of order) idx[s] = [];
      for (const r of rows) {
        const key = r.sefer + '|' + r.parsha;
        if (!seen.has(key)) { seen.add(key); idx[r.sefer]?.push(r.parsha); }
      }

      const yearSet = new Set<number>();
      for (const r of rows) {
        if (r.yearRead)   yearSet.add(r.yearRead);
        if (r.futureYear) yearSet.add(r.futureYear);
      }

      const byId: Record<number, string> = {};
      meta.parshiot.forEach(p => { byId[p.id] = p.name; });

      setSEFER_ORDER(order);
      setSEFER_MAP(map);
      setTLIT(tlit);
      setPairs(meta.pairs ?? []);
      setParshaById(byId);
      setRawRows(rows);
      setParshaIndex(idx);
      setAllYears([...yearSet].sort((a, b) => a - b));
      setSchedule(hebcal.schedule);
      setOccasions(occ);
      setOccasionAliyot(oa.map(mapOccasionAliyahRow));
      setSpecialReadings(sr.map(mapSpecialReadingRow));
      setWeekdayAliyot(wa.map(mapWeekdayAliyahRow));
      setHosafotReadings(hr.map(mapHosafahRow));
      setReady(true);
    })();
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
    allRows, parshaIndex, allYears, schedule,
    filters, setFilters,
    sortMode, setSortMode,
    activeTab, setActiveTab,
    forecastConfig, setForecastConfig,
    stats, refresh, ready,
    occasions, occasionAliyot: enrichedOccasionAliyot, specialReadings, refreshSpecial,
    weekdayAliyot: enrichedWeekdayAliyot, refreshWeekday,
    hosafotReadings: enrichedHosafotReadings, refreshHosafot,
  }), [SEFER_ORDER, SEFER_MAP, TLIT, pairs, parshaById, allRows, parshaIndex, allYears, schedule,
       filters, sortMode, activeTab, forecastConfig, stats, refresh, ready,
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
