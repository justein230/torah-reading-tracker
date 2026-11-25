import { screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';

// isTouch is a module-level constant evaluated on import, so the touch case needs a file-scoped
// mock — DateField.test.tsx keeps the real (desktop) value.
vi.mock('../../../src/components/AliyahTooltip.js', () => ({ isTouch: true }));

import { DateField } from '../../../src/components/shared/DateField.js';

describe('DateField — touch device', () => {
  it('suppresses the on-screen keyboard so the calendar is not pushed off screen', () => {
    renderWithProviders(<DateField placeholder="Pick a date" />);
    expect(screen.getByPlaceholderText('Pick a date')).toHaveAttribute('inputmode', 'none');
  });

  it('still opens the calendar on tap', async () => {
    renderWithProviders(<DateField placeholder="Pick a date" defaultDate="2026-11-01" />);
    screen.getByPlaceholderText('Pick a date').click();
    expect(await screen.findByText('November 2026')).toBeInTheDocument();
  });
});
