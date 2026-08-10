import React from 'react';
import './SeferDot.css';

interface SeferDotProps {
  color: string;
  reread?: boolean;
}

export function SeferDot({ color, reread = false }: Readonly<SeferDotProps>) {
  const style = reread ? { borderColor: color } : { background: color };
  return (
    <span
      className={`sefer-dot${reread ? ' sefer-dot--reread' : ''}`}
      style={style}
    />
  );
}
