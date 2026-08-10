import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleButtons } from '../../../src/components/shared/ToggleButtons.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('ToggleButtons', () => {
  it('renders a button for each option', () => {
    renderWithProviders(<ToggleButtons value="a" onChange={() => {}} options={OPTIONS} />);
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeInTheDocument();
  });

  it('active option has data-active attribute; inactive ones do not', () => {
    renderWithProviders(<ToggleButtons value="b" onChange={() => {}} options={OPTIONS} />);
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('data-active');
    expect(screen.getByRole('button', { name: 'Alpha' })).not.toHaveAttribute('data-active');
    expect(screen.getByRole('button', { name: 'Gamma' })).not.toHaveAttribute('data-active');
  });

  it('clicking an option calls onChange with its value', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ToggleButtons value="a" onChange={onChange} options={OPTIONS} />);
    await userEvent.click(screen.getByRole('button', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('supports null-valued option', async () => {
    const onChange = vi.fn();
    const opts = [{ value: null, label: 'All' }, ...OPTIONS];
    renderWithProviders(<ToggleButtons value={null} onChange={onChange} options={opts} />);
    await userEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('clicking already-active option still fires onChange', async () => {
    const onChange = vi.fn();
    renderWithProviders(<ToggleButtons value="a" onChange={onChange} options={OPTIONS} />);
    await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onChange).toHaveBeenCalledOnce();
  });
});
