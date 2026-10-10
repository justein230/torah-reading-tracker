import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell, Drawer, CloseButton, ScrollArea, Button, MultiSelect, Group, Stack, Text, ActionIcon, Switch, useMantineTheme } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useMediaQuery } from '@mantine/hooks';
import { useApp } from '../context/AppContext.js';
import { computeStats, estimateCompletionFromStats, effectivePseukimOf, committedPseukimOf } from '../compute.js';
import { applyWhatIfPicks } from '../utils/whatIf.js';
import { pickId, whatIfKeyOf, standardPick, seedExistingFuturePicks, reconcilePicks } from '../utils/whatIfPicks.js';
import { buildGroupedOptions } from '../utils/form-options.js';
import { ParshaField } from './shared/ParshaField.js';
import { Ring } from './Ring.js';
import { fmtAliyah, toDateStr, fmtDate } from '../utils/format.js';
import { TODAY_STR } from '../api.js';
import { RING_PSEUKIM, RING_ALIYOT, WHATIF_DOCK_BREAKPOINT } from '../constants.js';
import './ReadingLog.css';
import './Overview.css';
import type { WhatIfPick } from '../utils/whatIf.js';
import type { PendingPick } from '../utils/whatIfPicks.js';
import type { ForecastResult, MappedRow, Stats } from '../types/index.js';

interface WhatIfPreviewProps {
  readonly opened: boolean;
  readonly onClose: () => void;
}

function readStatusSuffix(r: Pick<MappedRow, 'isReadPast' | 'isReadFuture'>): string {
  if (r.isReadPast) return '  (read)';
  if (r.isReadFuture) return '  (scheduled)';
  return '';
}

/* Mirrors Hero's "Est. completion" month/year format. */
function fmtEst(est: ForecastResult): string {
  return `${est.completion.toLocaleString('en-US', { month: 'short' })} ${est.completion.getFullYear()}`;
}

interface AliyahOption {
  value: string;
  label: string;
  disabled: boolean;
}

/**
 * Every aliyah in the parsha is listed so it's clear why one is missing from the picker —
 * already-read ones are shown greyed out and disabled rather than silently hidden.
 * Already-scheduled-future ones are disabled too, since those already appear as seeded
 * preview rows rather than being pickable here.
 */
export function buildAliyahOptions(allRows: MappedRow[], parsha: string): AliyahOption[] {
  if (!parsha) return [];
  return allRows
    .filter(r => r.parsha === parsha)
    .sort((a, b) => Number(a.aliyah) - Number(b.aliyah))
    .map(r => ({
      value: String(r.aliyah),
      label: `${fmtAliyah(r.aliyah)}  —  ${r.pseukim} pseukim${readStatusSuffix(r)}`,
      disabled: r.isRead,
    }));
}

