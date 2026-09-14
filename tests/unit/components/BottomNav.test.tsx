import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { TABS, TAB_LABELS } from '../../../src/constants.js';
import BottomNav from '../../../src/components/BottomNav.js';

describe('BottomNav', () => {
  it('renders a button for every tab with its label', () => {
    renderWithProviders(<BottomNav activeTab="overview" onChange={vi.fn()} />);
    for (const t of TABS) {
      expect(screen.getByText(TAB_LABELS[t] ?? t)).toBeInTheDocument();
    }
  });

  it('marks only the active tab as current', () => {
    renderWithProviders(<BottomNav activeTab="grid" onChange={vi.fn()} />);
    const active = screen.getByText(TAB_LABELS.grid ?? 'grid').closest('button')!;
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active).toHaveAttribute('data-active', 'true');

    const inactive = screen.getByText(TAB_LABELS.overview ?? 'overview').closest('button')!;
    expect(inactive).not.toHaveAttribute('aria-current');
    expect(inactive).toHaveAttribute('data-active', 'false');
  });

  it('calls onChange with the clicked tab', () => {
    const onChange = vi.fn();
    renderWithProviders(<BottomNav activeTab="overview" onChange={onChange} />);
    fireEvent.click(screen.getByText(TAB_LABELS.calendar ?? 'calendar').closest('button')!);
    expect(onChange).toHaveBeenCalledWith('calendar');
  });
});
