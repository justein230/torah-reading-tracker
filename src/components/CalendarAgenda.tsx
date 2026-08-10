import React, { useMemo } from 'react';
import { format as formatDate } from 'date-fns';
import { EmptyState } from './shared/EmptyState.js';
import { SeferDot } from './shared/SeferDot.js';
import { ReadingStatusBadges } from './shared/ReadingStatusBadges.js';
import { CollapsibleRow } from './shared/CollapsibleRow.js';
import { fmtDate, fmtAliyah } from '../utils.js';
import { TODAY_STR } from '../api.js';
import { KindBadge } from './CalendarGrid.js';
import type { CalEntry, SeferMeta } from '../types/index.js';

const MONTHS = Array.from({ length: 12 }, (_, i) => formatDate(new Date(2000, i, 1), 'MMMM'));

interface AgendaDayProps {
  dateStr: string;
  readings: CalEntry[];
  SEFER_MAP: Record<string, SeferMeta>;
}

function AgendaDay({ dateStr, readings, SEFER_MAP }: Readonly<AgendaDayProps>) {
  const sefers      = [...new Set(readings.map(r => r.sefer))];
  const isFutureDay = dateStr > TODAY_STR;

  const summary = (
    <>
      <div className={`cal-agenda-date${isFutureDay ? ' future' : ''}`}>{fmtDate(dateStr)}</div>
      <div className="cal-agenda-meta">
        <span className="cal-agenda-count">{readings.length} aliyot</span>
        {isFutureDay && <span className="cal-agenda-future-badge">Upcoming</span>}
        <span className="cal-agenda-dots">
          {sefers.map(s => <SeferDot key={s} color={SEFER_MAP[s]?.color ?? '#888'} />)}
        </span>
      </div>
    </>
  );

  return (
    <CollapsibleRow summary={summary} accentColor={isFutureDay ? '#60a5fa' : undefined}>
      <div className="cal-agenda-items">
        {readings.map((r, i) => {
          const color = SEFER_MAP[r.sefer]?.color ?? '#888';
          return (
            <div key={`${r.parsha}-${r.aliyah}-${i}`} className="cal-agenda-item">
              <SeferDot color={color} reread={r.isReread} />
              <span className="hebrew" style={{ color, fontSize: 13 }}>{r.parsha}</span>
              <span className="cal-aliyah-label"> · {fmtAliyah(r.aliyah)}</span>
              <KindBadge kind={r.kind} />
              <ReadingStatusBadges isReread={r.isReread} isFuture={r.isFuture} />
              <span className="cal-pseukim-label">{r.pseukim} pseukim</span>
            </div>
          );
        })}
      </div>
    </CollapsibleRow>
  );
}

interface AgendaViewProps {
  year: number;
  dayMap: Record<string, CalEntry[]>;
  SEFER_MAP: Record<string, SeferMeta>;
}

export function AgendaView({ year, dayMap, SEFER_MAP }: Readonly<AgendaViewProps>) {
  const monthGroups = useMemo(() => {
    const groups: Record<number, string[]> = {};
    for (const dateStr of Object.keys(dayMap)) {
      if (!dateStr.startsWith(String(year))) continue;
      const m = Number.parseInt(dateStr.slice(5, 7), 10) - 1;
      groups[m] ??= [];
      groups[m].push(dateStr);
    }
    for (const m of Object.keys(groups)) groups[Number(m)]!.sort((a, b) => a.localeCompare(b));
    return groups;
  }, [year, dayMap]);

  const monthKeys = Object.keys(monthGroups).map(Number).sort((a, b) => a - b);

  if (monthKeys.length === 0) {
    return <EmptyState message={`No readings in ${year}.`} />;
  }

  return (
    <div>
      {monthKeys.map(m => (
        <div key={m} className="cal-agenda-month">
          <div className="cal-agenda-month-label">{MONTHS[m]} {year}</div>
          {(monthGroups[m] ?? []).map(dateStr => (
            <AgendaDay key={dateStr} dateStr={dateStr} readings={dayMap[dateStr]!} SEFER_MAP={SEFER_MAP} />
          ))}
        </div>
      ))}
    </div>
  );
}
