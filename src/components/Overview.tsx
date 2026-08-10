import './Overview.css';
import { Stack, Text, Anchor } from '@mantine/core';
import { useApp } from '../context/AppContext.js';
import { Hero } from './Hero.js';
import { SeferCards } from './SeferCards.js';
import { ProgressLineChart } from './ProgressLineChart.js';
import { YearChart } from './YearChart.js';
import { LocationStats } from './LocationStats.js';
import Forecast from './Forecast.js';
import AsOfDate from './AsOfDate.js';

export default function Overview() {
  const { stats } = useApp();
  if (!stats) return null;
  return (
    <Stack gap={20}>
      <Hero stats={stats} />
      <SeferCards stats={stats} />
      <ProgressLineChart stats={stats} />
      <YearChart stats={stats} />
      <LocationStats />
      <Forecast />
      <AsOfDate />
      <Text size="xs" c="dimmed" ta="center">
        Torah reading dates from{' '}
        <Anchor href="https://www.hebcal.com" target="_blank" rel="noopener noreferrer" inherit>
          Hebcal.com
        </Anchor>
        , licensed{' '}
        <Anchor href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" inherit>
          CC BY 4.0
        </Anchor>
        .
      </Text>
    </Stack>
  );
}
