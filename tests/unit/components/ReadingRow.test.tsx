import React from 'react';
import { screen } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { ReadingRow } from '../../../src/components/shared/ReadingRow.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx, MOCK_SEFER, MOCK_PARSHA } from '../../helpers/appContextMock.js';
import type { LogEntry } from '../../../src/types/index.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));

import { useApp } from '../../../src/context/AppContext.js';

const baseEntry: LogEntry = {
  sefer:       MOCK_SEFER,
  parsha:      MOCK_PARSHA,
  aliyah:      1,
  pseukim:     45,
  pct:         2.31,
  occasion:    'Shabbat',
  location:    'Main Shul',
  reread:      false,
  displayDate: '2024-03-15',
};

beforeEach(() => {
  (useApp as Mock).mockReturnValue(makeCtx());
});

describe('ReadingRow', () => {
  it('renders transliteration from TLIT', () => {
    renderWithProviders(<ReadingRow r={baseEntry} />);
    expect(screen.getByText(/Bereishit/)).toBeInTheDocument();
  });

  it('renders English sefer name from SEFER_MAP', () => {
    renderWithProviders(<ReadingRow r={baseEntry} />);
    expect(screen.getByText(/Genesis/)).toBeInTheDocument();
  });

  it('renders aliyah number', () => {
    renderWithProviders(<ReadingRow r={baseEntry} />);
    expect(screen.getByText(/Aliyah 1/)).toBeInTheDocument();
  });

  it.each([
    ['pseukim count',                     '45 pseukim'],
    ['percentage',                        '2.31%'],
    ['formatted date in non-compact mode', 'Mar 15, 2024'],
  ])('renders %s', (_label, text) => {
    renderWithProviders(<ReadingRow r={baseEntry} />);
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('compact mode hides date', () => {
    renderWithProviders(<ReadingRow r={baseEntry} compact />);
    expect(screen.queryByText('Mar 15, 2024')).not.toBeInTheDocument();
  });

  it('shows occasion and location when not a reread', () => {
    renderWithProviders(<ReadingRow r={baseEntry} />);
    expect(screen.getByText(/Shabbat/)).toBeInTheDocument();
    expect(screen.getByText(/Main Shul/)).toBeInTheDocument();
  });

  it('reread entry shows RE-READ badge', () => {
    renderWithProviders(<ReadingRow r={{ ...baseEntry, reread: true }} />);
    expect(screen.getByText(/RE-READ/i)).toBeInTheDocument();
  });

  it('reread entry hides occasion and location', () => {
    renderWithProviders(<ReadingRow r={{ ...baseEntry, reread: true, occasion: 'Shabbat', location: 'Shul' }} />);
    expect(screen.queryByText(/Shabbat/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Shul/)).not.toBeInTheDocument();
  });

  it('renders custom actions slot', () => {
    renderWithProviders(<ReadingRow r={baseEntry} actions={<span data-testid="slot-action">Delete</span>} />);
    expect(screen.getByTestId('slot-action')).toBeInTheDocument();
  });

  it('falls back to #888 color when sefer not in SEFER_MAP', () => {
    (useApp as Mock).mockReturnValue(makeCtx({ SEFER_MAP: {} }));
    expect(() =>
      renderWithProviders(<ReadingRow r={{ ...baseEntry, sefer: 'UNKNOWN' }} />)
    ).not.toThrow();
    expect(screen.getByText('45 pseukim')).toBeInTheDocument();
  });
});
