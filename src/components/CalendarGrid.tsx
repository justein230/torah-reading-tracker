import React, { useState, useEffect } from 'react';
import { SeferDot } from './shared/SeferDot.js';
import { ReadingStatusBadges } from './shared/ReadingStatusBadges.js';
import { format as formatDate } from 'date-fns';
import { fmtDate, futureBg, fmtAliyah } from '../utils.js';
import { positionTooltip } from '../utils/tooltip.js';
import type { CalEntry, CalKind, SeferMeta } from '../types/index.js';

const DOW = Array.from({ length: 7 }, (_, i) => formatDate(new Date(2000, 0, i + 2), 'EEE'));

const CAL_TIP_W   = 270; /* calendar day tooltip width in px */
const CAL_TIP_H   = 180; /* calendar day tooltip height in px */
const CAL_TIP_GAP = 6;   /* gap between target cell and tooltip in px */

/* Reading-type coding: standard parsha chips stay colored by sefer (no accent);
   the special sources each get a distinct left-edge accent, mirrored in the legend. */
export const KIND_META: Record<CalKind, { label: string; accent: string }> = {
  standard: { label: 'Parsha',  accent: '' },
  occasion: { label: 'Holiday', accent: '#f59e0b' },
  weekday:  { label: 'Weekday', accent: '#a78bfa' },
  hosafah:  { label: 'Hosafah', accent: '#f472b6' },
};

function kindStripe(kind: CalKind): React.CSSProperties {
  const accent = KIND_META[kind].accent;
  return accent ? { boxShadow: `inset 3px 0 0 0 ${accent}` } : {};
}

/* Small pill naming a non-standard reading type; standard parsha readings render nothing. */
export function KindBadge({ kind }: Readonly<{ kind: CalKind }>) {
  const { label, accent } = KIND_META[kind];
  if (!accent) return null;
  return <span className="cal-kind-badge" style={{ color: accent, borderColor: accent }}>{label}</span>;
}

function chipProps(r: CalEntry, color: string): { className: string; style: React.CSSProperties } {
  const stripe = kindStripe(r.kind);
  if (r.isReread) return { className: 'cal-event reread', style: { borderColor: color, color, ...stripe } };
  if (r.isFuture) return { className: 'cal-event future', style: { background: futureBg(color), borderColor: color, ...stripe } };
  return { className: 'cal-event', style: { background: color, ...stripe } };
}

function tipPosFromRect(rect: DOMRect) { return positionTooltip(rect, CAL_TIP_W, CAL_TIP_H, CAL_TIP_GAP); }

interface CalDayTooltipProps {
  dateStr: string;
  readings: CalEntry[];
  pos: { x: number; y: number };
  SEFER_MAP: Record<string, SeferMeta>;
}

function CalDayTooltip({ dateStr, readings, pos, SEFER_MAP }: Readonly<CalDayTooltipProps>) {
  return (
    <div className="cal-day-tip" style={{ left: pos.x, top: pos.y }}>
      <div className="cal-tip-date">{fmtDate(dateStr)}</div>
      {readings.map((r, i) => {
        const color = SEFER_MAP[r.sefer]?.color ?? '#888';
        return (
          <div key={`${r.parsha}-${r.aliyah}-${i}`} className="cal-tip-row">
            <SeferDot color={color} reread={r.isReread} />
            <span className="hebrew" style={{ color, fontSize: 12 }}>{r.parsha}</span>
            <span className="cal-aliyah-label"> · {fmtAliyah(r.aliyah)}</span>
            <KindBadge kind={r.kind} />
            <ReadingStatusBadges isReread={r.isReread} isFuture={r.isFuture} compact />
            <span className="cal-pseukim-label">{r.pseukim} pseukim</span>
          </div>
        );
      })}
    </div>
  );
}

interface MonthGridProps {
  year: number;
  month: number;
  dayMap: Record<string, CalEntry[]>;
  SEFER_MAP: Record<string, SeferMeta>;
}

export function MonthGrid({ year, month, dayMap, SEFER_MAP }: Readonly<MonthGridProps>) {
  const [tipDate, setTipDate] = useState<string | null>(null);
  const [tipPos,  setTipPos]  = useState({ x: 0, y: 0 });

  useEffect(() => {
    function dismiss(e: MouseEvent) {
      if (!(e.target as Element).closest('.cal-day.has-readings')) setTipDate(null);
    }
    document.addEventListener('click', dismiss);
    return () => document.removeEventListener('click', dismiss);
  }, []);

  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const emptyCells  = Array.from({ length: firstDow }, (_, i) => ({ type: 'empty' as const, id: `${year}-${month}-pre-${i}` }));
  const dayCells    = Array.from({ length: daysInMonth }, (_, i) => ({ type: 'day' as const, d: i + 1 }));
  const cells       = [...emptyCells, ...dayCells];

  return (
    <div>
      <div className="cal-grid cal-dow-header">
        {DOW.map(d => <div key={d} className="cal-dow">{d}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map(cell => {
          if (cell.type === 'empty') return <div key={cell.id} className="cal-day other-month" />;
          const { d } = cell;
          const mm       = String(month + 1).padStart(2, '0');
          const dd       = String(d).padStart(2, '0');
          const dateStr  = `${year}-${mm}-${dd}`;
          const readings  = dayMap[dateStr];
          const hasR      = readings && readings.length > 0;
          const shown     = hasR ? readings.slice(0, 2) : [];
          const extra     = hasR ? readings.length - 2 : 0;
          const allFuture = hasR && readings.every(r => r.isFuture);
          const cellContent = (
            <>
              <span className="cal-day-num">{d}</span>
              {hasR && (
                <div className="cal-events">
                  {shown.map((r, j) => {
                    const color = SEFER_MAP[r.sefer]?.color ?? '#888';
                    const { className, style } = chipProps(r, color);
                    return (
                      <div key={`${r.parsha}-${r.aliyah}-${j}`} className={className} style={style}>
                        <span className="hebrew">{r.parsha}</span>
                        <span className="cal-event-aliyah"> {fmtAliyah(r.aliyah, true)}</span>
                      </div>
                    );
                  })}
                  {extra > 0 && <div className="cal-extra">+{extra} more</div>}
                </div>
              )}
            </>
          );
          return hasR ? (
            <button
              type="button"
              key={dateStr}
              className={`cal-day has-readings${allFuture ? ' all-future' : ''}`}
              onClick={e => {
                if (tipDate === dateStr) { setTipDate(null); return; }
                setTipPos(tipPosFromRect(e.currentTarget.getBoundingClientRect()));
                setTipDate(dateStr);
              }}
            >{cellContent}</button>
          ) : (
            <div key={dateStr} className="cal-day">{cellContent}</div>
          );
        })}
      </div>
      {tipDate && dayMap[tipDate] && (
        <CalDayTooltip dateStr={tipDate} readings={dayMap[tipDate]} pos={tipPos} SEFER_MAP={SEFER_MAP} />
      )}
    </div>
  );
}
