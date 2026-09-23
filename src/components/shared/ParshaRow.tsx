import type { ReactNode } from 'react';

interface ParshaRowProps {
  readonly label: ReactNode;
  readonly children: ReactNode;
  readonly trailing?: ReactNode;
}

/** One row of a grid: a parsha/occasion label followed by its aliyah cells.
 * Shared across Grid, DoubleParshaGrid, HolidayGrid and WeekdayGrid, whose label
 * content and cell markup differ but whose row/label/cells wrapper structure is identical. */
export function ParshaRow({ label, children, trailing }: ParshaRowProps) {
  return (
    <div className="parsha-row">
      <div className="parsha-label">{label}</div>
      <div className="aliyah-cells">{children}</div>
      {trailing}
    </div>
  );
}
