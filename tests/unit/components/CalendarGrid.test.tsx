import { screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MonthGrid, KindBadge, KIND_META } from '../../../src/components/CalendarGrid.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCalEntry } from '../../helpers/fixtures.js';
import type { CalDayMap, CalKind, SeferMeta } from '../../../src/types/index.js';

// jsdom normalizes hex colors to rgb() in element.style
const GENESIS       = 'Genesis';
const GENESIS_COLOR = '#4a7c59';
const GENESIS_RGB   = 'rgb(74, 124, 89)';
const FALLBACK_RGB  = 'rgb(136, 136, 136)'; // #888, used when a sefer is missing from SEFER_MAP

const SEFER_MAP: Record<string, SeferMeta> = {
  [GENESIS]: { en: 'Genesis', color: GENESIS_COLOR, chapterVerses: [] },
};

function renderMonth(dayMap: CalDayMap, year = 2024, month = 1) {
  return renderWithProviders(<MonthGrid year={year} month={month} dayMap={dayMap} SEFER_MAP={SEFER_MAP} />);
}

const days = (c: HTMLElement) => Array.from(c.querySelectorAll('.cal-day:not(.other-month)')) as HTMLElement[];
const chips = (el: HTMLElement)  => Array.from(el.querySelectorAll('.cal-event')) as HTMLElement[];

/** The cell for a given day-of-month, 1-indexed. */
const dayCell = (c: HTMLElement, d: number) => days(c)[d - 1]!;

// ── calendar arithmetic ───────────────────────────────────────────────────────
// A wrong firstDow or daysInMonth silently shifts every reading onto the wrong weekday,
// so these are the load-bearing assertions in this file.

describe('MonthGrid — calendar arithmetic', () => {
  it('pads February 2024 with 4 leading blanks (the 1st is a Thursday) and 29 days', () => {
    const { container } = renderMonth({}, 2024, 1);
    expect(container.querySelectorAll('.cal-day.other-month')).toHaveLength(4);
    expect(days(container)).toHaveLength(29);
  });

  it('renders 28 days for the non-leap February 2025, padded with 6 blanks', () => {
    const { container } = renderMonth({}, 2025, 1);
    expect(container.querySelectorAll('.cal-day.other-month')).toHaveLength(6);
    expect(days(container)).toHaveLength(28);
  });

  it('renders no leading blanks for a month starting on Sunday (September 2024)', () => {
    const { container } = renderMonth({}, 2024, 8);
    expect(container.querySelectorAll('.cal-day.other-month')).toHaveLength(0);
    expect(days(container)).toHaveLength(30);
  });

  it('places a reading on the day matching its ISO date, not an off-by-one neighbour', () => {
    const { container } = renderMonth({ '2024-02-10': [makeCalEntry()] });

    expect(chips(dayCell(container, 10))).toHaveLength(1);
    expect(chips(dayCell(container, 9))).toHaveLength(0);
    expect(chips(dayCell(container, 11))).toHaveLength(0);
  });

  it('renders the seven weekday headers', () => {
    const { container } = renderMonth({});
    expect(container.querySelectorAll('.cal-dow')).toHaveLength(7);
  });
});

// ── day cells ─────────────────────────────────────────────────────────────────

describe('MonthGrid — day cells', () => {
  it('makes a day with readings an interactive button and leaves an empty day inert', () => {
    const { container } = renderMonth({ '2024-02-05': [makeCalEntry()] });

    const withReadings = dayCell(container, 5);
    expect(withReadings.tagName).toBe('BUTTON');
    expect(withReadings).toHaveClass('has-readings');

    const empty = dayCell(container, 6);
    expect(empty.tagName).toBe('DIV');
    expect(empty).not.toHaveClass('has-readings');
  });

  it('shows the first two readings as chips and rolls the rest into a "+N more" marker', () => {
    const five = Array.from({ length: 5 }, (_, i) => makeCalEntry({ aliyah: i + 1 }));
    const { container } = renderMonth({ '2024-02-05': five });

    const cell = dayCell(container, 5);
    expect(chips(cell)).toHaveLength(2);
    expect(within(cell).getByText('+3 more')).toBeInTheDocument();
  });

  it('omits the overflow marker when a day has exactly two readings', () => {
    const { container } = renderMonth({
      '2024-02-05': [makeCalEntry({ aliyah: 1 }), makeCalEntry({ aliyah: 2 })],
    });
    expect(dayCell(container, 5).querySelector('.cal-extra')).toBeNull();
  });

  it('marks a day all-future only when every reading on it is in the future', () => {
    const { container } = renderMonth({
      '2024-02-05': [makeCalEntry({ isFuture: true }), makeCalEntry({ isFuture: true, aliyah: 2 })],
      '2024-02-06': [makeCalEntry({ isFuture: true }), makeCalEntry({ isFuture: false, aliyah: 2 })],
    });

    expect(dayCell(container, 5)).toHaveClass('all-future');
    expect(dayCell(container, 6)).not.toHaveClass('all-future');
  });

  it('labels chips with the parsha and the short aliyah form', () => {
    const { container } = renderMonth({
      '2024-02-05': [makeCalEntry({ parsha: 'נח', aliyah: 8 })],
    });

    const cell = dayCell(container, 5);
    expect(within(cell).getByText('נח')).toBeInTheDocument();
    expect(within(cell).getByText('M')).toBeInTheDocument(); // aliyah 8 renders as Maftir
  });
});

// ── chip styling ──────────────────────────────────────────────────────────────

