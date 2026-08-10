import { useMemo, useCallback, useState } from 'react';
import { isSeferAllowed } from '../compute.js';
import './Calendar.css';
import { Box, Text, Group, ActionIcon } from '@mantine/core';
import { format as formatDate } from 'date-fns';
import { useApp } from '../context/AppContext.js';
import { isTouch } from './AliyahTooltip.js';
import { MonthGrid, KIND_META } from './CalendarGrid.js';
import { AgendaView } from './CalendarAgenda.js';
import { TODAY_STR } from '../api.js';
import type {
  MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah,
  Filters, CalEntry, CalDayMap,
} from '../types/index.js';

const MONTHS = Array.from({ length: 12 }, (_, i) => formatDate(new Date(2000, i, 1), 'MMMM'));

function pushToMap(map: CalDayMap, key: string, entry: CalEntry): void {
  map[key] ??= [];
  map[key].push(entry);
}

function yearAllowed(dateStr: string, filters: Filters): boolean {
  return !filters.years.length || filters.years.includes(Number(dateStr.slice(0, 4)));
}

/**
 * Places one entry per date the reading occurred on. The earliest date is the
 * original reading; later dates are rereads. Future dates appear only when the
 * includeFutureDates filter is on, and every date is subject to the year filter.
 */
function addOccurrences(
  map: CalDayMap,
  dates: string[],
  base: Omit<CalEntry, 'isReread' | 'isFuture'>,
  filters: Filters,
): void {
  const sorted   = [...dates].filter(Boolean).sort((a, b) => a.localeCompare(b));
  const earliest = sorted[0];
  for (const d of sorted) {
    const isFuture = d > TODAY_STR;
    if (isFuture && !filters.includeFutureDates) continue;
    if (!yearAllowed(d, filters)) continue;
    pushToMap(map, d, { ...base, isReread: d !== earliest, isFuture });
  }
}

function addStandardRow(map: CalDayMap, r: MappedRow, filters: Filters): void {
  const base = { kind: 'standard' as const, sefer: r.sefer, parsha: r.parsha, aliyah: r.aliyah, pseukim: r.pseukim };
  if (r.isRead && yearAllowed(r.orig, filters)) {
    pushToMap(map, r.orig, { ...base, isReread: false, isFuture: r.isFuture });
  }
  if (r.hasFuture && filters.includeFutureDates) {
    for (const d of r.futDates) {
      if (yearAllowed(d, filters)) pushToMap(map, d, { ...base, isReread: true, isFuture: true });
    }
  }
}

/** Maps one source record to its calendar dates + entry base, or null to skip it. */
type SourceAdapter<T> = (item: T) => { dates: string[]; base: Omit<CalEntry, 'isReread' | 'isFuture'> } | null;

function addSource<T>(map: CalDayMap, items: T[], filters: Filters, adapt: SourceAdapter<T>): void {
  for (const item of items) {
    const got = adapt(item);
    if (got && isSeferAllowed(got.base.sefer, filters)) addOccurrences(map, got.dates, got.base, filters);
  }
}

// Each source records genuinely distinct reading events (a holiday reading and the
// standard aliyah it overlaps fall on different days), so this display-only map
// deliberately applies no double-count dedup.
export function buildDayMap(
  allRows: MappedRow[],
  occasions: MappedOccasionAliyah[],
  weekdays: MappedWeekdayAliyah[],
  hosafot: MappedHosafah[],
  filters: Filters,
): CalDayMap {
  const map: CalDayMap = {};
  for (const r of allRows) {
    if (isSeferAllowed(r.sefer, filters)) addStandardRow(map, r, filters);
  }
  addSource(map, occasions, filters, oa => oa.isRead
    ? { dates: oa.allDates.length ? oa.allDates : [oa.orig], base: { kind: 'occasion', sefer: oa.sefer, parsha: oa.parsha, aliyah: oa.aliyahKey, pseukim: oa.pseukim, occasion: oa.occasion } }
    : null);
  addSource(map, weekdays, filters, wa =>
    ({ dates: wa.allDates.length ? wa.allDates : [wa.dateRead], base: { kind: 'weekday', sefer: wa.sefer, parsha: wa.parsha, aliyah: wa.aliyahNum, pseukim: wa.pseukim } }));
  addSource(map, hosafot, filters, hr => hr.dateRead
    ? { dates: [hr.dateRead], base: { kind: 'hosafah', sefer: hr.sefer, parsha: hr.parsha2 ? `${hr.parsha1}־${hr.parsha2}` : hr.parsha1, aliyah: 'hosafah', pseukim: hr.pseukim, occasion: hr.occasion ?? undefined } }
    : null);
  return map;
}

