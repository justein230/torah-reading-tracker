import React, { useState, useEffect } from 'react';
import { Box, Card, Group, Text, Progress } from '@mantine/core';
import { fetchLocationStats } from '../api.js';
import type { LocationStat } from '../types/index.js';

export function LocationStats() {
  const [rows, setRows] = useState<LocationStat[] | null>(null);

  useEffect(() => {
    fetchLocationStats().then(setRows);
  }, []);

  if (!rows) return null;
  const total = rows.reduce((s, r) => s + r.past_count, 0);
  return (
    <Card className="card-surface">
      <Text fw={600} mb={12} c="dimmed" className="label-caps" size="xs">Readings by Location</Text>
      {rows.length
        ? rows.map(r => {
          const label    = r.location || '(no location)';
          const muted    = !r.location;
          const barPct   = total ? (r.past_count / total * 100) : 0;
          const upcoming = r.upcoming_count ?? 0;
          const countLabel = upcoming > 0
            ? `${r.past_count} (${r.count}↑)`
            : String(r.past_count);
          return (
            <Box key={label} mb={10}>
              <Group justify="space-between" mb={3}>
                <Text size="sm" c={muted ? 'dimmed' : undefined} fs={muted ? 'italic' : undefined}>{label}</Text>
                <Text size="sm" c="dimmed">{countLabel}</Text>
              </Group>
              <Progress value={barPct} color={muted ? 'dark' : 'cyan'} size="sm" />
            </Box>
          );
        })
        : <Text c="dimmed" size="sm">No readings yet.</Text>
      }
    </Card>
  );
}
