import { useEffect, useMemo, useState } from 'react';
import { Modal, Button, MultiSelect, Group, Stack, Text, ActionIcon, Switch } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useApp } from '../context/AppContext.js';
import { computeStats, estimateCompletionFromStats, effectivePseukimOf, committedPseukimOf } from '../compute.js';
import { applyWhatIfPicks, standardRowKey } from '../utils/whatIf.js';
import { buildGroupedOptions } from '../utils/form-options.js';
import { ParshaField } from './shared/ParshaField.js';
import { Ring } from './Ring.js';
import { fmtAliyah, toDateStr, fmtDate } from '../utils.js';
import { TODAY_STR } from '../api.js';
import { RING_PSEUKIM, RING_ALIYOT } from '../constants.js';
import './ReadingLog.css';
import './Overview.css';
import type { WhatIfPick } from '../utils/whatIf.js';
import type { ForecastResult, MappedRow, MappedOccasionAliyah, MappedWeekdayAliyah, MappedHosafah, Stats } from '../types/index.js';

interface WhatIfPreviewProps {
  readonly opened: boolean;
  readonly onClose: () => void;
}

interface PendingPick {
  kind: WhatIfPick['kind'];
  /* Row id for occasion/weekday/hosafah picks; undefined for standard aliyot (keyed by parsha+aliyah). */
  id?: number;
  parsha: string;
  sefer: string;
  aliyah: string;
  date: string;
  pseukim: number;
  /* Already scheduled for real (seeded from the real arrays) vs. added in this preview session. */
  existing: boolean;
  /* Precomputed display strings so the render stays uniform across all reading kinds. */
  title: string;   /* Hebrew heading line */
  detail: string;  /* secondary descriptor shown before the sefer + pseukim */
}

/* The key applyWhatIfPicks matches a pick against: parsha+aliyah for standard aliyot, row id for
   the special-reading kinds (see WhatIfPick / applyWhatIfPicks in utils/whatIf.ts). */
function whatIfKeyOf(p: PendingPick): string {
  return p.kind === 'standard' ? standardRowKey(p) : String(p.id);
}

/* Stable identity for React keys / removal / the cumulative-stats map. Prefixed with kind so a
   standard aliyah and a special reading that happen to share an id/key can never collide. */
function pickId(p: PendingPick): string {
  return `${p.kind}:${whatIfKeyOf(p)}`;
}

/* Mirrors ReadingRow's aliyahHebrew logic. Numbered aliyot render as עליה N; the maftir
   (aliyah 8, or the 'M' key used by occasion readings) renders as מפטיר. */
function aliyahHebrew(aliyah: string): string {
  return Number(aliyah) === 8 || aliyah === 'M' ? 'מפטיר' : `עליה ${aliyah}`;
}

function standardPick(r: MappedRow, date: string, existing: boolean, TLIT: Record<string, string>): PendingPick {
  return {
    kind: 'standard', parsha: r.parsha, sefer: r.sefer, aliyah: String(r.aliyah), date, pseukim: r.pseukim, existing,
    title: `${r.parsha} — ${aliyahHebrew(String(r.aliyah))}`,
    detail: `${TLIT[r.parsha] ?? ''} · ${fmtAliyah(r.aliyah)}`,
  };
}

function occasionPick(oa: MappedOccasionAliyah): PendingPick {
  return {
    kind: 'occasion', id: oa.id, parsha: oa.parsha, sefer: oa.sefer, aliyah: oa.aliyahKey,
    date: oa.orig, pseukim: oa.pseukim, existing: true,
    title: `${oa.occasion} — ${oa.parsha} · ${aliyahHebrew(oa.aliyahKey)}`,
    detail: `${oa.occasionEn} · ${oa.parshaEn} · ${fmtAliyah(oa.aliyahKey)}`,
  };
}

function weekdayPick(wa: MappedWeekdayAliyah): PendingPick {
  return {
    kind: 'weekday', id: wa.id, parsha: wa.parsha, sefer: wa.sefer, aliyah: String(wa.aliyahNum),
    date: wa.dateRead, pseukim: wa.pseukim, existing: true,
    title: `${wa.parsha} — ${aliyahHebrew(String(wa.aliyahNum))}`,
    detail: `Weekday · ${wa.parshaEn} · ${fmtAliyah(wa.aliyahNum)}`,
  };
}

function hosafahPick(hr: MappedHosafah): PendingPick {
  const parshaLabel = hr.parsha2 ? `${hr.parsha1}–${hr.parsha2}` : hr.parsha1;
  return {
    kind: 'hosafah', id: hr.id, parsha: parshaLabel, sefer: hr.sefer, aliyah: '',
    date: hr.dateRead, pseukim: hr.pseukim, existing: true,
    title: `${hr.occasion ?? parshaLabel} — הוספה`,
    detail: `Hosafah · ${hr.occasionEn ?? hr.parsha1En}`,
  };
}

function seedExistingFuturePicks(
  allRows: MappedRow[],
  occasionAliyot: MappedOccasionAliyah[],
  weekdayAliyot: MappedWeekdayAliyah[],
  hosafotReadings: MappedHosafah[],
  TLIT: Record<string, string>,
): PendingPick[] {
  return [
    ...allRows.filter(r => r.isReadFuture).map(r => standardPick(r, r.orig, true, TLIT)),
    ...occasionAliyot.filter(oa => oa.isReadFuture).map(occasionPick),
    ...weekdayAliyot.filter(wa => wa.isReadFuture).map(weekdayPick),
    ...hosafotReadings.filter(hr => hr.isReadFuture).map(hosafahPick),
  ];
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

  // Re-seed with every real currently-scheduled future reading (standard aliyot plus holiday,
  // weekday, and hosafah readings) each time the modal opens, so they all show up as
  // removable/editable "previewed" rows alongside any newly-added ones.
  useEffect(() => {
    if (opened) setPicks(seedExistingFuturePicks(allRows, occasionAliyot, weekdayAliyot, hosafotReadings, TLIT));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

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
    const merged = applyWhatIfPicks(allRows, occasionAliyot, weekdayAliyot, hosafotReadings, whatIfPicks);
    return computeStats(merged.allRows, merged.occasionAliyot, SEFER_ORDER, SEFER_MAP, filters, merged.weekdayAliyot, merged.hosafotReadings);
  };

  const asWhatIfPicks = (list: PendingPick[]): WhatIfPick[] =>
    list.map(p => ({ kind: p.kind, key: whatIfKeyOf(p), date: p.date }));

  // Always recompute from the current pick list, even when empty — an empty list means
  // every real future standard aliyah gets reverted to unscheduled (see applyWhatIfPicks),
  // which is a real state change from the base `stats` and must not be skipped.
  const previewMerged = useMemo(
    () => applyWhatIfPicks(allRows, occasionAliyot, weekdayAliyot, hosafotReadings, asWhatIfPicks(picks)),
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
    () => stats ? estimateCompletionFromStats(allRows, filters, forecastConfig, stats, SEFER_MAP) : null,
    [allRows, filters, forecastConfig, stats, SEFER_MAP],
  );
  const previewEst = useMemo<ForecastResult | null>(
    () => estimateCompletionFromStats(previewMerged.allRows, filters, forecastConfig, preview, SEFER_MAP),
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

  return (
    <Modal opened={opened} onClose={onClose} title="Preview future %" size="lg" centered>
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
          <Button variant="subtle" color="gray" onClick={() => setPicks(seedExistingFuturePicks(allRows, occasionAliyot, weekdayAliyot, hosafotReadings, TLIT))}>
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
    </Modal>
  );
}