function useCalendarNav(filtersYear: number | null) {
  const today = new Date();
  const isMobile = isTouch && globalThis.window !== undefined && globalThis.matchMedia('(max-width: 768px)').matches;
  const [viewMode, setViewMode] = useState(isMobile ? 'agenda' : 'grid');
  const [navMonth, setNavMonth] = useState(today.getMonth());
  const [navYear,  setNavYear]  = useState(filtersYear ?? today.getFullYear());

  const isGrid = viewMode === 'grid';

  const onPrev = useCallback(() => {
    if (isGrid) {
      if (navMonth === 0) { setNavMonth(11); setNavYear(y => y - 1); }
      else setNavMonth(m => m - 1);
    } else {
      setNavYear(y => y - 1);
    }
  }, [isGrid, navMonth]);

  const onNext = useCallback(() => {
    if (isGrid) {
      if (navMonth === 11) { setNavMonth(0); setNavYear(y => y + 1); }
      else setNavMonth(m => m + 1);
    } else {
      setNavYear(y => y + 1);
    }
  }, [isGrid, navMonth]);

  const toggleView = useCallback(
    () => setViewMode(isGrid ? 'agenda' : 'grid'),
    [isGrid]
  );

  return { isGrid, navMonth, navYear, onPrev, onNext, toggleView };
}

function useCopyCalUrl() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(`${globalThis.location.origin}/api/calendar.ics`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);
  return { copied, copy };
}

export default function Calendar() {
  const { allRows, occasionAliyot, weekdayAliyot, hosafotReadings, SEFER_MAP, filters } = useApp();
  const dayMap = useMemo(
    () => buildDayMap(allRows, occasionAliyot, weekdayAliyot, hosafotReadings, filters),
    [allRows, occasionAliyot, weekdayAliyot, hosafotReadings, filters],
  );
  const lastYear = filters.years[filters.years.length - 1] ?? null;
  const { isGrid, navMonth, navYear, onPrev, onNext, toggleView } = useCalendarNav(lastYear);
  const { copied, copy } = useCopyCalUrl();

  const navLabel    = isGrid ? `${MONTHS[navMonth]} ${navYear}` : String(navYear);
  const toggleTitle = isGrid ? 'Switch to list view' : 'Switch to grid view';
  const toggleIcon  = isGrid ? '☰' : '⊞';

  return (
    <Box>
      <Group justify="space-between" mb={16} align="center">
        <Group gap={8}>
          <ActionIcon variant="subtle" style={{ color: 'var(--muted)' }} onClick={onPrev}>‹</ActionIcon>
          <Text fw={600} style={{ textAlign: 'center' }}>{navLabel}</Text>
          <ActionIcon variant="subtle" style={{ color: 'var(--muted)' }} onClick={onNext}>›</ActionIcon>
        </Group>
        <Group gap={4}>
          <ActionIcon variant="subtle" style={{ color: 'var(--muted)' }} title={toggleTitle} onClick={toggleView}>
            {toggleIcon}
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            style={{ color: 'var(--muted)' }}
            title="Subscribe to calendar"
            component="a"
            href={`webcal://${globalThis.location.host}/api/calendar.ics`}
          >
            &#x1F4C5;
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            style={{ color: copied ? 'var(--color-success, green)' : 'var(--muted)', lineHeight: 1 }}
            title={copied ? 'Copied!' : 'Copy calendar URL'}
            onClick={copy}
          >
            <span style={{ position: 'relative', top: 2 }}>{copied ? '✓' : '⧉'}</span>
          </ActionIcon>
        </Group>
      </Group>

      <div className="cal-legend">
        <span className="cal-legend-item">
          {KIND_META.standard.label} <span className="cal-legend-note">(colored by sefer)</span>
        </span>
        {(['occasion', 'weekday', 'hosafah'] as const).map(kind => (
          <span key={kind} className="cal-legend-item">
            <span className="cal-legend-swatch" style={{ background: KIND_META[kind].accent }} />
            {KIND_META[kind].label}
          </span>
        ))}
      </div>

      {isGrid
        ? <MonthGrid year={navYear} month={navMonth} dayMap={dayMap} SEFER_MAP={SEFER_MAP} />
        : <AgendaView year={navYear} dayMap={dayMap} SEFER_MAP={SEFER_MAP} />
      }
    </Box>
  );
}
