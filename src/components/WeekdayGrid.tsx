import { Box } from '@mantine/core';
import { useApp } from '../context/AppContext.js';
import { useAliyahTooltip, AliyahTooltip, TouchAwareCell, type CellHandlers } from './AliyahTooltip.js';
import { GridLegend } from './GridLegend.js';
import { SeferSection } from './shared/SeferSection.js';
import { versesOverlap, aliyahCellStyle, aliyahState, fmtPct } from '../utils.js';
import type { MappedWeekdayAliyah } from '../types/index.js';
import './Grid.css';

type CoveredBy = { date: string; label: string };

function cellColors(wa: MappedWeekdayAliyah, coveredBy: CoveredBy | undefined, color: string) {
  // coveredBy (a Shabbat/holiday reading that includes this weekday aliyah) counts as read.
  const state = aliyahState({ isReadPast: wa.isReadPast || !!coveredBy, isReadFuture: wa.isReadFuture, partialOrig: wa.partialOrig });
  return { ...aliyahCellStyle(state, color), op: 1 };
}

type ShowWeekdayTip = (e: React.MouseEvent | React.TouchEvent, wa: MappedWeekdayAliyah, coveredBy?: CoveredBy) => void;

interface WeekdayCellProps {
  wa: MappedWeekdayAliyah;
  coveredBy: CoveredBy | undefined;
  color: string;
  showWeekdayTip: ShowWeekdayTip;
  handlers: CellHandlers;
}

function WeekdayCell({ wa, coveredBy, color, showWeekdayTip, handlers }: Readonly<WeekdayCellProps>) {
  const { bg, border, op, dashed } = cellColors(wa, coveredBy, color);
  return (
    <TouchAwareCell
      bg={bg} border={border} op={op} dashed={dashed}
      onShowTip={(e: React.MouseEvent | React.TouchEvent) => showWeekdayTip(e, wa, coveredBy)}
      handlers={handlers}
    >
      {wa.isReadPast && wa.hasFuture && <span className="reread-dot" />}
    </TouchAwareCell>
  );
}

function buildHolidayCoverById(
  weekdayAliyot: MappedWeekdayAliyah[],
  occasionAliyot: ReturnType<typeof useApp>['occasionAliyot'],
): Map<number, CoveredBy> {
  const map = new Map<number, CoveredBy>();
  for (const wa of weekdayAliyot) {
    for (const oa of occasionAliyot) {
      if (oa.parsha !== wa.parsha || !oa.isReadPast) continue;
      if (versesOverlap(oa, wa)) {
        const existing = map.get(wa.id);
        if (!existing || oa.orig < existing.date)
          map.set(wa.id, { date: oa.orig, label: oa.occasionEn });
      }
    }
  }
  return map;
}

export default function WeekdayGrid() {
  const { weekdayAliyot, occasionAliyot, allRows, SEFER_ORDER, SEFER_MAP, parshaIndex } = useApp();
  const { tip, tipPos, showWeekdayTip, handlers } = useAliyahTooltip();

  const waByParsha: Record<string, MappedWeekdayAliyah[]> = {};
  for (const wa of weekdayAliyot) {
    waByParsha[wa.parsha] ??= [];
    waByParsha[wa.parsha]!.push(wa);
  }

  const shabbatOrigByParsha: Record<string, string> = {};
  for (const row of allRows) {
    if (row.aliyah === 1 && row.isReadPast) shabbatOrigByParsha[row.parsha] = row.orig;
  }

  const holidayCoverById = buildHolidayCoverById(weekdayAliyot, occasionAliyot);

  return (
    <Box>
      <GridLegend show={['read', 'scheduled', 'reread', 'partial', 'unread']} />

      <div className="sefer-grid">
      {SEFER_ORDER.map(sefer => {
        const parshas = parshaIndex[sefer] ?? [];
        const color   = SEFER_MAP[sefer]?.color ?? '#888';
        const allWa      = parshas.flatMap(p => waByParsha[p] ?? []);
        const totalCount = allWa.length;
        const readCount  = allWa.filter(wa => wa.isReadPast || holidayCoverById.has(wa.id) || shabbatOrigByParsha[wa.parsha] !== undefined).length;
        const aPct       = fmtPct(readCount, totalCount);

        return (
          <SeferSection
            key={sefer}
            title={<><span className="heb" style={{ color }}>{sefer}</span><span className="eng" style={{ color }}>{SEFER_MAP[sefer]?.en}</span></>}
            badge={<>{readCount}/{totalCount} Aliyot &bull; {aPct}%</>}
            columnKeys={[1, 2, 3]}
          >
            {parshas.map(parsha => {
              const aliyot = waByParsha[parsha] ?? [];
              if (!aliyot.length) return null;
              const shabbatOrig = shabbatOrigByParsha[parsha];
              return (
                <div key={parsha} className="parsha-row">
                  <div className="parsha-label">
                    <span className="heb">{parsha}</span>
                    <span className="eng">{aliyot[0]!.parshaEn}</span>
                  </div>
                  <div className="aliyah-cells">
                    {aliyot.map(wa => {
                      const coveredBy = shabbatOrig
                        ? { date: shabbatOrig, label: 'Read' }
                        : holidayCoverById.get(wa.id);
                      return (
                        <WeekdayCell
                          key={wa.id}
                          wa={wa} coveredBy={coveredBy} color={color}
                          showWeekdayTip={showWeekdayTip}
                          handlers={handlers}
                        />
                      );
                    })}
                  </div>
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
