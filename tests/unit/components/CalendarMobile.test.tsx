import { screen } from '@testing-library/react';
import { describe, it, expect, vi, type Mock } from 'vitest';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx } from '../../helpers/appContextMock.js';

// isTouch is a module-level constant evaluated when AliyahTooltip is imported, so the touch
// case can only be set up with a file-scoped mock — hence this file rather than a case in
// Calendar.test.tsx, which must keep the real (desktop) value to be meaningful.
vi.mock('../../../src/components/AliyahTooltip.js', () => ({ isTouch: true }));
vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));

import Calendar from '../../../src/components/Calendar.js';
import { useApp } from '../../../src/context/AppContext.js';

describe('Calendar — touch device default', () => {
  it('opens in agenda view on a narrow touch screen', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [] }));

    renderWithProviders(<Calendar />);

    // Agenda view offers the way back to grid, and labels itself with the bare year.
    expect(screen.getByTitle('Switch to grid view')).toBeInTheDocument();
    expect(screen.getByText(String(new Date().getFullYear()))).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('stays in grid view on a touch device with a wide screen', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    (useApp as Mock).mockReturnValue(makeCtx({ allRows: [] }));

    renderWithProviders(<Calendar />);
    expect(screen.getByTitle('Switch to list view')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
