import React, { useEffect } from 'react';
import { isSeferAllowed } from '../compute.js';
import { buildParshaRow, sortParshas } from '../utils/details-utils.js';
import './Details.css';
import { Box, Text } from '@mantine/core';
import { SeferDot } from './shared/SeferDot.js';
import { SortButtons } from './shared/ToggleButtons.js';
import { useApp } from '../context/AppContext.js';
import { fmtDate, hex } from '../utils.js';
import { useAliyahTooltip, AliyahTooltip, isTouch } from './AliyahTooltip.js';
import type { MappedRow } from '../types/index.js';

interface AliyahDotProps {
  color: string;
  isRead: boolean;
  hasFut: boolean;
  row: MappedRow | undefined;
  showTip: (e: React.MouseEvent | React.TouchEvent, r: MappedRow) => void;
  moveTipPos: (e: React.MouseEvent) => void;
  positionFromRect: (rect: DOMRect) => void;
  hideTip: () => void;
}

function AliyahDot({ color, isRead, hasFut, row, showTip, moveTipPos, positionFromRect, hideTip }: Readonly<AliyahDotProps>) {
  let bg: string, border: string;
  if (isRead)               { bg = color;                                                          border = color; }
  else if (hasFut)          { bg = 'transparent';                                                  border = hex(color, 0.7); }
  else if (row?.partialOrig){ bg = `linear-gradient(to right, ${color} 50%, ${color}44 50%)`;     border = color + 'aa'; }
  else                      { bg = 'var(--surface)';                                               border = 'var(--border)'; }

  function handleTouchClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (!row) return;
    document.querySelectorAll('.dot-active').forEach(el => el.classList.remove('dot-active'));
    e.currentTarget.classList.add('dot-active');
    showTip(e, row);
    positionFromRect(e.currentTarget.getBoundingClientRect());
  }

  const mouseInteractive = !isTouch && row !== undefined;
  return (
    <button
      type="button"
      className="dot"
      style={{ background: bg, borderColor: border, cursor: row ? 'pointer' : 'default', padding: 0 }}
      onMouseEnter={mouseInteractive ? e => showTip(e, row) : undefined}
      onMouseMove={mouseInteractive ? moveTipPos : undefined}
      onMouseLeave={mouseInteractive ? hideTip : undefined}
      onClick={isTouch && row ? handleTouchClick : undefined}
    />
  );
}

