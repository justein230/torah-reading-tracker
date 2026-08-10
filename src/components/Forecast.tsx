import React, { useRef } from 'react';
import { Card, Text, Group, TextInput } from '@mantine/core';
import { useApp } from '../context/AppContext.js';
import { ToggleButtons } from './shared/ToggleButtons.js';
import { remainingPseukim } from '../compute.js';
import { getCurrentYear } from '../utils.js';

const WINDOWS: { label: string; years: number | null }[] = [
  { label: '1 yr',     years: 1 },
  { label: '2 yr',     years: 2 },
  { label: '3 yr',     years: 3 },
  { label: '5 yr',     years: 5 },
  { label: '10 yr',    years: 10 },
  { label: 'All time', years: null },
];

export default function Forecast() {
  const { allRows, forecastConfig, setForecastConfig, stats, SEFER_MAP } = useApp();
  const paceRef   = useRef<HTMLInputElement>(null);
  const targetRef = useRef<HTMLInputElement>(null);
  const [reverseResult, setReverseResult] = React.useState('');

  const setWindow = (years: number | null) => {
    setForecastConfig({ lookbackYears: years, paceOverride: null });
    if (paceRef.current) paceRef.current.value = '';
  };

  const onPaceChange = () => {
    const v = Number.parseFloat(paceRef.current?.value ?? '');
    setForecastConfig(c => ({ ...c, paceOverride: v > 0 ? v : null }));
  };

  const onTargetInput = () => {
    const yr = Number.parseInt(targetRef.current?.value ?? '');
    if (!yr || yr <= getCurrentYear() || !stats) { setReverseResult(''); return; }
    const remaining = remainingPseukim(allRows, stats, SEFER_MAP);
    const yearsLeft = yr - getCurrentYear();
    const needed    = Math.ceil(remaining / yearsLeft);
    setReverseResult(`You'd need ${needed.toLocaleString()} pseukim / yr`);
  };

  return (
    <Card className="card-surface">
      <Text size="xs" c="dimmed" className="label-caps" mb={12}>Pace Window</Text>
      <ToggleButtons
        value={forecastConfig.paceOverride ? null : forecastConfig.lookbackYears}
        onChange={(value) => setWindow(value as number | null)}
        options={WINDOWS.map(w => ({ value: w.years, label: w.label }))}
        variant="outline"
        size="xs"
        className="window-btn"
        gap={6}
      />

      <Group gap={16} align="flex-end" mb={8}>
        <TextInput
          ref={paceRef}
          label="Override pace (pseukim / yr)"
          placeholder="e.g. 2000"
          size="xs"
          style={{ flex: 1 }}
          onBlur={onPaceChange}
        />
        <TextInput
          ref={targetRef}
          label="Target year"
          placeholder={String(getCurrentYear() + 5)}
          size="xs"
          style={{ flex: 1 }}
          onInput={onTargetInput}
        />
      </Group>
      {reverseResult && <Text size="sm" c="cyan">{reverseResult}</Text>}
    </Card>
  );
  /* Breakdown by Book — kept for potential reuse elsewhere; est. completion already shown on Overview.
  <Card className="card-surface">
    <Text size="xs" c="dimmed" className="label-caps" mb={12}>Breakdown by Book</Text>
    <table className="table-base">
      <thead>
        <tr className="tr-divider-strong">
          {['Book', 'Read', 'Remaining'].map((h, i) => (
            <th key={h} className="th-base" style={{ textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {SEFER_ORDER.map(s => {
          const meta  = SEFER_MAP[s] ?? { en: s, color: '#888' };
          const rows  = allRows.filter(r => r.sefer === s);
          const total = rows.reduce((sum, r) => sum + r.pseukim, 0);
          const read  = rows.filter(r => r.isReadPast).reduce((sum, r) => sum + r.pseukim, 0);
          const rem   = total - read;
          return (
            <tr key={s} className="tr-divider">
              <td className="td-base td-bold" style={{ color: meta.color }}>{meta.en}</td>
              <td className="td-base td-right" style={{ color: 'var(--muted)' }}>{read.toLocaleString()} / {total.toLocaleString()}</td>
              <td className="td-base td-right" style={{ color: rem === 0 ? 'var(--muted2)' : 'var(--text)' }}>
                {rem === 0 ? '✓ Done' : rem.toLocaleString()}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </Card>
  */
}
