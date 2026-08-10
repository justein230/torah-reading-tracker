import { useState } from 'react';
import { Box, Tabs } from '@mantine/core';
import Grid             from './Grid.js';
import DoubleParshaGrid from './DoubleParshaGrid.js';
import HolidayGrid      from './HolidayGrid.js';
import WeekdayGrid      from './WeekdayGrid.js';

type GridView = 'portions' | 'double' | 'holidays' | 'weekday';

export default function GridsTab() {
  const [view, setView] = useState<GridView>('portions');
  return (
    <Box>
      <Tabs value={view} onChange={v => setView(v as GridView)} variant="pills" mb={16}>
        <Tabs.List>
          <Tabs.Tab value="portions">Portions</Tabs.Tab>
          <Tabs.Tab value="double">Double Parshiyot</Tabs.Tab>
          <Tabs.Tab value="holidays">Holidays</Tabs.Tab>
          <Tabs.Tab value="weekday">Weekday</Tabs.Tab>
        </Tabs.List>
      </Tabs>
      {view === 'portions' && <Grid />}
      {view === 'double'   && <DoubleParshaGrid />}
      {view === 'holidays' && <HolidayGrid />}
      {view === 'weekday'  && <WeekdayGrid />}
    </Box>
  );
}
