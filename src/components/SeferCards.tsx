import React from 'react';
import { isSeferAllowed, effectivePseukimOf, committedPseukimOf } from '../compute.js';
import { Card, Group, Box, Text, Progress, SimpleGrid } from '@mantine/core';
import { useApp } from '../context/AppContext.js';
import { hex } from '../utils.js';
import type { Stats } from '../types/index.js';

interface SeferCardsProps {
  stats: Stats;
}

export function SeferCards({ stats }: Readonly<SeferCardsProps>) {
  const { SEFER_ORDER, SEFER_MAP, filters } = useApp();
  const cards = SEFER_ORDER.map(s => {
    const seferMeta = SEFER_MAP[s];
    if (!seferMeta) return null;
    const { en, color } = seferMeta;
    const bs     = stats.bySefer[s];
    if (!bs) return null;
    const dimmed = !isSeferAllowed(s, filters);
    const aPct   = bs.totalAliyot  ? (bs.readAliyot  / bs.totalAliyot  * 100) : 0;
    const cAPct  = bs.totalAliyot  ? (bs.committedAliyot / bs.totalAliyot * 100) : 0;
    const effectivePseukim  = effectivePseukimOf(bs);
    const committedSpecial  = committedPseukimOf(bs);
    const pPct   = bs.totalPseukim ? (effectivePseukim / bs.totalPseukim * 100) : 0;
    const cPPct  = bs.totalPseukim ? (committedSpecial  / bs.totalPseukim * 100) : 0;
    const mainPct  = filters.pctMode === 'aliyot' ? aPct  : pPct;
    const mainCPct = filters.pctMode === 'aliyot' ? cAPct : cPPct;
    return (
      <Card key={s} className="card-surface" style={{ borderLeft: `3px solid ${color}`, opacity: dimmed ? 0.4 : 1 }}>
        <Group justify="space-between" align="flex-start" wrap="nowrap" mb={10}>
          <Box style={{ minWidth: 0 }}>
            <Text className="hebrew" fw={600} size="lg" style={{ color }}>{s}</Text>
            <Text size="xs" c="dimmed">{en}</Text>
          </Box>
          <Box style={{ textAlign: 'right', flexShrink: 0 }}>
            <Text fw={700} size="lg" style={{ color }}>{mainPct.toFixed(2)}<Text span size="xs" c="dimmed">%</Text></Text>
            {mainCPct > mainPct && (
              <Text size="xs" style={{ color: hex(color, 0.7), whiteSpace: 'nowrap' }}>{mainCPct.toFixed(2)}%↑</Text>
            )}
          </Box>
        </Group>
        <Text size="xs" c="dimmed" mb={3}>
          {'Pseukim · '}
          {committedSpecial > effectivePseukim
            ? <>{effectivePseukim} <Text span size="xs" style={{ opacity: 0.7 }}>({committedSpecial}↑)</Text> / {bs.totalPseukim}</>
            : <>{effectivePseukim} / {bs.totalPseukim}</>}
        </Text>
        <Progress value={pPct} color={color} size="sm" mb={8} />
        <Text size="xs" c="dimmed" mb={3}>
          {'Aliyot · '}
          {bs.committedAliyot > bs.readAliyot
            ? <>{bs.readAliyot} <Text span size="xs" style={{ opacity: 0.7 }}>({bs.committedAliyot}↑)</Text> / {bs.totalAliyot}</>
            : <>{bs.readAliyot} / {bs.totalAliyot}</>}
        </Text>
        <Progress value={aPct} color={hex(color, 0.7)} size="sm" />
        {bs.committedAliyot > bs.readAliyot && (
          <Text size="xs" c="dimmed" mt={8} className="sefercard-footer">↑ {bs.committedAliyot - bs.readAliyot} upcoming</Text>
        )}
        {bs.rereadCount > 0 && <Text size="xs" c="dimmed" mt={bs.committedAliyot > bs.readAliyot ? 2 : 8} className={bs.committedAliyot > bs.readAliyot ? undefined : 'sefercard-footer'}>↺ {bs.rereadCount} re-read{bs.rereadCount === 1 ? '' : 's'}</Text>}
      </Card>
    );
  });

  return (
    <>
      <div className="sefercards-narrow">
        <SimpleGrid cols={1}>{cards}</SimpleGrid>
      </div>
      <div className="sefercards-wide">
        <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>{cards}</SimpleGrid>
      </div>
    </>
  );
}
