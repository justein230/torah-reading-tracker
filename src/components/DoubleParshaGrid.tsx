import React from 'react';
import { Box } from '@mantine/core';
import { useApp } from '../context/AppContext.js';
import { useAliyahTooltip, AliyahTooltip, TouchAwareCell, type CellHandlers } from './AliyahTooltip.js';
import { GridLegend } from './GridLegend.js';
import { SeferSection } from './shared/SeferSection.js';
import { aliyahCellStyle, aliyahState, fmtPct } from '../utils.js';
import { isAliyahRead, isAliyahPartial, countReadAliyot, computePairTotalPseukim, computePairReadPseukim } from '../compute.js';
import type { MappedRow, ParshaPair } from '../types/index.js';
import './Grid.css';

const ALIYOT = [1, 2, 3, 4, 5, 6, 7];

interface DoubleCellProps {
  readonly rows: MappedRow[];
  readonly color: string;
  readonly pairNameHeb: string;
  readonly pairNameEn: string;
  readonly aliyahNum: number;
  readonly pairTotalPseukim: number;
  readonly showDoublePairTip: (e: React.MouseEvent | React.TouchEvent, heb: string, en: string, num: number, rows: MappedRow[], color: string, pairTotalPseukim: number) => void;
  readonly handlers: CellHandlers;
}

function DoubleCell({ rows, color, pairNameHeb, pairNameEn, aliyahNum, pairTotalPseukim, showDoublePairTip, handlers }: DoubleCellProps) {
  const isReadPast   = isAliyahRead(rows);
  const isReadFuture = !isReadPast && rows.some(r => r.readAsDouble && r.isReadFuture);
  const hasReread    = isReadPast && rows.some(r => r.readAsDouble && r.hasFuture);

  const state = aliyahState({ isReadPast, isReadFuture, partialOrig: isAliyahPartial(rows) });
  const { bg, border, dashed } = aliyahCellStyle(state, color);

  return (
    <TouchAwareCell
      bg={bg} border={border} dashed={dashed}
      onShowTip={e => showDoublePairTip(e, pairNameHeb, pairNameEn, aliyahNum, rows, color, pairTotalPseukim)}
      handlers={handlers}
    >
      {hasReread && <span className="reread-dot" />}
    </TouchAwareCell>
  );
}

function buildPairRows(allRows: MappedRow[]): Record<string, Record<number, MappedRow[]>> {
  const result: Record<string, Record<number, MappedRow[]>> = {};
  for (const r of allRows) {
    if (!r.pairName || r.combinedAliyah === null) continue;
    let caMap = result[r.pairName];
    if (!caMap) { caMap = {}; result[r.pairName] = caMap; }
    let arr = caMap[r.combinedAliyah];
    if (!arr) { arr = []; caMap[r.combinedAliyah] = arr; }
    arr.push(r);
  }
  return result;
}

function buildPairsBySefer(
  pairs: ParshaPair[],
  parshaById: Record<number, string>,
  parshaToSefer: Record<string, string>,
): Record<string, ParshaPair[]> {
  const result: Record<string, ParshaPair[]> = {};
  for (const pair of pairs) {
    const parsha1 = parshaById[pair.parsha1_id];
    if (!parsha1) continue;
    const sefer = parshaToSefer[parsha1];
    if (!sefer) continue;
    let arr = result[sefer];
    if (!arr) { arr = []; result[sefer] = arr; }
    arr.push(pair);
  }
  return result;
}

export default function DoubleParshaGrid() {
  const { allRows, pairs, parshaById, SEFER_ORDER, SEFER_MAP, TLIT } = useApp();
  const { tip, tipPos, showDoublePairTip, handlers } = useAliyahTooltip();

  const parshaToSefer: Record<string, string> = {};
  for (const r of allRows) parshaToSefer[r.parsha] = r.sefer;

  const pairRows     = buildPairRows(allRows);
  const pairsBySefer = buildPairsBySefer(pairs, parshaById, parshaToSefer);

  return (
    <Box>
      <GridLegend show={['read', 'scheduled', 'reread', 'partial', 'unread']} />
      <div className="sefer-grid">
        {SEFER_ORDER.filter(s => pairsBySefer[s]?.length).map(s => {
          const seferMeta = SEFER_MAP[s];
          if (!seferMeta) return null;
          const { en, color } = seferMeta;
          const seferPairs = pairsBySefer[s] ?? [];

          const totalAliyot  = seferPairs.length * ALIYOT.length;
          const readAliyot   = seferPairs.reduce((sum, pair) => sum + countReadAliyot(pairRows[pair.name] ?? {}, ALIYOT), 0);
          const totalPseukim = seferPairs.reduce((sum, pair) => sum + computePairTotalPseukim(pairRows[pair.name] ?? {}, ALIYOT), 0);
          const readPseukim  = seferPairs.reduce((sum, pair) => sum + computePairReadPseukim(pairRows[pair.name] ?? {}, ALIYOT), 0);
          const aPct         = fmtPct(readAliyot, totalAliyot, 1);

          return (
            <SeferSection
              key={s}
              title={<><span className="hebrew heb" style={{ color }}>{s}</span><span className="eng">{en}</span></>}
              badge={<>{readAliyot}/{totalAliyot} Aliyot &bull; {readPseukim}/{totalPseukim} Pseukim &bull; {aPct}%</>}
              columnKeys={ALIYOT}
            >
              {seferPairs.map(pair => {
                const caMap           = pairRows[pair.name] ?? {};
                const pairTotalPs     = computePairTotalPseukim(caMap, ALIYOT);
                const pairReadCount   = countReadAliyot(caMap, ALIYOT);
                const pairPct         = fmtPct(pairReadCount, ALIYOT.length, 0);
                return (
                <div key={pair.id} className="parsha-row">
                  <div className="parsha-label">
                    <span className="hebrew heb">{pair.name}</span>
                    <span className="eng">{TLIT[pair.name] ?? pair.name_en}</span>
                  </div>
                  <div className="aliyah-cells">
                    {ALIYOT.map(ca => (
                      <DoubleCell
                        key={ca}
                        rows={caMap[ca] ?? []}
                        color={color}
                        pairNameHeb={pair.name}
                        pairNameEn={pair.name_en}
                        aliyahNum={ca}
                        pairTotalPseukim={pairTotalPs}
                        showDoublePairTip={showDoublePairTip}
                        handlers={handlers}
                      />
                    ))}
                  </div>
                  <span className="badge" style={{ color: 'var(--text)', fontSize: 10, whiteSpace: 'nowrap' }}>
                    {pairReadCount}/7 ({pairPct}%)
                  </span>
                </div>
                );
              })}
            </SeferSection>
          );
        })}
      </div>
      <AliyahTooltip tip={tip} pos={tipPos} />
    </Box>
  );
}
