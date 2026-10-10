import { useState } from 'react';
import { Box, Tabs } from '@mantine/core';
import { useElementWidth } from '../hooks/useElementWidth.js';
import { gridWidthClass } from '../utils/gridWidthClass.js';
import Grid             from './Grid.js';
import DoubleParshaGrid from './DoubleParshaGrid.js';
import HolidayGrid      from './HolidayGrid.js';
import WeekdayGrid      from './WeekdayGrid.js';

type GridView = 'portions' | 'double' | 'holidays' | 'weekday';

export default function GridsTab() {
  const [view, setView] = useState<GridView>('portions');
  // Layout follows the width this tab actually gets (a docked side panel can take much of the window),
  // which the window media queries in Grid.css can't see — see gridWidthClass. Measured before the
  // first paint (useElementWidth) so switching to this tab never flashes the wide two-column layout.
  const { ref, width } = useElementWidth();
  return (
    <Box ref={ref} className={gridWidthClass(width)}>
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
