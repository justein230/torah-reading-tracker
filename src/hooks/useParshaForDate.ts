import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.js';
import { fetchHebcalOnDate } from '../api.js';
import { toDateStr } from '../utils/format.js';

const LIVE_LOOKUP_DEBOUNCE_MS = 400;

export interface ParshaForDate {
  status: 'in-range' | 'live-pending' | 'live-disabled' | 'live';
  /** Parsha name(s) (name_en) known for this date. Empty until resolved, or if nothing was found. */
  parshiot: string[];
}

const IN_RANGE_PENDING: ParshaForDate = { status: 'in-range', parshiot: [] };

/**
 * Resolves what parsha(s) a given date corresponds to, so any caller — the
 * non-standard-reading warning today, weekday/holiday autofill later — can ask "what was
 * read on this date" without re-deriving cache-range logic or wiring up its own fetch.
 *
 * Dates inside the baked cache's range (`cacheYears`) resolve synchronously from
 * `datesByParsha`. Dates outside it resolve via an opt-in, debounced live Hebcal.com
 * lookup, gated by `settings.liveHebcalLookups`.
 */
export function useParshaForDate(rawDate: Date | string | null): ParshaForDate {
  const { datesByParsha, cacheYears, settings } = useApp();
  const date = toDateStr(rawDate) || null;

  const parshiotByDate = useMemo(() => {
    const out: Record<string, string[]> = {};
    for (const [parsha, dates] of Object.entries(datesByParsha)) {
      for (const d of dates) {
        out[d] ??= [];
        out[d].push(parsha);
      }
    }
    return out;
  }, [datesByParsha]);

  const inRange = date != null
    && Number(date.slice(0, 4)) >= cacheYears[0]
    && Number(date.slice(0, 4)) <= cacheYears[1];

  const [liveResult, setLiveResult] = useState<{ date: string; parshiot: string[] } | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (inRange || !date || !settings.liveHebcalLookups) return;

    const id = ++requestId.current;
    const timer = setTimeout(() => {
      void fetchHebcalOnDate(date).then(({ parshiot }) => {
        if (requestId.current === id) setLiveResult({ date, parshiot });
      });
    }, LIVE_LOOKUP_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [date, inRange, settings.liveHebcalLookups]);

  if (!date) return IN_RANGE_PENDING;

  if (inRange) return { status: 'in-range', parshiot: parshiotByDate[date] ?? [] };
  if (!settings.liveHebcalLookups) return { status: 'live-disabled', parshiot: [] };
  if (liveResult?.date !== date) return { status: 'live-pending', parshiot: [] };
  return { status: 'live', parshiot: liveResult.parshiot };
}
