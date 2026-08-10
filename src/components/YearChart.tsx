import React, { useEffect, useRef } from 'react';
import { Card, Text } from '@mantine/core';
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import type { ScriptableScaleContext } from 'chart.js';
import { useApp } from '../context/AppContext.js';
import { fmtPct } from '../utils.js';
import type { Stats } from '../types/index.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

/* Chart.js accepts only hex/rgb — CSS custom properties don't work here */
const C_MUTED    = '#94a3b8'; /* --muted    */
const C_SURFACE2 = '#334155'; /* --surface2 */
const C_TEXT     = '#f1f5f9'; /* --text     */

function makeHatchPattern(color: string): CanvasPattern | null {
  const tile = document.createElement('canvas');
  tile.width = 10; tile.height = 10;
  const ctx  = tile.getContext('2d');
  if (!ctx) return null;
  ctx.strokeStyle = color + '99';
  ctx.lineWidth   = 2;
  for (const [x1, y1, x2, y2] of [[-1, 1, 1, -1], [0, 10, 10, 0], [9, 11, 11, 9]] as [number, number, number, number][]) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  const offscreen = document.createElement('canvas').getContext('2d');
  return offscreen ? offscreen.createPattern(tile, 'repeat') : null;
}

interface YearChartProps {
  stats: Stats;
}

export function YearChart({ stats }: Readonly<YearChartProps>) {
  const { allYears, SEFER_ORDER, SEFER_MAP, filters } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !allYears.length) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    const seferList = filters.sefarim.length ? filters.sefarim : SEFER_ORDER;
    const datasets: Chart['data']['datasets'] = seferList.map(s => ({
      label: SEFER_MAP[s]?.en ?? s,
      data:  allYears.map(y => stats.byYear[y]?.bySef?.[SEFER_MAP[s]?.en ?? s]?.aliyot ?? 0),
      backgroundColor: (SEFER_MAP[s]?.color ?? '#888') + 'cc',
      borderRadius: 3, borderSkipped: false,
    }));
    const hasUpcoming = seferList.some(s =>
      allYears.some(y => stats.byYearFuture[y]?.bySef?.[SEFER_MAP[s]?.en ?? s]?.aliyot)
    );
    if (hasUpcoming) {
      datasets.push(...seferList.map(s => ({
        label: `${SEFER_MAP[s]?.en ?? s} (upcoming)`,
        data:  allYears.map(y => stats.byYearFuture[y]?.bySef?.[SEFER_MAP[s]?.en ?? s]?.aliyot ?? 0),
        backgroundColor: makeHatchPattern(SEFER_MAP[s]?.color ?? '#888') as CanvasPattern,
        borderColor: (SEFER_MAP[s]?.color ?? '#888') + 'cc',
        borderWidth: 1,
        borderRadius: { topLeft: 0, bottomLeft: 0, topRight: 3, bottomRight: 3 } as unknown as number,
        borderSkipped: false,
      })));
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels: allYears.map(String), datasets },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: true,
        plugins: {
          legend: {
            display: seferList.length > 1 || hasUpcoming,
            labels: {
              color: C_MUTED, boxWidth: 12, font: { size: 11 },
              generateLabels: chart => {
                const base = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                const filtered = base.filter(item => !item.text.includes('(upcoming)'));
                if (hasUpcoming) {
                  filtered.push({
                    text: 'Upcoming',
                    fillStyle: makeHatchPattern(C_MUTED) as unknown as string ?? C_MUTED,
                    strokeStyle: C_MUTED + 'cc', lineWidth: 1, hidden: false, datasetIndex: -1,
                    borderRadius: 0, fontColor: C_MUTED, index: filtered.length,
                  });
                }
                return filtered;
              },
            },
            onClick: (e, item, legend) => {
              if (item.datasetIndex === -1) {
                const ch = legend.chart;
                let anyVisible = false;
                ch.data.datasets.forEach((ds, i) => {
                  if (ds.label?.includes('(upcoming)') && !ch.getDatasetMeta(i).hidden) anyVisible = true;
                });
                ch.data.datasets.forEach((ds, i) => {
                  if (ds.label?.includes('(upcoming)')) ch.getDatasetMeta(i).hidden = anyVisible;
                });
                ch.update();
              } else {
                Chart.defaults.plugins.legend.onClick.call(legend, e, item, legend);
              }
            },
          },
          tooltip: {
            callbacks: {
              title: ctx => {
                const yr = Number.parseInt(ctx[0]?.label ?? '0');
                const yd = stats.byYear[yr];
                let pct: string;
                if (filters.pctMode === 'aliyot') {
                  pct = yd ? fmtPct(yd.aliyot, stats.totalAliyot) : '0.00';
                } else {
                  pct = yd ? yd.pct.toFixed(2) : '0.00';
                }
                return [`Year ${yr}`, `${yd?.aliyot ?? 0} aliyot  •  ${yd?.uniquePseukim ?? 0} pseukim`, `${pct}%`];
              },
              label: ctx => ctx.dataset.label ?? '',
              afterBody: ctx => {
                const yr = Number.parseInt(ctx[0]?.label ?? '0');
                const en = ctx[0]?.dataset.label ?? '';
                const sd = stats.byYear[yr]?.bySef?.[en];
                if (!sd?.aliyot || seferList.length === 1) return [];
                let pct: string;
                if (filters.pctMode === 'aliyot') {
                  pct = fmtPct(sd.aliyot, stats.totalAliyot);
                } else {
                  pct = sd.pct.toFixed(2);
                }
                return [`${en}: ${sd.aliyot} aliyot  •  ${sd.uniquePseukim} pseukim`, `${pct}%`];
              },
            },
          },
        },
        scales: {
          x: { stacked: true, grid: { color: C_SURFACE2 }, ticks: { color: C_MUTED, stepSize: 1 }, title: { display: true, text: 'Aliyot Read', color: C_MUTED, font: { size: 11 } } },
          y: { stacked: true, grid: { display: false }, ticks: { color: (ctx: ScriptableScaleContext) => filters.years.length && filters.years.includes(Number.parseInt(String(ctx.tick.label ?? ''))) ? C_TEXT : C_MUTED } },
        },
      },
    });

    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [stats, allYears, SEFER_ORDER, SEFER_MAP, filters]);

  return (
    <Card className="card-surface">
      <Text fw={600} mb={12} c="dimmed" className="label-caps" size="xs">Readings by Year</Text>
      {allYears.length === 0
        ? <Text size="sm" c="dimmed">No readings recorded yet.</Text>
        : <canvas ref={canvasRef} />
      }
    </Card>
  );
}
