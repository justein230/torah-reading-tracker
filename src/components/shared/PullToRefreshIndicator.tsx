import React from 'react';
import { Loader, Text } from '@mantine/core';
import IconArrowDown from '@tabler/icons-react/dist/esm/icons/IconArrowDown.mjs';
import IconCheck     from '@tabler/icons-react/dist/esm/icons/IconCheck.mjs';
import IconX         from '@tabler/icons-react/dist/esm/icons/IconX.mjs';
import { MAX_PULL, SETTLE_HEIGHT, shouldTriggerRefresh, type PullPhase } from '../../utils/pullToRefresh.js';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  phase: PullPhase;
}

export function PullToRefreshIndicator({ pullDistance, phase }: Readonly<PullToRefreshIndicatorProps>) {
  if (phase === 'idle' && pullDistance === 0) return null;

  const height = phase === 'pulling' ? pullDistance : SETTLE_HEIGHT;
  const pastThreshold = shouldTriggerRefresh(pullDistance);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        height,
        overflow: 'hidden',
        // No transition while actively dragging, so the indicator tracks the finger 1:1 —
        // otherwise every settle (canceled pull, refresh result) animates smoothly instead
        // of snapping, so it reads as a deliberate state change rather than a glitch.
        transition: phase === 'pulling' ? 'none' : 'height 0.2s ease',
      }}
    >
      {phase === 'pulling' && (
        <>
          <IconArrowDown
            size={16}
            style={{
              color: 'var(--muted)',
              transform: pastThreshold ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              opacity: Math.min(pullDistance / MAX_PULL, 1),
            }}
          />
          <Text size="xs" c="dimmed">{pastThreshold ? 'Release to refresh' : 'Pull to refresh'}</Text>
        </>
      )}
      {phase === 'refreshing' && (
        <>
          <Loader size="sm" />
          <Text size="xs" c="dimmed">Refreshing…</Text>
        </>
      )}
      {phase === 'success' && (
        <>
          <IconCheck size={18} style={{ color: 'var(--success)' }} />
          <Text size="xs" c="dimmed">Updated</Text>
        </>
      )}
      {phase === 'error' && (
        <>
          <IconX size={18} style={{ color: 'var(--error)' }} />
          <Text size="xs" c="dimmed">Refresh failed</Text>
        </>
      )}
    </div>
  );
}
