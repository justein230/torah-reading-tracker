import { screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AgendaView } from '../../../src/components/CalendarAgenda.js';
import { KIND_META } from '../../../src/components/CalendarGrid.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCalEntry } from '../../helpers/fixtures.js';
import type { CalDayMap, SeferMeta } from '../../../src/types/index.js';

const GENESIS = 'Genesis';
const EXODUS  = 'Exodus';

const SEFER_MAP: Record<string, SeferMeta> = {
  [GENESIS]: { en: 'Genesis', color: '#4a7c59', chapterVerses: [] },
  [EXODUS]:  { en: 'Exodus',  color: '#c87941', chapterVerses: [] },
};

// Fixed literals rather than a mocked TODAY_STR, matching calendarDayMap.test.ts.
const PAST   = '2024-04-10';
const FUTURE = '2099-04-10';

function renderAgenda(dayMap: CalDayMap, year = 2024) {
  return renderWithProviders(<AgendaView year={year} dayMap={dayMap} SEFER_MAP={SEFER_MAP} />);
}

const monthLabels = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('.cal-agenda-month-label')).map(el => el.textContent);

const dateLabels = (c: HTMLElement) =>
  Array.from(c.querySelectorAll('.cal-agenda-date')).map(el => el.textContent);

// ── grouping ──────────────────────────────────────────────────────────────────

describe('AgendaView — grouping', () => {
  it('groups days under their month, in calendar order regardless of dayMap key order', () => {
    const { container } = renderAgenda({
      '2024-07-04': [makeCalEntry()],
      '2024-01-13': [makeCalEntry()],
      '2024-03-02': [makeCalEntry()],
    });

    expect(monthLabels(container)).toEqual(['January 2024', 'March 2024', 'July 2024']);
  });

  it('sorts days within a month ascending', () => {
    const { container } = renderAgenda({
      '2024-01-27': [makeCalEntry()],
      '2024-01-06': [makeCalEntry()],
      '2024-01-13': [makeCalEntry()],
    });

    expect(dateLabels(container)).toEqual(['Jan 6, 2024', 'Jan 13, 2024', 'Jan 27, 2024']);
  });

  it('excludes days outside the requested year', () => {
    const { container } = renderAgenda({
      '2023-12-30': [makeCalEntry()],
      '2024-01-06': [makeCalEntry()],
      '2025-01-04': [makeCalEntry()],
    }, 2024);

    expect(dateLabels(container)).toEqual(['Jan 6, 2024']);
  });

  it('shows an empty state naming the year when nothing falls in it', () => {
    renderAgenda({ '2023-12-30': [makeCalEntry()] }, 2024);
    expect(screen.getByText('No readings in 2024.')).toBeInTheDocument();
  });
});

// ── day summary ───────────────────────────────────────────────────────────────

describe('AgendaView — day summary', () => {
  it('counts the aliyot read that day', () => {
    renderAgenda({ [PAST]: [makeCalEntry({ aliyah: 1 }), makeCalEntry({ aliyah: 2 })] });
    expect(screen.getByText('2 aliyot')).toBeInTheDocument();
  });

  it('shows one dot per distinct sefer, not one per reading', () => {
    const { container } = renderAgenda({
      [PAST]: [
        makeCalEntry({ sefer: GENESIS, aliyah: 1 }),
        makeCalEntry({ sefer: GENESIS, aliyah: 2 }),
        makeCalEntry({ sefer: EXODUS,  aliyah: 3 }),
      ],
    });

    expect(container.querySelectorAll('.cal-agenda-dots .sefer-dot')).toHaveLength(2);
  });

  it('falls back to grey dots for a sefer missing from SEFER_MAP', () => {
    const { container } = renderAgenda({ [PAST]: [makeCalEntry({ sefer: 'Nowhere' })] });
    fireEvent.click(container.querySelector('.collapsible-summary') as HTMLElement);

    const dots = Array.from(container.querySelectorAll('.sefer-dot')) as HTMLElement[];
    expect(dots.length).toBeGreaterThan(0);
    for (const dot of dots) expect(dot.style.background).toBe('rgb(136, 136, 136)'); // #888
  });

  it('flags a future day as upcoming and accents its row', () => {
    const { container } = renderAgenda({ [FUTURE]: [makeCalEntry({ isFuture: true })] }, 2099);

    expect(screen.getByText('Upcoming')).toBeInTheDocument();
    expect(container.querySelector('.cal-agenda-date')).toHaveClass('future');
    expect((container.querySelector('.collapsible-summary') as HTMLElement).style.borderLeftColor)
      .toBe('rgb(96, 165, 250)'); // #60a5fa
  });

  it('leaves a past day unflagged and unaccented', () => {
    const { container } = renderAgenda({ [PAST]: [makeCalEntry()] });

    expect(screen.queryByText('Upcoming')).toBeNull();
    expect(container.querySelector('.cal-agenda-date')).not.toHaveClass('future');
    expect((container.querySelector('.collapsible-summary') as HTMLElement).style.borderLeftColor).toBe('');
  });
});

// ── expanded detail ───────────────────────────────────────────────────────────

describe('AgendaView — expanded day detail', () => {
  it('reveals each reading with its parsha, long aliyah label and pseukim count', () => {
    const { container } = renderAgenda({
      [PAST]: [
        makeCalEntry({ parsha: 'בראשית', aliyah: 1, pseukim: 31 }),
        makeCalEntry({ parsha: 'בראשית', aliyah: 2, pseukim: 24, kind: 'weekday' }),
      ],
    });

    fireEvent.click(container.querySelector('.collapsible-summary') as HTMLElement);

    const items = container.querySelector('.cal-agenda-items') as HTMLElement;
    expect(items.querySelectorAll('.cal-agenda-item')).toHaveLength(2);
    expect(within(items).getByText(/Aliyah 1/)).toBeInTheDocument();
    expect(within(items).getByText('31 pseukim')).toBeInTheDocument();
    expect(within(items).getByText(KIND_META.weekday.label)).toBeInTheDocument();
  });

  it('marks a re-read reading inside the expanded list', () => {
    const { container } = renderAgenda({ [PAST]: [makeCalEntry({ isReread: true })] });
    fireEvent.click(container.querySelector('.collapsible-summary') as HTMLElement);

    expect(screen.getByText('↺ re-read')).toBeInTheDocument();
    expect(container.querySelector('.cal-agenda-item .sefer-dot')).toHaveClass('sefer-dot--reread');
  });
});
