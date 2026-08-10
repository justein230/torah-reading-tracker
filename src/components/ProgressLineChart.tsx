import React, { useEffect, useRef } from 'react';
import { Card, Text } from '@mantine/core';
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler } from 'chart.js';
import { useApp } from '../context/AppContext.js';
import type { Stats } from '../types/index.js';
import './ProgressLineChart.css';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Filler);

const C_MUTED    = '#94a3b8';
const C_SURFACE2 = '#334155';
const C_ACCENT   = '#38bdf8';

function toPct(cum: number, total: number): number {
  return total ? Number.parseFloat((cum / total * 100).toFixed(3)) : 0;
}

interface ProgressLineChartProps {
  stats: Stats;
}

export function ProgressLineChart({ stats }: Readonly<ProgressLineChartProps>) {
  const { filters } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    const years = Object.keys(stats.byYear).map(Number).sort((a, b) => a - b);
    if (years.length < 2 || !canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    const isPseukim = filters.pctMode !== 'aliyot';
    const total     = isPseukim ? stats.totalPseukim : stats.totalAliyot;

    let cumNew = 0;
    const newData: number[] = [], newCounts: number[] = [];
    for (const y of years) {
      const entry = stats.byYear[y];
      if (entry) cumNew += isPseukim ? entry.newPseukim : entry.newAliyot;
      newData.push(toPct(cumNew, total));
      newCounts.push(cumNew);
    }

    const maxPct = newData[newData.length - 1] ?? 0;
    /* Round up to the nearest 5% with ~25% headroom so the line isn't crammed at the top */
    const yMax  = Math.max(5, Math.ceil(maxPct * 1.25 / 5) * 5);
    const y1Max = Math.round(yMax / 100 * total);

    const datasets: Chart['data']['datasets'] = [
      {
        data:                 newData,
        borderColor:          C_ACCENT,
        backgroundColor:      C_ACCENT + '22',
        fill:                 true,
        tension:              0.3,
        pointRadius:          4,
        pointHoverRadius:     6,
        pointBackgroundColor: C_ACCENT,
        borderWidth:          2,
      },
    ];

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels: years.map(String), datasets },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: ctx => `Year ${ctx[0]?.label ?? ''}`,
              label: ctx => {
                const idx   = ctx.dataIndex ?? 0;
                const pct   = ctx.parsed.y ?? 0;
                const delta = (pct - (newData[idx - 1] ?? 0)).toFixed(2);
                const count = newCounts[idx] ?? 0;
                const unit  = isPseukim ? 'pseukim' : 'aliyot';
                return [`Cumulative: ${pct.toFixed(2)}%`, `+${delta}% this year`, `${count} ${unit} read`];
              },
            },
          },
        },
        scales: {
          x:  { grid: { color: C_SURFACE2 }, ticks: { color: C_MUTED, font: { size: 11 } }, title: { display: true, text: 'Year',                              color: C_MUTED, font: { size: 11 } } },
          y:  { min: 0, max: yMax,  grid: { color: C_SURFACE2 }, ticks: { color: C_MUTED, font: { size: 11 }, callback: v => `${v}%` },                        title: { display: true, text: '% of Torah',                        color: C_MUTED, font: { size: 11 } } },
          y1: { position: 'right', min: 0, max: y1Max, grid: { drawOnChartArea: false }, ticks: { color: C_MUTED, font: { size: 11 }, callback: v => String(Math.round(Number(v))) }, title: { display: true, text: isPseukim ? 'Pseukim' : 'Aliyot', color: C_MUTED, font: { size: 11 } } },
        },
      },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [stats, filters]);

  if (Object.keys(stats.byYear).length < 2) return null;

  return (
    <Card className="card-surface">
      <Text fw={600} mb={12} c="dimmed" className="label-caps" size="xs">Total % Read Over Time</Text>
      <div className="plc-wrapper">
        <canvas ref={canvasRef} />
      </div>
    </Card>
  );
}
