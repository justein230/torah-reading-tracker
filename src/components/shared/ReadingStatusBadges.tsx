import React from 'react';

/**
 * Renders inline status badges for reread and future-reading indicators.
 * Used in calendar grid cells and agenda items; compact prop shortens the reread label.
 */
interface ReadingStatusBadgesProps {
  isReread?: boolean;
  isFuture?: boolean;
  compact?: boolean;
}

export function ReadingStatusBadges({ isReread, isFuture, compact = false }: Readonly<ReadingStatusBadgesProps>) {
  return (
    <>
      {isReread && <span className="cal-reread-badge">{compact ? '↺' : '↺ re-read'}</span>}
      {isFuture && <span className="cal-future-badge">↑ upcoming</span>}
    </>
  );
}