export default function Details() {
  const { allRows, SEFER_ORDER, SEFER_MAP, TLIT, parshaIndex, filters, sortMode, setSortMode, schedule,
          occasionAliyot, weekdayAliyot, hosafotReadings } = useApp();
  const { tip, tipPos, showTip, moveTipPos, positionFromRect, hideTip } = useAliyahTooltip();

  useEffect(() => {
    if (!isTouch) return;
    function onDocClick(e: MouseEvent) {
      if (!(e.target as Element).closest('.dot')) hideTip();
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [hideTip]);

  const totalTorahPseukim = allRows.reduce((s, r) => s + r.pseukim, 0);
  const partials = { oa: occasionAliyot, wa: weekdayAliyot, hr: hosafotReadings, totalTorahPseukim };

  const parshas = [];
  let idx = 1;
  for (const s of SEFER_ORDER) {
    for (const p of (parshaIndex[s] ?? [])) {
      const rows    = allRows.filter(r => r.parsha === p);
      const seferOk = isSeferAllowed(s, filters);
      parshas.push(buildParshaRow(rows, p, s, seferOk, filters, { TLIT, schedule, partials }, idx++));
    }
  }

  sortParshas(parshas, sortMode);

  return (
    <Box>
      <Box className="sort-bar">
        <Text size="sm" c="dimmed">Sort:</Text>
        <SortButtons
          value={sortMode}
          onChange={v => setSortMode(String(v ?? 'order'))}
          options={[
            { value: 'order', label: 'Torah Order' },
            { value: 'complete', label: 'Most Complete' },
            { value: 'recent', label: 'Most Recent' },
          ]}
          variant="outline"
          className="window-btn"
        />
      </Box>

      <Box style={{ overflowX: 'auto' }}>
        <table className="table-base">
          <thead>
            <tr className="tr-divider-strong">
              {['#', 'Parsha', 'Book', 'Aliyot', 'Pseukim', '% Parsha', '% Torah', 'Last Read', 'Next Reading'].map(h => (
                <th key={h} className="th-base">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {parshas.map(p => {
              const color = SEFER_MAP[p.sefer]?.color ?? '#888';
              const dots = [1, 2, 3, 4, 5, 6, 7].map(a => {
                const isRead = p.readSet.has(a);
                const hasFut = p.hasFutureSet.has(a);
                const row    = allRows.find(r => r.parsha === p.parsha && r.aliyah === a);
                return (
                  <AliyahDot key={a} color={color} isRead={isRead} hasFut={hasFut} row={row}
                    showTip={showTip} moveTipPos={moveTipPos}
                    positionFromRect={positionFromRect} hideTip={hideTip} />
                );
              });

              const partialCount = p.rows.filter(r => r.partialOrig && !r.isReadPast).length;
              const maftirRow = allRows.find(r => r.parsha === p.parsha && Number(r.aliyah) === 8);
              const maftirDot = (
                <AliyahDot key={8} color={color} isRead={p.readSet.has(8)} hasFut={p.hasFutureSet.has(8)} row={maftirRow}
                  showTip={showTip} moveTipPos={moveTipPos}
                  positionFromRect={positionFromRect} hideTip={hideTip} />
              );

              return (
                <tr key={p.parsha} className="tr-divider" style={{ opacity: p.seferOk ? 1 : 0.35 }}>
                  <td className="td-base" style={{ color: 'var(--muted2)', fontSize: 12 }}>{p.idx}</td>
                  <td className="td-base">
                    <Text className="hebrew parsha-heb" fw={600} size="sm" style={{ color }}>{p.parsha}</Text>
                    <Text size="xs" c="dimmed">{TLIT[p.parsha] ?? ''}</Text>
                  </td>
                  <td className="td-base">
                    <span className="sefer-cell">
                      <SeferDot color={color} />
                      <span style={{ fontSize: 13 }}>{SEFER_MAP[p.sefer]?.en}</span>
                    </span>
                  </td>
                  <td className="td-base">
                    <div className="dot-row">
                      {dots}
                      <span style={{ width: 4, display: 'inline-block' }} />
                      {maftirDot}
                    </div>
                    <Text size="xs" c="dimmed" mt={4}>{p.readAliyot}/{p.rows.length}{partialCount > 0 ? ` (+${partialCount}p)` : ''}</Text>
                  </td>
                  <td className="td-base">
                    <div style={{ fontSize: 13 }}>{p.readPseukim}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted2)' }}>/ {p.totalPseukim}</div>
                  </td>
                  <td className="td-base">
                    <div style={{ fontSize: 13 }}>{p.parshaReadPct > 0 ? p.parshaReadPct.toFixed(1) + '%' : '—'}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted2)' }}>/ 100%</div>
                  </td>
                  <td className="td-base">
                    <div style={{ fontSize: 13 }}>{p.readPct > 0 ? p.readPct.toFixed(2) + '%' : '—'}</div>
                    <div style={{ fontSize: 13, color: 'var(--muted2)' }}>/ {p.totalPct.toFixed(2)}%</div>
                  </td>
                  <td className="td-base td-sm" style={{ color: 'var(--muted)' }}>{p.lastDate ? fmtDate(p.lastDate) : '—'}</td>
                  <td className="td-base td-sm" style={{ color: 'var(--muted)' }}>{p.nextReadDate ? fmtDate(p.nextReadDate) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Box>
      <AliyahTooltip tip={tip} pos={tipPos} />
    </Box>
  );
}
