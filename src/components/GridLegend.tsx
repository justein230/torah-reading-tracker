import './GridLegend.css';
import { futureBg, partialBg, partialBorder } from '../utils.js';

export const EXAMPLE_COLOR = '#4a90d9';

export type LegendKey = 'read' | 'scheduled' | 'reread' | 'partial' | 'unread' | 'na';

interface LegendItemProps {
  label: string;
  bg: string;
  border: string;
  dashed?: boolean;
  dot?: boolean;
}

const LEGEND_DEFS: Record<LegendKey, LegendItemProps> = {
  read:      { label: 'Read',                    bg: EXAMPLE_COLOR,           border: EXAMPLE_COLOR },
  scheduled: { label: 'Scheduled',               bg: futureBg(EXAMPLE_COLOR), border: EXAMPLE_COLOR,                dashed: true },
  reread:    { label: 'Read + upcoming re-read', bg: EXAMPLE_COLOR,           border: EXAMPLE_COLOR,                dot: true },
  partial:   { label: 'Partially read',          bg: partialBg(EXAMPLE_COLOR), border: partialBorder(EXAMPLE_COLOR) },
  unread:    { label: 'Not yet read',            bg: 'var(--cell-unread)',     border: 'var(--cell-unread-border)' },
  na:        { label: 'Not in this reading mode', bg: 'transparent',          border: 'var(--cell-unread-border)',  dashed: true },
};

const LEGEND_ORDER: LegendKey[] = ['read', 'scheduled', 'reread', 'partial', 'unread', 'na'];

function LegendSwatch({ bg, border, dashed, dot }: Readonly<Omit<LegendItemProps, 'label'>>) {
  return (
    <span
      className={`legend-swatch${dashed ? ' dashed' : ''}`}
      style={{ background: bg, borderColor: border }}
    >
      {dot && <span className="reread-dot" />}
    </span>
  );
}

export function GridLegend({ show }: { readonly show: LegendKey[] }) {
  const items = LEGEND_ORDER.filter(k => show.includes(k)).map(k => LEGEND_DEFS[k]);
  return (
    <ul className="grid-legend" aria-label="Grid legend">
      {items.map(({ label, ...swatch }) => (
        <li key={label} className="legend-item">
          <LegendSwatch {...swatch} />
          <span className="legend-label">{label}</span>
        </li>
      ))}
    </ul>
  );
}
