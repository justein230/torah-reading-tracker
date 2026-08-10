import { Box, Stack, Text } from '@mantine/core';

interface RingProps {
  readonly pct: number;
  readonly pctCommitted?: number;
  readonly color: string;
  readonly size?: number;
  readonly label: string;
  readonly sub1?: string;
  readonly sub2?: string;
}

export function Ring({ pct, pctCommitted, color, size = 140, label, sub1, sub2 }: RingProps) {
  const R = 40, c = 2 * Math.PI * R;
  const oPast    = c * (1 - pct / 100);
  const deltaLen = pctCommitted != null && pctCommitted > pct
    ? c * (pctCommitted - pct) / 100
    : 0;
  return (
    <Stack align="center" gap={6}>
      <Box style={{ position: 'relative', width: size, height: size }}>
        <svg viewBox="0 0 90 90" width={size} height={size} className="ring-svg">
          <circle cx="45" cy="45" r={R} fill="none" stroke="var(--surface2)" strokeWidth="8" />
          {deltaLen > 0 && (
            <g transform={`rotate(${(pct / 100 * 360).toFixed(2)} 45 45)`}>
              <circle cx="45" cy="45" r={R} fill="none" stroke={color + '55'} strokeWidth="8"
                strokeDasharray={`${deltaLen.toFixed(2)} ${c.toFixed(2)}`}
                strokeDashoffset="0"
                strokeLinecap="round" />
            </g>
          )}
          <circle cx="45" cy="45" r={R} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={c.toFixed(2)} strokeDashoffset={oPast.toFixed(2)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset .7s ease' }} />
        </svg>
        <div className="ring-center">
          <Text fw={700} size="xl" style={{ color }}>{pct.toFixed(2)}%</Text>
          {deltaLen > 0 && pctCommitted != null && (
            <Text style={{ color: color + 'bb', fontSize: 12, lineHeight: 1.3 }}>
              {pctCommitted.toFixed(2)}%↑
            </Text>
          )}
        </div>
      </Box>
      <Stack align="center" gap={2} style={{ width: size, textAlign: 'center' }}>
        <Text size="xs" fw={600} style={{ color }}>{label}</Text>
        <Text size="xs" c="dimmed">{sub1}</Text>
        {sub2 && <Text size="xs" c="dimmed">{sub2}</Text>}
      </Stack>
    </Stack>
  );
}
