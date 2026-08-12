import React, { useMemo } from 'react';
import { isSeferAllowed } from '../compute.js';
import './Grid.css';
import { Box } from '@mantine/core';
import { useApp } from '../context/AppContext.js';
import { useAliyahTooltip, AliyahTooltip, TouchAwareCell, type CellHandlers } from './AliyahTooltip.js';
import { aliyahCellStyle, aliyahState, fmtPct } from '../utils.js';
import { GridLegend } from './GridLegend.js';
import { SeferSection } from './shared/SeferSection.js';
import type { MappedRow, Filters, SeferMeta } from '../types/index.js';

function cellStyle(r: MappedRow, filters: Filters, SEFER_MAP: Record<string, SeferMeta>) {
  const color = SEFER_MAP[r.sefer]?.color ?? '#888';
  if (!isSeferAllowed(r.sefer, filters)) {
    return { bg: 'var(--surface)', border: 'var(--surface-mid)', op: 0.25, dashed: false };
  }
  if (r.isReadPast && filters.years.length) {
    const match = r.yearRead !== null && filters.years.includes(r.yearRead);
    if (match) return { bg: color, border: color, op: 1, dashed: false };
    return { bg: `repeating-linear-gradient(45deg,var(--surface),var(--surface) 4px,${color}88 4px,${color}88 8px)`, border: color + '88', op: 1, dashed: false };
  }
  const state = aliyahState({ isReadPast: r.isReadPast, isReadFuture: r.isReadFuture || r.hasFuture, partialOrig: r.partialOrig });
  return { ...aliyahCellStyle(state, color), op: 1 };
}

interface AliyahCellProps {
  readonly r: MappedRow;
  readonly filters: Filters;
  readonly SEFER_MAP: Record<string, SeferMeta>;
  readonly showTip: (e: React.MouseEvent | React.TouchEvent, r: MappedRow) => void;
  readonly handlers: CellHandlers;
}

function AliyahCell({ r, filters, SEFER_MAP, showTip, handlers }: AliyahCellProps) {
  const { bg, border, op, dashed } = cellStyle(r, filters, SEFER_MAP);
  return (
    <TouchAwareCell
      bg={bg} border={border} op={op} dashed={dashed}
      onShowTip={e => showTip(e, r)}
      handlers={handlers}
    >
      {r.isRead && r.hasFuture && <span className="reread-dot" />}
    </TouchAwareCell>
  );
}

export default function Grid() {
  const { allRows, SEFER_ORDER, SEFER_MAP, TLIT, parshaIndex, filters, stats } = useApp();
  const { tip, tipPos, showTip, handlers } = useAliyahTooltip();

  const rowLookup = useMemo(() => {
    const lookup: Record<string, MappedRow> = {};
    for (const r of allRows) lookup[r.parsha + '|' + r.aliyah] = r;
    return lookup;
  }, [allRows]);

  if (!stats) return null;

  return (
    <Box>
      <GridLegend show={['read', 'scheduled', 'reread', 'partial', 'unread']} />
      <div className='sefer-grid'>
        {SEFER_ORDER.map(s => {
          const seferMeta = SEFER_MAP[s];
          if (!seferMeta) return null;
          const { en, color } = seferMeta;
          const bs       = stats.bySefer[s];
          if (!bs) return null;
          const dim      = !isSeferAllowed(s, filters);
          const sOpacity = dim ? 0.3 : 1;
          const aPct     = fmtPct(bs.readAliyot, bs.totalAliyot);

          return (
            <SeferSection
              key={s}
              title={<><span className="hebrew heb" style={{ color }}>{s}</span><span className="eng">{en}</span></>}
              badge={<>{bs.readAliyot}/{bs.totalAliyot} Aliyot &bull; {aPct}%</>}
              columnKeys={[1, 2, 3, 4, 5, 6, 7, 8]}
              renderColumnLabel={a => a === 8 ? 'M' : String(a)}
              opacity={sOpacity}
            >
              {(parshaIndex[s] ?? []).map(parsha => (
                <div key={parsha} className="parsha-row">
                  <div className="parsha-label">
                    <span className="hebrew heb">{parsha}</span>
                    <span className="eng">{TLIT[parsha] ?? ''}</span>
                  </div>
                  <div className="aliyah-cells">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(a => {
                      const r = rowLookup[parsha + '|' + a];
                      if (!r) return null;
                      return (
                        <AliyahCell key={a} r={r} filters={filters} SEFER_MAP={SEFER_MAP}
                          showTip={showTip} handlers={handlers} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </SeferSection>
          );
        })}
      </div>
      <AliyahTooltip tip={tip} pos={tipPos} />
    </Box>
  );
}
