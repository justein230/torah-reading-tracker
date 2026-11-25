import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { DateField } from '../../../src/components/shared/DateField.js';

describe('DateField — desktop', () => {
  it('keeps the keyboard so a date can be typed', () => {
    renderWithProviders(<DateField placeholder="Pick a date" />);
    expect(screen.getByPlaceholderText('Pick a date')).not.toHaveAttribute('inputmode');
  });

  it('passes props through to the DateInput', () => {
    renderWithProviders(<DateField placeholder="Pick a date" value="2026-11-25" valueFormat="YYYY-MM-DD" onChange={() => {}} />);
    expect(screen.getByPlaceholderText('Pick a date')).toHaveValue('2026-11-25');
  });
});
