import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.js';
import { fmtDate, fmtAliyah, fmtPct } from '../utils.js';
import { positionTooltip } from '../utils/tooltip.js';
import type { MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, TipData, TipRow } from '../types/index.js';
import './AliyahTooltip.css';

export const isTouch = globalThis.window !== undefined && globalThis.matchMedia('(pointer: coarse)').matches;

/** Bundled tooltip event handlers threaded through grid cells as a single prop. */
export interface CellHandlers {
  moveTipPos: (e: React.MouseEvent) => void;
  positionFromRect: (rect: DOMRect) => void;
  hideTip: () => void;
}


const ALIYAH_TIP_W = 220; /* aliyah tooltip width in px */
const ALIYAH_TIP_H = 150; /* aliyah tooltip height in px */
const ALIYAH_TIP_GAP = 8; /* gap between target cell and tooltip in px */

export function useAliyahTooltip() {
  const { SEFER_MAP, TLIT, stats } = useApp();
  const [tip,    setTip]    = useState<TipData | null>(null);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });

  const moveTipPos = useCallback((e: React.MouseEvent) => {
    let x = e.clientX + 14, y = e.clientY + 14;
    if (x + ALIYAH_TIP_W > globalThis.innerWidth  - 10) x = e.clientX - ALIYAH_TIP_W - 10;
    if (y + ALIYAH_TIP_H > globalThis.innerHeight - 10) y = e.clientY - ALIYAH_TIP_H - 10;
    setTipPos({ x, y });
  }, []);

  const positionFromRect = useCallback((rect: DOMRect) => {
    setTipPos(positionTooltip(rect, ALIYAH_TIP_W, ALIYAH_TIP_H, ALIYAH_TIP_GAP));
  }, []);

  const showOccasionTip = useCallback((e: React.MouseEvent | React.TouchEvent, oa: MappedOccasionAliyah, occasionName: string) => {
    const torahTotal = stats?.totalPseukim ?? 0;
    const pctOfTorah = torahTotal ? fmtPct(oa.pseukim, torahTotal) + '%' : '—';
    const tipRows: TipRow[] = [
      { k: 'Sefer',      hebrew: oa.sefer,  suffix: ` (${oa.seferEn})` },
      { k: 'Parsha',     hebrew: oa.parsha, suffix: ` — ${oa.parshaEn}` },
      { k: 'Pseukim',    v: oa.pseukim },
      { k: '% of Torah', v: pctOfTorah },
      { k: 'Verses',     v: `${oa.chapterStart}:${oa.verseStart}–${oa.chapterEnd}:${oa.verseEnd}` },
    ];
    if (oa.isReadPast)                    tipRows.push({ k: 'Read',         v: fmtDate(oa.orig) });
    if (oa.isReadFuture)                  tipRows.push({ k: 'Upcoming',     v: fmtDate(oa.orig) });
    if (!oa.isReadPast && oa.partialOrig) tipRows.push({ k: 'Partial read', v: fmtDate(oa.partialOrig) });
    if (oa.hasFuture)                     tipRows.push({ k: 'Re-read on', v: oa.allDates.filter(d => d > new Date().toISOString().slice(0, 10)).map(fmtDate).join(', ') });
    setTip({ _color: oa.seferColor, _tlit: occasionName, _aliyah: fmtAliyah(oa.aliyahKey), _tipRows: tipRows });
    if ('clientX' in e) moveTipPos(e);
  }, [moveTipPos, stats]);

  const showTip = useCallback((e: React.MouseEvent | React.TouchEvent, r: MappedRow) => {
    const seferMeta = SEFER_MAP[r.sefer];
    const color = seferMeta?.color ?? '#888';
    const tipRows: TipRow[] = [
      { k: 'Sefer',      hebrew: r.sefer,   suffix: ` (${seferMeta?.en ?? r.sefer})` },
      { k: 'Parsha',     hebrew: r.parsha,  suffix: ` — ${TLIT[r.parsha] ?? ''}` },
      { k: 'Aliyah',     v: fmtAliyah(r.aliyah) },
      { k: 'Pseukim',    v: r.pseukim },
      { k: '% of Parsha', v: (r.parshaPct ?? 0).toFixed(1) + '%' },
      { k: '% of Torah',  v: r.pct.toFixed(2) + '%' },
    ];
    if (r.chapterStart > 0) tipRows.push({ k: 'Verses', v: `${r.chapterStart}:${r.verseStart}–${r.chapterEnd}:${r.verseEnd}` });
    if (r.isRead)          tipRows.push({ k: r.isReadFuture ? 'Upcoming' : 'Read', v: fmtDate(r.orig) });
    if (!r.isRead && r.partialOrig) tipRows.push({ k: 'Partial read', v: fmtDate(r.partialOrig) });
    if (r.occasion)     tipRows.push({ k: 'Occasion',      v: r.occasion });
    if (r.hasFuture)    tipRows.push({ k: 'Re-read on',    v: r.futDates.map(fmtDate).join(', ') });
    if (r.pairName)    tipRows.push({ k: 'Double Parsha', hebrew: r.pairName });
    setTip({ _color: color, _tlit: TLIT[r.parsha] ?? r.parsha, _aliyah: fmtAliyah(r.aliyah), _tipRows: tipRows });
    if ('clientX' in e) moveTipPos(e);
  }, [SEFER_MAP, TLIT, moveTipPos]);

  const showDoublePairTip = useCallback((
    e: React.MouseEvent | React.TouchEvent,
    pairNameHeb: string,
    pairNameEn: string,
    combinedAliyahNum: number,
    rows: MappedRow[],
    color: string,
    pairTotalPseukim: number,
  ) => {
    const torahPct      = rows.reduce((s, r) => s + r.pct, 0).toFixed(2);
    const aliyahPseukim = rows.reduce((s, r) => s + r.pseukim, 0);
    const doublePct     = pairTotalPseukim ? fmtPct(aliyahPseukim, pairTotalPseukim, 1) + '%' : '—';
    const firstRow      = rows[0];
    const lastRow       = rows.length > 0 ? rows[rows.length - 1] : undefined;
    const versesStr     = firstRow && lastRow ? `${firstRow.chapterStart}:${firstRow.verseStart}–${lastRow.chapterEnd}:${lastRow.verseEnd}` : '—';
    const tipRows: TipRow[] = [
      { k: 'Double Parsha',      hebrew: pairNameHeb, suffix: ` (${pairNameEn})` },
      { k: 'Aliyah',             v: combinedAliyahNum },
      { k: 'Pseukim',            v: aliyahPseukim },
      { k: '% of Double Parsha', v: doublePct },
      { k: '% of Torah',         v: `${torahPct}%` },
      { k: 'Verses',             v: versesStr },
    ];
    const firstRead   = rows.find(r => r.readAsDouble && r.isReadPast);
    const firstFuture = rows.find(r => r.readAsDouble && r.isReadFuture);
    if (firstRead)   tipRows.push({ k: 'Read',     v: fmtDate(firstRead.orig)   });
    if (firstFuture) tipRows.push({ k: 'Upcoming', v: fmtDate(firstFuture.orig) });
    if (!firstRead && !firstFuture) {
      const partialDates = rows.flatMap(r => [r.isReadPast ? r.orig : '', r.partialOrig]).filter(Boolean);
      if (partialDates.length) {
        const earliest = [...partialDates].sort((a, b) => a.localeCompare(b))[0]!;
        tipRows.push({ k: 'Partial read', v: fmtDate(earliest) });
      }
    }
    const reroadDates = [...new Set(rows.flatMap(r => r.futDates))].sort((a, b) => a.localeCompare(b));
    if (reroadDates.length) tipRows.push({ k: 'Re-read on', v: reroadDates.map(fmtDate).join(', ') });
    tipRows.push({ k: 'Regular Aliyot', v: rows.map(r => `${TLIT[r.parsha] ?? r.parsha} ${r.aliyah}`).join(', ') });
    setTip({ _color: color, _tlit: pairNameEn, _aliyah: `Aliyah ${combinedAliyahNum}`, _tipRows: tipRows });
    if ('clientX' in e) moveTipPos(e);
  }, [TLIT, moveTipPos]);

  const showWeekdayTip = useCallback((e: React.MouseEvent | React.TouchEvent, wa: MappedWeekdayAliyah, coveredBy?: { date: string; label: string }) => {
    const torahTotal = stats?.totalPseukim ?? 0;
    const pctOfTorah = torahTotal ? fmtPct(wa.pseukim, torahTotal) + '%' : '—';
    const tipRows: TipRow[] = [
      { k: 'Sefer',       hebrew: wa.sefer,  suffix: ` (${wa.seferEn})` },
      { k: 'Parsha',      hebrew: wa.parsha, suffix: ` — ${wa.parshaEn}` },
      { k: 'Pseukim',     v: wa.pseukim },
      { k: '% of Torah',  v: pctOfTorah },
      { k: 'Verses',      v: `${wa.chapterStart}:${wa.verseStart}–${wa.chapterEnd}:${wa.verseEnd}` },
    ];
    if (wa.isReadPast)                                tipRows.push({ k: 'Read',           v: fmtDate(wa.dateRead) });
    if (wa.isReadFuture)                              tipRows.push({ k: 'Upcoming',       v: fmtDate(wa.dateRead) });
    if (wa.hasFuture)                                 tipRows.push({ k: 'Re-read on',     v: wa.allDates.filter(d => d > new Date().toISOString().slice(0, 10)).map(fmtDate).join(', ') });
    if (!wa.dateRead && coveredBy)                    tipRows.push({ k: coveredBy.label,  v: fmtDate(coveredBy.date) });
    if (!wa.dateRead && !coveredBy && wa.partialOrig) tipRows.push({ k: 'Partial read',   v: fmtDate(wa.partialOrig) });
    setTip({ _color: wa.seferColor, _tlit: wa.parshaEn, _aliyah: `Weekday ${wa.aliyahNum}`, _tipRows: tipRows });
    if ('clientX' in e) moveTipPos(e);
  }, [moveTipPos, stats]);

  const hideTip = useCallback(() => {
    document.querySelectorAll('.acell-raised, .dot-active').forEach(el => el.classList.remove('acell-raised', 'dot-active'));
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
    () => ({ moveTipPos, positionFromRect, hideTip }),
    [moveTipPos, positionFromRect, hideTip],
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
  const { moveTipPos, positionFromRect, hideTip } = handlers;
  function handleTouchClick(e: React.MouseEvent<HTMLButtonElement>) {
    document.querySelectorAll('.acell-raised').forEach(el => el.classList.remove('acell-raised'));
    e.currentTarget.classList.add('acell-raised');
    onShowTip(e);
    positionFromRect(e.currentTarget.getBoundingClientRect());
  }
  return (
    <button
      type="button"
      className={`acell${dashed ? ' dashed' : ''}`}
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
