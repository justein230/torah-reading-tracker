import { useState } from 'react';
import { Box, Switch, Text } from '@mantine/core';
import { useApp } from '../context/AppContext.js';
import { useAliyahTooltip, AliyahTooltip, TouchAwareCell } from './AliyahTooltip.js';
import { GridLegend } from './GridLegend.js';
import { SeferSection } from './shared/SeferSection.js';
import { aliyahCellStyle, fmtAliyah, fmtPct } from '../utils.js';
import type { MappedOccasionAliyah } from '../types/index.js';
import './Grid.css';

const ALIYAH_KEYS = ['1', '2', '3', '4', '5', '6', '7', 'M'];

const CATEGORY_ORDER = ['yom_tov', 'chanukah', 'rosh_chodesh', 'maftir_special', 'other'];
const CATEGORY_LABELS: Record<string, string> = {
  yom_tov:        'Yamim Tovim',
  chanukah:       'Chanukah',
  rosh_chodesh:   'Rosh Chodesh',
  maftir_special: 'Special Maftir Shabbatot',
  other:          'Other',
};
const CATEGORY_COLORS: Record<string, string> = {
  yom_tov:        '#7C3AED',
  chanukah:       '#2563EB',
  rosh_chodesh:   '#059669',
  maftir_special: '#D97706',
  other:          '#6B7280',
};


type ShowOccasionTip = (e: React.MouseEvent | React.TouchEvent, oa: MappedOccasionAliyah, occasionName: string) => void;

interface HolidayCellProps {
  oa: MappedOccasionAliyah | undefined;
  color: string;
  occNameEn: string;
  showOccasionTip: ShowOccasionTip;
  moveTipPos: (e: React.MouseEvent) => void;
  positionFromRect: (rect: DOMRect) => void;
  hideTip: () => void;
}

function HolidayCell({ oa, color, occNameEn, showOccasionTip, moveTipPos, positionFromRect, hideTip }: Readonly<HolidayCellProps>) {
  if (!oa) {
    return <div className="acell" style={{ background: 'transparent', border: '2px dashed var(--cell-unread-border)', opacity: 0.2 }} />;
  }
  let state: 'read' | 'future' | 'partial' | 'unread';
  if (oa.isReadPast)        state = 'read';
  else if (oa.isReadFuture) state = 'future';
  else if (oa.partialOrig)  state = 'partial';
  else                      state = 'unread';
  const { bg, border, dashed } = aliyahCellStyle(state, color);
  return (
    <TouchAwareCell
      bg={bg} border={border} dashed={dashed}
      onShowTip={(e: React.MouseEvent | React.TouchEvent) => showOccasionTip(e, oa, occNameEn)}
      moveTipPos={moveTipPos} positionFromRect={positionFromRect} hideTip={hideTip}
    >
      {oa.isReadPast && oa.hasFuture && <span className="reread-dot" />}
    </TouchAwareCell>
  );
}

export default function HolidayGrid() {
  const { occasions, occasionAliyot } = useApp();
  const { tip, tipPos, showOccasionTip, moveTipPos, positionFromRect, hideTip } = useAliyahTooltip();
  const [shabbatMode, setShabbatMode] = useState(false);

  // Group occasions by category preserving sort_order
  const byCategory: Record<string, typeof occasions> = {};
  for (const occ of occasions) {
    byCategory[occ.category] ??= [];
    byCategory[occ.category]!.push(occ);
  }

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
      {CATEGORY_ORDER.filter(cat => byCategory[cat]?.length).map(cat => {
        const color = CATEGORY_COLORS[cat] ?? '#888';
        const catOccasions = byCategory[cat] ?? [];

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
            title={<span className="eng" style={{ color, fontWeight: 600, fontSize: 15 }}>{CATEGORY_LABELS[cat] ?? cat}</span>}
            badge={<>{readCount}/{totalCount} Aliyot &bull; {aPct}%</>}
            columnKeys={visibleKeys}
            renderColumnLabel={k => k === 'M' ? fmtAliyah(String(k), true) : String(k)}
          >
            {catOccasions.map(occ => {
              const oaMap = lookup[occ.id] ?? {};
              const hasAny = Object.keys(oaMap).length > 0;
              if (!hasAny) return null;

              return (
                <div key={occ.id} className="parsha-row">
                  <div className="parsha-label">
                    <span className="heb" style={{ fontSize: 12, textAlign: 'right' }}>{occ.name}</span>
                    <span className="eng">{occ.nameEn}</span>
                  </div>
                  <div className="aliyah-cells">
                    {visibleKeys.map(k => (
                      <HolidayCell
                        key={k}
                        oa={oaMap[k]}
                        color={color}
                        occNameEn={occ.nameEn}
                        showOccasionTip={showOccasionTip}
                        moveTipPos={moveTipPos}
                        positionFromRect={positionFromRect}
                        hideTip={hideTip}
                      />
                    ))}
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
