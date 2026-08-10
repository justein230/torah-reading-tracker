import { useState, useEffect } from 'react';
import { Drawer, Stack, MultiSelect, Switch, SegmentedControl, Text, Box, Button, Divider } from '@mantine/core';
import { useApp } from '../context/AppContext.js';
import { fetchCanWrite } from '../api.js';
import { exportExcel, exportDb } from '../utils/export.js';

interface SettingsDrawerProps {
  readonly opened: boolean;
  readonly onClose: () => void;
  readonly onManageReadings: () => void;
}

export default function SettingsDrawer({ opened, onClose, onManageReadings }: SettingsDrawerProps) {
  const { SEFER_ORDER, SEFER_MAP, allYears, filters, setFilters } = useApp();
  const [canWrite, setCanWrite]   = useState(false);
  const [exporting, setExporting] = useState<'excel' | 'db' | null>(null);

  useEffect(() => {
    void fetchCanWrite().then(setCanWrite);
  }, []);

  function set<K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) {
    setFilters(f => ({ ...f, [key]: value }));
  }

  const seferOptions = SEFER_ORDER.map(s => ({ value: s, label: `${s} — ${SEFER_MAP[s]?.en ?? s}` }));
  const yearOptions  = allYears.map(y => ({ value: String(y), label: String(y) }));

  function reset() {
    setFilters({ sefarim: [], years: [], includeFutureDates: true, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false });
  }

  async function handleExcelExport() {
    setExporting('excel');
    try { await exportExcel(); }
    finally { setExporting(null); }
  }

  async function handleDbExport() {
    setExporting('db');
    try { await exportDb(); }
    finally { setExporting(null); }
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title="Settings"
      position="right"
      size="sm"
      styles={{
        content: { background: 'var(--surface)' },
        header:  { background: 'var(--surface)', borderBottom: '1px solid var(--surface2)' },
      }}
      classNames={{ header: 'modal-header-safe' }}
    >
      <Stack gap="md" p="md">
        <Text size="xs" tt="uppercase" fw={600} c="dimmed" lts={1}>Filters</Text>

        <MultiSelect
          label="Book (Sefer)"
          data={seferOptions}
          value={filters.sefarim}
          onChange={vals => set('sefarim', vals)}
          placeholder="All books"
          clearable
        />

        <MultiSelect
          label="Year"
          data={yearOptions}
          value={filters.years.map(String)}
          onChange={vals => set('years', vals.map(Number))}
          placeholder="All years"
          clearable
        />

        <Box>
          <Text size="sm" fw={500} mb={8}>% Display</Text>
          <SegmentedControl
            value={filters.pctMode}
            onChange={v => set('pctMode', v)}
            data={[
              { value: 'pseukim', label: 'Pseukim' },
              { value: 'aliyot',  label: 'Aliyot' },
            ]}
            fullWidth
          />
        </Box>

        <Switch
          label="Show re-reads"
          description="Show additional readings in Reading Log"
          checked={filters.includeFutureDates}
          onChange={e => set('includeFutureDates', e.currentTarget.checked)}
        />

        <Divider />
        <Text size="xs" tt="uppercase" fw={600} c="dimmed" lts={1}>Rings</Text>

        <Switch
          label="Show holiday aliyot ring"
          description="Separate ring for occasion/holiday readings"
          checked={filters.showHolidayRing}
          onChange={e => set('showHolidayRing', e.currentTarget.checked)}
        />

        <Switch
          label="Show weekday aliyot ring"
          description="Separate ring for weekday Torah readings"
          checked={filters.showWeekdayRing}
          onChange={e => set('showWeekdayRing', e.currentTarget.checked)}
        />

        <Button variant="subtle" color="gray" onClick={reset}>
          Reset all filters
        </Button>

        <Divider />
        <Text size="xs" tt="uppercase" fw={600} c="dimmed" lts={1}>Data</Text>
        <Button variant="light" color="gray" fullWidth onClick={onManageReadings}>
          Manage Readings
        </Button>

        {canWrite && (
          <>
            <Divider />
            <Text size="xs" tt="uppercase" fw={600} c="dimmed" lts={1}>Actions</Text>
            <Button variant="light" color="gray" fullWidth
              loading={exporting === 'excel'} onClick={handleExcelExport}>
              Export to Excel
            </Button>
            <Button variant="light" color="gray" fullWidth
              loading={exporting === 'db'} onClick={handleDbExport}>
              Export DB (.sqlite)
            </Button>
          </>
        )}
      </Stack>
    </Drawer>
  );
}
