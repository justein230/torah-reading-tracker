import { screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import Calendar from '../../../src/components/Calendar.js';
import { KIND_META } from '../../../src/components/CalendarGrid.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx } from '../../helpers/appContextMock.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

// tests/setup.js stubs matchMedia to matches:false, and isTouch is false under jsdom, so
// the component starts in grid (desktop) view unless a test overrides both.
const CURRENT_YEAR = new Date().getFullYear();

/** The ‹ / › / view-toggle buttons, in DOM order. */
const nav = () => ({
  prev:   screen.getByText('‹'),
  next:   screen.getByText('›'),
  toggle: screen.getByTitle(/^Switch to /),
});

const label = () => (document.querySelector('.mantine-Text-root') as HTMLElement).textContent;

beforeEach(() => {
  (useApp as Mock).mockReturnValue(makeCtx({ allRows: [] }));
});

afterEach(() => {
  vi.useRealTimers();
});

// ── initial state ─────────────────────────────────────────────────────────────

describe('Calendar — initial view', () => {
  it('opens on the current month and year when no year filter is set', () => {
    renderWithProviders(<Calendar />);
    expect(label()).toContain(String(CURRENT_YEAR));
  });

  it('opens on the last selected year when the year filter is set', () => {
    (useApp as Mock).mockReturnValue(makeCtx({
      allRows: [],
      filters: { sefarim: [], years: [2011, 2023, 2025], includeFutureDates: false, pctMode: 'pseukim', showHolidayRing: false, showWeekdayRing: false },
    }));
    renderWithProviders(<Calendar />);
    expect(label()).toContain('2025');
  });

  it('starts in grid view on a desktop pointer', () => {
    renderWithProviders(<Calendar />);
    expect(nav().toggle).toHaveAttribute('title', 'Switch to list view');
  });
});

// ── month navigation (grid view) ──────────────────────────────────────────────

describe('Calendar — month navigation', () => {
  /** Steps `n` months forward (positive) or back (negative) from the opening month. */
  function step(n: number) {
    const { prev, next } = nav();
    for (let i = 0; i < Math.abs(n); i++) fireEvent.click(n > 0 ? next : prev);
  }

  it('advances one month at a time within the same year', () => {
    renderWithProviders(<Calendar />);
    const start = label();
    step(1);
    expect(label()).not.toBe(start);
    expect(label()).toContain(String(CURRENT_YEAR));
  });

  it('wraps December → January and rolls the year forward', () => {
    renderWithProviders(<Calendar />);
    // Walk to December of the opening year, then take one more step.
    step(11 - new Date().getMonth());
    expect(label()).toBe(`December ${CURRENT_YEAR}`);

    step(1);
    expect(label()).toBe(`January ${CURRENT_YEAR + 1}`);
  });

  it('wraps January → December and rolls the year back', () => {
    renderWithProviders(<Calendar />);
    step(-new Date().getMonth());
    expect(label()).toBe(`January ${CURRENT_YEAR}`);

    step(-1);
    expect(label()).toBe(`December ${CURRENT_YEAR - 1}`);
  });
});

// ── view toggle + year navigation (agenda view) ───────────────────────────────

describe('Calendar — view toggle', () => {
  it('switches to agenda view and offers the way back', () => {
    renderWithProviders(<Calendar />);
    fireEvent.click(nav().toggle);
    expect(nav().toggle).toHaveAttribute('title', 'Switch to grid view');

    fireEvent.click(nav().toggle);
    expect(nav().toggle).toHaveAttribute('title', 'Switch to list view');
  });

  it('labels agenda view with the bare year', () => {
    renderWithProviders(<Calendar />);
    fireEvent.click(nav().toggle);
    expect(label()).toBe(String(CURRENT_YEAR));
  });

  it('steps by year rather than by month while in agenda view', () => {
    renderWithProviders(<Calendar />);
    fireEvent.click(nav().toggle);

    fireEvent.click(nav().next);
    expect(label()).toBe(String(CURRENT_YEAR + 1));

    fireEvent.click(nav().prev);
    fireEvent.click(nav().prev);
    expect(label()).toBe(String(CURRENT_YEAR - 1));
  });
});

// ── calendar subscription ─────────────────────────────────────────────────────

describe('Calendar — subscription controls', () => {
  it('links the subscribe icon to the ICS feed over webcal://', () => {
    renderWithProviders(<Calendar />);
    expect(screen.getByTitle('Subscribe to calendar'))
      .toHaveAttribute('href', `webcal://${globalThis.location.host}/api/calendar.ics`);
  });

  it('copies the https feed URL and confirms, then reverts after 2s', () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    renderWithProviders(<Calendar />);
    fireEvent.click(screen.getByTitle('Copy calendar URL'));

    expect(writeText).toHaveBeenCalledWith(`${globalThis.location.origin}/api/calendar.ics`);
    expect(screen.getByTitle('Copied!')).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(2000); });
    expect(screen.getByTitle('Copy calendar URL')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});

// ── legend ────────────────────────────────────────────────────────────────────

describe('Calendar — legend', () => {
  it('names all four reading kinds', () => {
    renderWithProviders(<Calendar />);
    for (const { label: kindLabel } of Object.values(KIND_META)) {
      expect(screen.getAllByText(new RegExp(kindLabel)).length).toBeGreaterThan(0);
    }
  });

  it('gives a swatch to the three accented kinds only — parsha chips are colored by sefer', () => {
    const { container } = renderWithProviders(<Calendar />);
    const swatches = Array.from(container.querySelectorAll('.cal-legend-swatch')) as HTMLElement[];

    expect(swatches).toHaveLength(3);
    expect(screen.getByText(/colored by sefer/)).toBeInTheDocument();
  });
});
