import { useState } from 'react';
import { Box, Card, Group, Stack, Text, Button } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Ring } from './Ring.js';
import { WhatIfPreview } from './WhatIfPreview.js';
import { useApp } from '../context/AppContext.js';
import { estimateCompletionFromStats, computeRing, effectivePseukimOf, committedPseukimOf } from '../compute.js';
import { RING_PSEUKIM, RING_ALIYOT, RING_HOLIDAY, RING_WEEKDAY } from '../constants.js';
import type { Stats } from '../types/index.js';

function formatYearLabel(years: number[]): string {
  if (years.length === 0) return 'all time';
  if (years.length === 1) return String(years[0]);
  return years.join(' · ');
}

function formatScopeTitle(sefarim: string[], SEFER_MAP: Record<string, { en: string; color: string }>): string {
  if (sefarim.length === 0) return 'Overall Total';
  if (sefarim.length === 1) { const s = sefarim[0] ?? ''; return SEFER_MAP[s]?.en ?? s; }
  return sefarim.map(s => SEFER_MAP[s]?.en ?? s).join(' · ');
}

/* Hero = the summary card at the top of Overview: pseukim ring, aliyot ring,
   scope/year label, counts, completion estimate, and optional holiday/weekday rings. */


function ringSubLabels(
  read: number, commit: number, total: number,
  fmt: (n: number) => string = String,
): { sub1: string; sub2: string } {
  const f = fmt;
  if (commit > read) {
    return {
      sub1: `${f(read)} (${f(commit)}↑) / ${f(total)}`,
      sub2: `${f(commit - read)} upcoming`,
    };
  }
  return { sub1: `${f(read)} / ${f(total)}`, sub2: '' };
}

function getRingSize(isSmall: boolean | undefined, isMedium: boolean | undefined): number {
  if (isSmall)  return 95;
  if (isMedium) return 110;
  return 140;
}

function getPaceSuffix(paceOverride: number | null | undefined, lookbackYears: number | null | undefined): string {
  if (paceOverride)   return ' (override)';
  if (lookbackYears)  return ` (last ${lookbackYears} yr)`;
  return ' (all time)';
}

interface HeroProps {
  readonly stats: Stats;
}

export function Hero({ stats }: HeroProps) {
  const { filters, forecastConfig, allRows, SEFER_MAP, occasionAliyot, weekdayAliyot } = useApp();
  const [whatIfOpen, setWhatIfOpen] = useState(false);
  const totalPseukim     = stats.totalPseukim;
  const readPseukim      = effectivePseukimOf(stats);
  const committedPseukim = committedPseukimOf(stats);
  const pPct  = totalPseukim > 0 ? (readPseukim      / totalPseukim * 100) : 0;
  const cPPct = totalPseukim > 0 ? (committedPseukim / totalPseukim * 100) : 0;
  const aPct  = stats.totalAliyot ? (stats.readAliyot  / stats.totalAliyot * 100) : 0;
  const cAPct = stats.totalAliyot ? (stats.committedAliyot / stats.totalAliyot * 100) : 0;
  const hol = computeRing(occasionAliyot, filters.sefarim);
  const wk  = computeRing(weekdayAliyot,  filters.sefarim);
  const isSmall  = useMediaQuery('(max-width: 379px)');
  const isMedium = useMediaQuery('(max-width: 520px)');
  const ringSize   = getRingSize(isSmall, isMedium);
  const scopeTitle = formatScopeTitle(filters.sefarim, SEFER_MAP);
  const yearLabel  = formatYearLabel(filters.years);
  const est        = estimateCompletionFromStats(allRows, filters, forecastConfig, stats, SEFER_MAP);
  const paceSuffix = getPaceSuffix(forecastConfig.paceOverride, forecastConfig.lookbackYears);
  const loc        = (n: number) => n.toLocaleString();
  const pSubs      = ringSubLabels(readPseukim, committedPseukim, totalPseukim, loc);
  const aSubs      = ringSubLabels(stats.readAliyot, stats.committedAliyot, stats.totalAliyot);
  const holSubs    = ringSubLabels(hol.read, hol.commit, hol.total);
  const wkSubs     = ringSubLabels(wk.read, wk.commit, wk.total);

  return (
    <Card className="card-surface">
      <Group justify="center" align="center" gap="xl" wrap="wrap" className="hero-group" p={8}>
        <Box className="hero-ring">
          <Ring pct={pPct} pctCommitted={cPPct} color={RING_PSEUKIM} label="Pseukim" size={ringSize}
            sub1={pSubs.sub1} sub2={pSubs.sub2} />
        </Box>

        <Stack align="center" gap={4} className="book-label">
          <Text fw={700} size="xl">{scopeTitle}</Text>
          <Text size="sm" c="dimmed" className="label-caps" mb={10}>{yearLabel}</Text>
          <Text fw={600}>
            {stats.readAliyot}
            {stats.committedAliyot > stats.readAliyot && (
              <Text span size="sm" c="dimmed"> ({stats.committedAliyot}↑)</Text>
            )}
            <Text span size="sm" c="dimmed"> / {stats.totalAliyot} aliyot</Text>
          </Text>
          <Text fw={600}>
            {readPseukim.toLocaleString()}
            {committedPseukim > readPseukim && (
              <Text span size="sm" c="dimmed"> ({committedPseukim.toLocaleString()}↑)</Text>
            )}
            <Text span size="sm" c="dimmed"> / {totalPseukim.toLocaleString()} pseukim</Text>
          </Text>
          {stats.rereadCount > 0 && (
            <Text size="xs" c="dimmed" mt={4}>+ {stats.rereadCount} re-read{stats.rereadCount === 1 ? '' : 's'} · {stats.readAliyot + stats.rereadCount} total</Text>
          )}
          <Button variant="subtle" size="xs" mt={4} onClick={() => setWhatIfOpen(true)}>
            Preview future %
          </Button>
          <WhatIfPreview opened={whatIfOpen} onClose={() => setWhatIfOpen(false)} />
          {est && (
            <div className="est-divider">
              <Text size="xs" c="dimmed" className="label-caps" mb={3}>Est. completion</Text>
              <Text fw={700} size="md">
                {est.completion.toLocaleString('en-US', { month: 'short' })} {est.completion.getFullYear()}
              </Text>
              <Text size="xs" c="dimmed" mt={2}>
                {est.ratePerYear.toLocaleString()} pseukim / yr{paceSuffix}
              </Text>
            </div>
          )}
        </Stack>

        <Box className="hero-ring">
          <Ring pct={aPct} pctCommitted={cAPct} color={RING_ALIYOT} label="Aliyot" size={ringSize}
            sub1={aSubs.sub1} sub2={aSubs.sub2} />
        </Box>

        {filters.showHolidayRing && hol.total > 0 && (
          <Box className="hero-ring">
            <Ring pct={hol.pct} pctCommitted={hol.cPct} color={RING_HOLIDAY} label="Holiday" size={ringSize}
              sub1={holSubs.sub1} sub2={holSubs.sub2} />
          </Box>
        )}

        {filters.showWeekdayRing && wk.total > 0 && (
          <Box className="hero-ring">
            <Ring pct={wk.pct} pctCommitted={wk.cPct} color={RING_WEEKDAY} label="Weekday" size={ringSize}
              sub1={wkSubs.sub1} sub2={wkSubs.sub2} />
          </Box>
        )}
      </Group>
    </Card>
  );
}
