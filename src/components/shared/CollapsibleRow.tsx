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
  // Children mount on first open and stay mounted so the collapse animation still has content to hide;
  // never-opened rows cost nothing in the DOM.
  const [everOpened, setEverOpened] = useState(false);
  const toggle = () => {
    setEverOpened(true);
    setOpen(o => !o);
  };
  return (
    <div className={`collapsible-row${open ? ' open' : ''}`}>
      <button
        type="button"
        className="collapsible-summary"
        style={accentColor ? { borderLeftColor: accentColor } : undefined}
        onClick={toggle}
      >
        {summary}
        {corner && <div className="collapsible-corner">{corner}</div>}
      </button>
      <div className="collapsible-slider">
        <div className="collapsible-inner">{everOpened && children}</div>
      </div>
    </div>
  );
}
