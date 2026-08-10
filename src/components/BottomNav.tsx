import './BottomNav.css';
import IconHome     from '@tabler/icons-react/dist/esm/icons/IconHome.mjs';
import IconGrid3x3  from '@tabler/icons-react/dist/esm/icons/IconGrid3x3.mjs';
import IconNotebook from '@tabler/icons-react/dist/esm/icons/IconNotebook.mjs';
import IconList     from '@tabler/icons-react/dist/esm/icons/IconList.mjs';
import IconCalendar from '@tabler/icons-react/dist/esm/icons/IconCalendar.mjs';
import { TABS, TAB_LABELS } from '../constants.js';

const ICONS: Record<string, typeof IconHome> = {
  overview: IconHome,
  grid:     IconGrid3x3,
  log:      IconNotebook,
  details:  IconList,
  calendar: IconCalendar,
};

interface BottomNavProps {
  readonly activeTab: string;
  readonly onChange: (tab: string) => void;
}

export default function BottomNav({ activeTab, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {TABS.map(t => {
        const IconComp = ICONS[t] ?? IconHome;
        return (
          <button
            key={t}
            type="button"
            className="bottom-nav-item"
            data-active={t === activeTab}
            aria-current={t === activeTab ? 'page' : undefined}
            onClick={() => onChange(t)}
          >
            <IconComp size={22} stroke={1.75} />
            <span>{TAB_LABELS[t]}</span>
          </button>
        );
      })}
    </nav>
  );
}
