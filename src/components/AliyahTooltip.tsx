import React, { useState, useCallback, useMemo, useRef, useEffect, useId } from 'react';
import { useApp } from '../context/AppContext.js';
import { standardTip, occasionTip, weekdayTip, doublePairTip } from '../utils/tooltipRows.js';
import { positionTooltip } from '../utils/tooltip.js';
import { localDateStr } from '../utils/dates.js';
import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, TipData } from '../types/index.js';
import './AliyahTooltip.css';

export const isTouch = globalThis.window !== undefined && globalThis.matchMedia('(pointer: coarse)').matches;

/** Bundled tooltip event handlers threaded through grid cells as a single prop. */
export interface CellHandlers {
  moveTipPos: (e: React.MouseEvent) => void;
  positionFromRect: (rect: DOMRect) => void;
  hideTip: () => void;
  /** Id of the cell the tooltip was opened on by touch, or null. */
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}


const ALIYAH_TIP_W = 220; /* aliyah tooltip width in px */
const ALIYAH_TIP_H = 150; /* aliyah tooltip height in px */
const ALIYAH_TIP_GAP = 8; /* gap between target cell and tooltip in px */

export function useAliyahTooltip() {
  const { SEFER_MAP, TLIT, stats } = useApp();
  const [tip,    setTip]    = useState<TipData | null>(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  // The cell (see TouchAwareCell) a touch last opened the tooltip on; it is drawn raised until hidden.
  const [activeId, setActiveId] = useState<string | null>(null);

  const moveTipPos = useCallback((e: React.MouseEvent) => {
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + ALIYAH_TIP_W > globalThis.innerWidth  - 10) x = e.clientX - ALIYAH_TIP_W - 10;
    if (y + ALIYAH_TIP_H > globalThis.innerHeight - 10) y = e.clientY - ALIYAH_TIP_H - 10;
    setTipPos({ x, y });
  }, []);

  const positionFromRect = useCallback((rect: DOMRect) => {
    setTipPos(positionTooltip(rect, ALIYAH_TIP_W, ALIYAH_TIP_H, ALIYAH_TIP_GAP));
  }, []);

  // Each show* builds its content with a pure function from utils/tooltipRows.ts, stores it, and
  // (for a mouse event) places the tooltip next to the pointer.
  const show = useCallback((e: React.MouseEvent | React.TouchEvent, data: TipData) => {
    setTip(data);
    if ('clientX' in e) moveTipPos(e);
  }, [moveTipPos]);

  const torahTotal = stats?.totalPseukim ?? 0;

  const showOccasionTip = useCallback((e: React.MouseEvent | React.TouchEvent, oa: MappedOccasionAliyah, occasionName: string) => {
    show(e, occasionTip(oa, occasionName, torahTotal, localDateStr()));
  }, [show, torahTotal]);

  const showTip = useCallback((e: React.MouseEvent | React.TouchEvent, r: MappedRow) => {
    show(e, standardTip(r, SEFER_MAP, TLIT));
  }, [show, SEFER_MAP, TLIT]);

  const showDoublePairTip = useCallback((
    e: React.MouseEvent | React.TouchEvent,
    pairNameHeb: string,
    pairNameEn: string,
    combinedAliyahNum: number,
    rows: MappedRow[],
    color: string,
    pairTotalPseukim: number,
  ) => {
    show(e, doublePairTip(pairNameHeb, pairNameEn, combinedAliyahNum, rows, color, pairTotalPseukim, TLIT));
  }, [show, TLIT]);

  const showWeekdayTip = useCallback((e: React.MouseEvent | React.TouchEvent, wa: MappedWeekdayAliyah, coveredBy?: { date: string; label: string }) => {
    show(e, weekdayTip(wa, torahTotal, localDateStr(), coveredBy));
  }, [show, torahTotal]);

  const hideTip = useCallback(() => {
    setActiveId(null);
    setTip(null);
  }, []);

  useEffect(() => {
    if (!isTouch) return;
    document.addEventListener('touchmove', hideTip, { passive: true });
    return () => document.removeEventListener('touchmove', hideTip);
  }, [hideTip]);

  useEffect(() => {
    if (!isTouch) return;
    function onDocClick(e: MouseEvent) {
      if (!(e.target as Element).closest('.acell, .dot')) hideTip();
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [hideTip]);

  // Bundled so grids can thread one prop through their cell components instead of three.
  const handlers = useMemo<CellHandlers>(
    () => ({ moveTipPos, positionFromRect, hideTip, activeId, setActiveId }),
    [moveTipPos, positionFromRect, hideTip, activeId],
  );

  return { tip, tipPos, showTip, showOccasionTip, showWeekdayTip, showDoublePairTip, moveTipPos, positionFromRect, hideTip, handlers };
}

interface TouchAwareCellProps {
  readonly bg: string;
  readonly border: string;
  readonly op?: number;
  readonly dashed?: boolean;
  readonly children?: React.ReactNode;
  readonly onShowTip: (e: React.MouseEvent | React.TouchEvent) => void;
  readonly handlers: CellHandlers;
}

export function TouchAwareCell({ bg, border, op = 1, dashed, children, onShowTip, handlers }: TouchAwareCellProps) {
  const { moveTipPos, positionFromRect, hideTip, activeId, setActiveId } = handlers;
  const id = useId();
  function handleTouchClick(e: React.MouseEvent<HTMLButtonElement>) {
    setActiveId(id);
    onShowTip(e);
    positionFromRect(e.currentTarget.getBoundingClientRect());
  }
  return (
    <button
      type="button"
      className={`acell${dashed ? ' dashed' : ''}${activeId === id ? ' acell-raised' : ''}`}
      style={{ background: bg, borderColor: border, opacity: op, padding: 0 }}
      onMouseEnter={isTouch ? undefined : e => onShowTip(e)}
      onMouseMove={isTouch ? undefined : moveTipPos}
      onMouseLeave={isTouch ? undefined : hideTip}
      onClick={isTouch ? handleTouchClick : undefined}
    >
      {children}
    </button>
  );
}

interface AliyahTooltipProps {
  readonly tip: TipData | null;
  readonly pos: { x: number; y: number };
}

export function AliyahTooltip({ tip, pos }: AliyahTooltipProps) {
  const lastTip = useRef<TipData | null>(null);
  if (tip) lastTip.current = tip;
  const display = tip ?? lastTip.current;

  return (
    <div
      id="tip"
      style={{
        left: pos.x, top: pos.y,
        opacity: tip ? 1 : 0,
        transition: 'opacity 0.15s ease',
        pointerEvents: 'none',
      }}
    >
      {display && <>
        <div className="tip-title" style={{ color: display._color }}>{display._tlit} — {display._aliyah}</div>
        {display._tipRows.map(({ k, v, hebrew, suffix }) => (
          <div key={k} className="tip-row">
            <span>{k}</span>
            <span>
              {hebrew ? <><span className="hebrew">{hebrew}</span>{suffix}</> : v}
            </span>
          </div>
        ))}
      </>}
    </div>
  );
}
