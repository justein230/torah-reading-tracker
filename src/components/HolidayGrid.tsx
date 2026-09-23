import { useState } from 'react';
import { Box, Switch, Text } from '@mantine/core';
import { useApp } from '../context/AppContext.js';
import { useAliyahTooltip, AliyahTooltip, TouchAwareCell, type CellHandlers } from './AliyahTooltip.js';
import { GridLegend } from './GridLegend.js';
import { SeferSection } from './shared/SeferSection.js';
import { ParshaRow } from './shared/ParshaRow.js';
import { aliyahCellStyle, aliyahState, fmtAliyah, fmtPct, groupBy } from '../utils/format.js';
import { CATEGORY_ORDER, CATEGORY_LABELS_GRID, CATEGORY_COLORS } from '../constants.js';
import type { MappedOccasionAliyah } from '../types/index.js';
import './Grid.css';

const ALIYAH_KEYS = ['1', '2', '3', '4', '5', '6', '7', 'M'];


type ShowOccasionTip = (e: React.MouseEvent | React.TouchEvent, oa: MappedOccasionAliyah, occasionName: string) => void;

interface HolidayCellProps {
  oa: MappedOccasionAliyah | undefined;
  color: string;
  occNameEn: string;
  showOccasionTip: ShowOccasionTip;
  handlers: CellHandlers;
}

function HolidayCell({ oa, color, occNameEn, showOccasionTip, handlers }: Readonly<HolidayCellProps>) {
  if (!oa) {
    return <div className="acell" style={{ background: 'transparent', border: '2px dashed var(--cell-unread-border)', opacity: 0.2 }} />;
  }
  const { bg, border, dashed } = aliyahCellStyle(aliyahState(oa), color);
  return (
    <TouchAwareCell
      bg={bg} border={border} dashed={dashed}
      onShowTip={(e: React.MouseEvent | React.TouchEvent) => showOccasionTip(e, oa, occNameEn)}
      handlers={handlers}
    >
      {oa.isReadPast && oa.hasFuture && <span className="reread-dot" />}
    </TouchAwareCell>
  );
}

export default function HolidayGrid() {
  const { occasions, occasionAliyot } = useApp();
  const { tip, tipPos, showOccasionTip, handlers } = useAliyahTooltip();
  const [shabbatMode, setShabbatMode] = useState(false);

  // Group occasions by category preserving sort_order
  const byCategory = groupBy(occasions, occ => occ.category);

  // Build a lookup: occasion_id → aliyah_key → occasion_aliyah (filtered by shabbat mode)
  const lookup: Record<number, Record<string, (typeof occasionAliyot)[0]>> = {};
  for (const oa of occasionAliyot) {
    if (Boolean(oa.isShabbatVariant) !== shabbatMode) continue;
    lookup[oa.occasionId] ??= {};
    lookup[oa.occasionId]![oa.aliyahKey] = oa;
  }

  return (
    <Box>
      <GridLegend show={['read', 'scheduled', 'reread', 'partial', 'unread', 'na']} />

      <Box mb={16} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Switch
          label="Shabbat reading"
          checked={shabbatMode}
          onChange={e => setShabbatMode(e.currentTarget.checked)}
        />
        <Text size="xs" c="dimmed">
          {shabbatMode
            ? 'Showing expanded Shabbat aliyot (7+M) where available'
            : 'Showing standard weekday aliyot'}
        </Text>
      </Box>

      <div className="sefer-grid">
      {CATEGORY_ORDER.filter(cat => byCategory.get(cat)?.length).map(cat => {
        const color = CATEGORY_COLORS[cat] ?? '#888';
        const catOccasions = byCategory.get(cat) ?? [];

        const keysInCat = new Set<string>();
        for (const occ of catOccasions) {
          const oaMap = lookup[occ.id];
          if (oaMap) for (const k of Object.keys(oaMap)) keysInCat.add(k);
        }
        const visibleKeys = ALIYAH_KEYS.filter(k => keysInCat.has(k));
        if (!visibleKeys.length) return null;

        const readCount  = catOccasions.reduce((s, occ) => s + Object.values(lookup[occ.id] ?? {}).filter(oa => oa.isReadPast).length, 0);
        const totalCount = catOccasions.reduce((s, occ) => s + Object.values(lookup[occ.id] ?? {}).length, 0);
        const aPct       = fmtPct(readCount, totalCount);

        return (
          <SeferSection
            key={cat}
            title={<span className="eng" style={{ color, fontWeight: 600, fontSize: '0.9375rem' }}>{CATEGORY_LABELS_GRID[cat] ?? cat}</span>}
            badge={<>{readCount}/{totalCount} Aliyot &bull; {aPct}%</>}
            columnKeys={visibleKeys}
            renderColumnLabel={k => k === 'M' ? fmtAliyah(String(k), true) : String(k)}
          >
            {catOccasions.map(occ => {
              const oaMap = lookup[occ.id] ?? {};
              const hasAny = Object.keys(oaMap).length > 0;
              if (!hasAny) return null;

              return (
                <ParshaRow
                  key={occ.id}
                  label={<><span className="heb" style={{ fontSize: '0.75rem', textAlign: 'right' }}>{occ.name}</span><span className="eng">{occ.nameEn}</span></>}
                >
                  {visibleKeys.map(k => (
                    <HolidayCell
                      key={k}
                      oa={oaMap[k]}
                      color={color}
                      occNameEn={occ.nameEn}
                      showOccasionTip={showOccasionTip}
                      handlers={handlers}
                    />
                  ))}
                </ParshaRow>
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
