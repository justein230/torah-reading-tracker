import type { ReactNode } from 'react';

interface SeferSectionProps {
  title:              ReactNode;
  badge:              ReactNode;
  columnKeys:         (string | number)[];
  renderColumnLabel?: (key: string | number) => ReactNode;
  opacity?:           number;
  children:           ReactNode;
}

export function SeferSection({
  title,
  badge,
  columnKeys,
  renderColumnLabel = String,
  opacity = 1,
  children,
}: Readonly<SeferSectionProps>) {
  return (
    <div className="sefer-section" style={{ opacity }}>
      <div className="sefer-hdr">
        {title}
        <span className="badge" style={{ color: 'var(--text)' }}>{badge}</span>
      </div>
      <div className="aliyah-col-header">
        <div className="aliyah-col-spacer" />
        <div className="aliyah-cells">
          {columnKeys.map(k => (
            <div key={k} className="aliyah-col-num">{renderColumnLabel(k)}</div>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