describe('MonthGrid — chip styling by read state', () => {
  it('fills a past reading with its sefer color', () => {
    const { container } = renderMonth({ '2024-02-05': [makeCalEntry()] });
    const chip = chips(dayCell(container, 5))[0]!;

    expect(chip.className).toBe('cal-event');
    expect(chip.style.background).toContain(GENESIS_RGB);
  });

  it('outlines a re-read rather than filling it', () => {
    const { container } = renderMonth({ '2024-02-05': [makeCalEntry({ isReread: true })] });
    const chip = chips(dayCell(container, 5))[0]!;

    expect(chip).toHaveClass('reread');
    expect(chip.style.borderColor).toBe(GENESIS_RGB);
    expect(chip.style.background).toBe('');
  });

  // futureBg() builds a gradient containing var(--surface); jsdom's CSS parser rejects the
  // shorthand and drops it, so the observable difference from a past reading is the class
  // and the outlined (rather than filled) treatment.
  it('outlines a future reading with the future class instead of filling it', () => {
    const { container } = renderMonth({ '2024-02-05': [makeCalEntry({ isFuture: true })] });
    const chip = chips(dayCell(container, 5))[0]!;

    expect(chip.className).toBe('cal-event future');
    expect(chip.style.borderColor).toBe(GENESIS_RGB);
    expect(chip.style.background).not.toBe(GENESIS_RGB);
  });

  it('falls back to grey for a sefer missing from SEFER_MAP', () => {
    const { container } = renderMonth({ '2024-02-05': [makeCalEntry({ sefer: 'Nowhere' })] });
    expect(chips(dayCell(container, 5))[0]!.style.background).toContain(FALLBACK_RGB);
  });

  it.each(['occasion', 'weekday', 'hosafah'] as const)(
    'gives a %s chip its kind accent as a left stripe',
    kind => {
      const { container } = renderMonth({ '2024-02-05': [makeCalEntry({ kind })] });
      const style = chips(dayCell(container, 5))[0]!.getAttribute('style') ?? '';
      expect(style).toContain('inset 3px 0 0 0');
    },
  );

  it('gives a standard chip no stripe — sefer color alone identifies it', () => {
    const { container } = renderMonth({ '2024-02-05': [makeCalEntry({ kind: 'standard' })] });
    expect(chips(dayCell(container, 5))[0]!.getAttribute('style') ?? '').not.toContain('inset');
  });
});

// ── tooltip ───────────────────────────────────────────────────────────────────

describe('MonthGrid — day tooltip', () => {
  const THREE = {
    '2024-02-05': [
      makeCalEntry({ aliyah: 1, pseukim: 11 }),
      makeCalEntry({ aliyah: 2, pseukim: 12 }),
      makeCalEntry({ aliyah: 3, pseukim: 13, kind: 'occasion' }),
    ],
  };

  it('opens on click and lists every reading, including the ones the cell hid', () => {
    const { container } = renderMonth(THREE);
    fireEvent.click(dayCell(container, 5));

    const tip = container.querySelector('.cal-day-tip') as HTMLElement;
    expect(tip).toBeTruthy();
    // The cell showed 2 chips + "+1 more"; the tooltip is where the third becomes visible.
    expect(tip.querySelectorAll('.cal-tip-row')).toHaveLength(3);
    expect(within(tip).getByText('Feb 5, 2024')).toBeInTheDocument();
    expect(within(tip).getByText(/13 pseukim/)).toBeInTheDocument();
  });

  it('renders the long aliyah label and the kind badge inside the tooltip', () => {
    const { container } = renderMonth(THREE);
    fireEvent.click(dayCell(container, 5));

    const tip = container.querySelector('.cal-day-tip') as HTMLElement;
    expect(within(tip).getByText(/Aliyah 1/)).toBeInTheDocument();
    expect(within(tip).getByText(KIND_META.occasion.label)).toBeInTheDocument();
  });

  it('closes when the same day is clicked again', () => {
    const { container } = renderMonth(THREE);
    fireEvent.click(dayCell(container, 5));
    fireEvent.click(dayCell(container, 5));
    expect(container.querySelector('.cal-day-tip')).toBeNull();
  });

  it('switches to the other day when a different day is clicked', () => {
    const { container } = renderMonth({ ...THREE, '2024-02-09': [makeCalEntry()] });
    fireEvent.click(dayCell(container, 5));
    fireEvent.click(dayCell(container, 9));

    const tip = container.querySelector('.cal-day-tip') as HTMLElement;
    expect(within(tip).getByText('Feb 9, 2024')).toBeInTheDocument();
  });

  it('closes when a click lands outside any day with readings', () => {
    const { container } = renderMonth(THREE);
    fireEvent.click(dayCell(container, 5));
    expect(container.querySelector('.cal-day-tip')).toBeTruthy();

    fireEvent.click(document.body);
    expect(container.querySelector('.cal-day-tip')).toBeNull();
  });
});

// ── KindBadge ─────────────────────────────────────────────────────────────────

describe('KindBadge', () => {
  it('renders nothing for a standard parsha reading', () => {
    const { container } = renderWithProviders(<KindBadge kind="standard" />);
    expect(container.querySelector('.cal-kind-badge')).toBeNull();
  });

  it.each(['occasion', 'weekday', 'hosafah'] as CalKind[])('labels a %s reading', kind => {
    renderWithProviders(<KindBadge kind={kind} />);
    const badge = screen.getByText(KIND_META[kind].label);
    expect(badge).toHaveClass('cal-kind-badge');
  });
});
