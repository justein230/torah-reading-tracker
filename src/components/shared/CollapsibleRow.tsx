import React, { useState } from 'react';
import './CollapsibleRow.css';

interface CollapsibleRowProps {
  summary: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
  /** Content pinned to the top-right corner of the card, above the (vertically centered) arrow. */
  corner?: React.ReactNode;
}

export function CollapsibleRow({ summary, children, accentColor, corner }: Readonly<CollapsibleRowProps>) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`collapsible-row${open ? ' open' : ''}`}>
      <button
        type="button"
        className="collapsible-summary"
        style={accentColor ? { borderLeftColor: accentColor } : undefined}
        onClick={() => setOpen(o => !o)}
      >
        {summary}
        {corner && <div className="collapsible-corner">{corner}</div>}
      </button>
      <div className="collapsible-slider">
        <div className="collapsible-inner">{children}</div>
      </div>
    </div>
  );
}
