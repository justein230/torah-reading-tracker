import { useMemo, useState } from 'react';
import { Card, Collapse, Group, Stack, Text, UnstyledButton } from '@mantine/core';
import { DatePicker } from '@mantine/dates';
import { useApp } from '../context/AppContext.js';
import { computeStats, effectivePseukimOf } from '../compute.js';
import { applyAsOfDate } from '../utils/asOfDate.js';
import { fmtDate } from '../utils.js';
import { TODAY_STR } from '../api.js';
import type { Stats } from '../types/index.js';
import './Overview.css';

export default function AsOfDate() {
  const { allRows, occasionAliyot, weekdayAliyot, hosafotReadings, SEFER_ORDER, SEFER_MAP, filters } = useApp();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<string | null>(null);

  const asOfStats = useMemo<Stats | null>(() => {
    if (!date) return null;
    const snap = applyAsOfDate(allRows, occasionAliyot, weekdayAliyot, hosafotReadings, date);
    return computeStats(snap.allRows, snap.occasionAliyot, SEFER_ORDER, SEFER_MAP, filters, snap.weekdayAliyot, snap.hosafotReadings);
  }, [date, allRows, occasionAliyot, weekdayAliyot, hosafotReadings, SEFER_ORDER, SEFER_MAP, filters]);

  const pseukimPct = asOfStats && asOfStats.totalPseukim > 0 ? effectivePseukimOf(asOfStats) / asOfStats.totalPseukim * 100 : 0;
  const aliyotPct  = asOfStats && asOfStats.totalAliyot   > 0 ? asOfStats.readAliyot / asOfStats.totalAliyot * 100     : 0;

  return (
    <Card className="card-surface">
      <UnstyledButton onClick={() => setOpen(o => !o)} style={{ width: '100%' }}>
        <Group justify="space-between">
          <Text size="xs" c="dimmed" className="label-caps">% Complete As Of Date</Text>
          <Text size="xs" c="dimmed">{open ? '▲' : '▼'}</Text>
        </Group>
      </UnstyledButton>
      <Collapse expanded={open}>
        <Group align="flex-start" gap={24} wrap="wrap" mt={12}>
          <DatePicker
            value={date}
            onChange={setDate}
            maxDate={TODAY_STR}
            firstDayOfWeek={0}
          />
          {asOfStats && date && (
            <Stack gap={4} justify="center" style={{ minWidth: 140 }}>
              <Text size="sm" fw={600}>{fmtDate(date)}</Text>
              <Text size="sm">{pseukimPct.toFixed(2)}% pseukim</Text>
              <Text size="sm">{aliyotPct.toFixed(2)}% aliyot</Text>
            </Stack>
          )}
        </Group>
      </Collapse>
    </Card>
  );
}
