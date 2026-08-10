import React, { useState } from 'react';
import './CollapsibleRow.css';

interface CollapsibleRowProps {
  summary: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
}

export function CollapsibleRow({ summary, children, accentColor }: Readonly<CollapsibleRowProps>) {
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
      </button>
      <div className="collapsible-slider">
        <div className="collapsible-inner">{children}</div>
      </div>
    </div>
  );
}