export function WhatIfPreview({ opened, onClose }: WhatIfPreviewProps) {
  const { allRows, occasionAliyot, weekdayAliyot, hosafotReadings,
          SEFER_ORDER, SEFER_MAP, TLIT, parshaIndex, schedule, filters, stats, forecastConfig } = useApp();
  const [parsha, setParsha] = useState('');
  const [aliyot, setAliyot] = useState<string[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [autoFillDate, setAutoFillDate] = useState(true);
  const [picks, setPicks] = useState<PendingPick[]>([]);
  const isNarrow = useMediaQuery('(max-width: 520px)');
  // Wide screens dock the preview as an AppShell aside (see App.tsx) so the tab shrinks to make
  // room for it; below that breakpoint it falls back to a floating drawer over the page.
  const theme    = useMantineTheme();
  const isDocked = useMediaQuery(`(min-width: ${theme.breakpoints[WHATIF_DOCK_BREAKPOINT]})`);

  // Seed with every real currently-scheduled future reading (standard aliyot plus holiday,
  // weekday, and hosafah readings) the first time the drawer opens, so they all show up as
  // removable/editable "previewed" rows alongside any newly-added ones. Closing keeps the picks
  // (the drawer stays mounted app-wide); "Reset to committed" starts over. While it's open the
  // real data can change underneath it (readings added/edited/deleted in other tabs), so later
  // runs reconcile the picks with the fresh data instead of re-seeding.
  const seededIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    const seed = seedExistingFuturePicks(allRows, occasionAliyot, weekdayAliyot, hosafotReadings, TLIT);
    const prevSeedIds = seededIds.current;
    if (!prevSeedIds && !opened) return;
    seededIds.current = new Set(seed.map(pickId));
    setPicks(prevSeedIds ? existing => reconcilePicks(existing, prevSeedIds, seed, allRows) : seed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, allRows, occasionAliyot, weekdayAliyot, hosafotReadings]);

  function resetToCommitted() {
    const seed = seedExistingFuturePicks(allRows, occasionAliyot, weekdayAliyot, hosafotReadings, TLIT);
    seededIds.current = new Set(seed.map(pickId));
    setPicks(seed);
  }

  const parshaOptions = buildGroupedOptions(
    SEFER_ORDER,
    s => SEFER_MAP[s]?.en ?? s,
    s => parshaIndex[s] ?? [],
    (p: string) => ({ value: p, label: `${p}  —  ${TLIT[p] ?? ''}` }),
  );

  const aliyahOptions = buildAliyahOptions(allRows, parsha);

  function handleParshaChange(v: string) {
    setParsha(v);
    setAliyot([]);
    if (autoFillDate) {
      const schedDate = schedule[TLIT[v] ?? ''];
      if (schedDate) setDate(new Date(`${schedDate}T00:00:00`));
    }
  }

  function addPicks() {
    const dateStr = toDateStr(date);
    if (!parsha || !aliyot.length || !dateStr) return;
    const newPicks = allRows
      .filter(r => r.parsha === parsha && aliyot.includes(String(r.aliyah)))
      .map(r => standardPick(r, dateStr, false, TLIT));
    setPicks(existing => [...existing.filter(p => p.parsha !== parsha || !aliyot.includes(p.aliyah)), ...newPicks]);
    setParsha('');
    setAliyot([]);
    setDate(null);
  }

  function removePick(id: string) {
    setPicks(existing => existing.filter(p => pickId(p) !== id));
  }

  const computeWithPicks = (whatIfPicks: WhatIfPick[]): Stats => {
    const merged = applyWhatIfPicks({ allRows, occasionAliyot, weekdayAliyot, hosafotReadings }, whatIfPicks);
    return computeStats(merged.allRows, merged.occasionAliyot, SEFER_ORDER, SEFER_MAP, filters, merged.weekdayAliyot, merged.hosafotReadings);
  };

  const asWhatIfPicks = (list: PendingPick[]): WhatIfPick[] =>
    list.map(p => ({ kind: p.kind, key: whatIfKeyOf(p), date: p.date }));

  // Always recompute from the current pick list, even when empty — an empty list means
  // every real future standard aliyah gets reverted to unscheduled (see applyWhatIfPicks),
  // which is a real state change from the base `stats` and must not be skipped.
  const previewMerged = useMemo(
    () => applyWhatIfPicks({ allRows, occasionAliyot, weekdayAliyot, hosafotReadings }, asWhatIfPicks(picks)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [picks, allRows, occasionAliyot, weekdayAliyot, hosafotReadings],
  );
  const preview = useMemo(
    () => computeStats(previewMerged.allRows, previewMerged.occasionAliyot, SEFER_ORDER, SEFER_MAP, filters, previewMerged.weekdayAliyot, previewMerged.hosafotReadings),
    [previewMerged, SEFER_ORDER, SEFER_MAP, filters],
  );

  // Estimated completion date, before and after this preview — reuses the same forecast
  // logic Hero.tsx shows, run once against the real rows and once against the merged
  // (hypothetical) rows, so scheduling/un-scheduling picks visibly pulls the estimate in or out.
  const currentEst = useMemo<ForecastResult | null>(
    () => stats ? estimateCompletionFromStats(allRows, filters, forecastConfig, stats, SEFER_MAP, { occasionAliyot, weekdayAliyot, hosafotReadings }) : null,
    [allRows, filters, forecastConfig, stats, SEFER_MAP, occasionAliyot, weekdayAliyot, hosafotReadings],
  );
  const previewEst = useMemo<ForecastResult | null>(
    () => estimateCompletionFromStats(previewMerged.allRows, filters, forecastConfig, preview, SEFER_MAP, previewMerged),
    [previewMerged, filters, forecastConfig, preview, SEFER_MAP],
  );

  // Picks in chronological order — the natural reading order for "what does the
  // committed % look like as these get read one by one, in date order."
  const sortedPicks = useMemo(() => [...picks].sort((a, b) => a.date.localeCompare(b.date)), [picks]);

  // Progressive/cumulative committed % as of each row's date: row i's value includes every
  // pick dated on or before it (in chronological order), so the list reads as a running total
  // building up to the full preview — the main point of this feature. Each row also shows its
  // own marginal contribution (the delta from the previous row's running total), plus the total
  // pseukim read/scheduled in that row's calendar year (past-read + this preview's future picks
  // dated in the same year). The past side uses uniquePseukim (within-year deduplicated, as
  // computeStats already does for byYear); the future side uses raw pseukim — computeStats never
  // runs the same dedup pass over byYearFuture, so uniquePseukim there is always 0.
  const cumulativeByRow = useMemo(() => {
    const running = new Map<string, { committed: number; pct: number; deltaPseukim: number; deltaPct: number; year: number; yearPseukim: number }>();
    const totalPseukim = stats?.totalPseukim ?? 0;
    let prevCommitted = stats ? effectivePseukimOf(stats) : 0;
    const soFar: PendingPick[] = [];
    for (const p of sortedPicks) {
      soFar.push(p);
      const s = computeWithPicks(asWhatIfPicks(soFar));
      const committed = committedPseukimOf(s);
      const pct = totalPseukim > 0 ? committed / totalPseukim * 100 : 0;
      const deltaPseukim = committed - prevCommitted;
      const deltaPct = totalPseukim > 0 ? deltaPseukim / totalPseukim * 100 : 0;
      const year = new Date(p.date).getFullYear();
      const yearPseukim = (s.byYear[year]?.uniquePseukim ?? 0) + (s.byYearFuture[year]?.pseukim ?? 0);
      running.set(pickId(p), { committed, pct, deltaPseukim, deltaPct, year, yearPseukim });
      prevCommitted = committed;
    }
    return running;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedPicks, stats, allRows, occasionAliyot, weekdayAliyot, hosafotReadings, SEFER_ORDER, SEFER_MAP, filters]);

  if (!stats) return null;

  const totalPseukim = stats.totalPseukim;
  const completed    = effectivePseukimOf(stats);
  const completedPct = totalPseukim > 0 ? completed / totalPseukim * 100 : 0;
  const committed     = committedPseukimOf(preview);
  const committedPct  = totalPseukim > 0 ? committed / totalPseukim * 100 : 0;

  const totalAliyot     = stats.totalAliyot;
  const completedAliyot = stats.readAliyot;
  const completedAliyotPct = totalAliyot > 0 ? completedAliyot / totalAliyot * 100 : 0;
  const committedAliyot    = preview.committedAliyot;
  const committedAliyotPct = totalAliyot > 0 ? committedAliyot / totalAliyot * 100 : 0;

  const body = (
      <Stack gap={16}>

        <Group grow align="flex-start">
          <ParshaField
            value={parsha}
            onSelect={handleParshaChange}
            parshaOptions={parshaOptions}
            SEFER_ORDER={SEFER_ORDER}
            SEFER_MAP={SEFER_MAP}
            parshaIndex={parshaIndex}
            TLIT={TLIT}
          />
          <MultiSelect
            label="Aliyah"
            placeholder={parsha ? 'Select aliyot…' : '— Select Parsha first —'}
            data={aliyahOptions}
            value={aliyot}
            onChange={setAliyot}
            disabled={!parsha}
          />
        </Group>
        <Group justify="space-between" align="center" mb={-8}>
          <Text size="sm" fw={500}>Hypothetical date</Text>
          <Switch
            label="Auto-fill from schedule"
            size="xs"
            checked={autoFillDate}
            onChange={e => setAutoFillDate(e.currentTarget.checked)}
          />
        </Group>
        <DateInput
          label={null}
          placeholder="Pick a future date"
          value={date}
          onChange={d => setDate(d ? new Date(`${d}T00:00:00`) : null)}
          minDate={new Date(`${TODAY_STR}T00:00:00`)}
          firstDayOfWeek={0}
          valueFormat="YYYY-MM-DD"
        />
        <Group gap={8}>
          <Button onClick={addPicks} disabled={!parsha || !aliyot.length || !date}>Add to preview</Button>
          <Button variant="subtle" color="gray" onClick={resetToCommitted}>
            Reset to committed
          </Button>
        </Group>

        {sortedPicks.length > 0 && (
          <Stack gap={8}>
            <Text size="sm" fw={600}>Previewing {sortedPicks.length} reading{sortedPicks.length === 1 ? '' : 's'}, by date</Text>
            {sortedPicks.map(p => {
              const cum = cumulativeByRow.get(pickId(p));
              const color = SEFER_MAP[p.sefer]?.color ?? '#888';
              return (
                <div className="reading-item has-actions" key={pickId(p)} style={{ borderLeftColor: color }}>
                  <div className="ri-date">{fmtDate(p.date)}</div>
                  <div className="ri-parsha">
                    <div className="ri-parsha-text">
                      <div className="hebrew heb">
                        {p.title}
                      </div>
                      <div className="sub">
                        {p.detail} · <span style={{ color }}>{SEFER_MAP[p.sefer]?.en ?? p.sefer}</span> · {p.pseukim} pseukim
                        {p.existing && ' · already scheduled'}
                      </div>
                    </div>
                    {cum && (
                      <div className="ri-stats">
                        <span className="ri-tag">+{cum.deltaPct.toFixed(2)}%</span>
                        <span className="ri-pct">{cum.pct.toFixed(2)}% total</span>
                        <span className="ri-pct">{cum.yearPseukim.toLocaleString()} pseukim ({cum.year})</span>
                      </div>
                    )}
                  </div>
                  <div className="ri-footer">
                    <ActionIcon variant="subtle" color="red" aria-label="Remove" onClick={() => removePick(pickId(p))}>×</ActionIcon>
                  </div>
                </div>
              );
            })}
          </Stack>
        )}

        <Group justify="center" gap="xl">
          <Ring
            pct={completedPct}
            pctCommitted={committedPct}
            color={RING_PSEUKIM}
            label="Pseukim"
            size={140}
            sub1={`${completed.toLocaleString()} / ${totalPseukim.toLocaleString()} completed`}
            sub2={committedPct > completedPct ? `→ ${committed.toLocaleString()} committed (+${(committedPct - completedPct).toFixed(2)}%)` : undefined}
          />
          <Ring
            pct={completedAliyotPct}
            pctCommitted={committedAliyotPct}
            color={RING_ALIYOT}
            label="Aliyot"
            size={140}
            sub1={`${completedAliyot.toLocaleString()} / ${totalAliyot.toLocaleString()} completed`}
            sub2={committedAliyotPct > completedAliyotPct ? `→ ${committedAliyot.toLocaleString()} committed (+${(committedAliyotPct - completedAliyotPct).toFixed(2)}%)` : undefined}
          />
        </Group>

        {currentEst && (
          <div className="est-divider" style={{ textAlign: 'center' }}>
            <Text size="xs" c="dimmed" className="label-caps" mb={3}>Est. completion</Text>
            <Text fw={700} size="md">
              {fmtEst(currentEst)}
              {previewEst && fmtEst(previewEst) !== fmtEst(currentEst) && (
                <Text span size="sm" c="dimmed"> → {fmtEst(previewEst)}</Text>
              )}
            </Text>
          </div>
        )}
      </Stack>
  );

  if (isDocked) {
    return (
      // The aside itself is a transparent gutter; the rounded card inside matches the page's
      // other cards (12px radius, --surface fill) so the panel reads as inset rather than a hard edge.
      <AppShell.Aside withBorder={false} p="md" style={{ background: 'transparent', overflow: 'hidden' }}>
        <div style={{
          height: '100%', display: 'flex', flexDirection: 'column',
          background: 'var(--surface)', border: '1px solid var(--surface2)', borderRadius: 12,
        }}>
          <Group justify="space-between" px={20} pt={16} pb={8}>
            <Text size="lg" fw={600}>Preview future %</Text>
            <CloseButton aria-label="Close preview" onClick={onClose} />
          </Group>
          <ScrollArea style={{ flex: 1, minHeight: 0 }} scrollbarSize={8} offsetScrollbars="y">
            <div style={{ padding: '8px 20px 20px' }}>{body}</div>
          </ScrollArea>
        </div>
      </AppShell.Aside>
    );
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Preview future %"
      position={isNarrow ? 'bottom' : 'right'}
      size={isNarrow ? '60%' : 'md'}
      withOverlay={false}
      lockScroll={false}
      trapFocus={false}
      closeOnClickOutside={false}
      // On phones the drawer rises from the bottom, so stop it above the 60px bottom nav (App.tsx
      // footer) — otherwise it would cover the very tabs you need to browse while forecasting.
      styles={{
        inner: isNarrow ? { bottom: 'calc(60px + env(safe-area-inset-bottom))' } : undefined,
        content: { background: 'var(--surface)' },
      }}
    >
      {body}
    </Drawer>
  );
}
