import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';

vi.mock('../../../src/components/Grid.js', () => ({ default: () => <div>Portions grid</div> }));
vi.mock('../../../src/components/DoubleParshaGrid.js', () => ({ default: () => <div>Double parsha grid</div> }));
vi.mock('../../../src/components/HolidayGrid.js', () => ({ default: () => <div>Holiday grid</div> }));
vi.mock('../../../src/components/WeekdayGrid.js', () => ({ default: () => <div>Weekday grid</div> }));

import GridsTab from '../../../src/components/GridsTab.js';

describe('GridsTab', () => {
  it('shows the portions grid by default', () => {
    renderWithProviders(<GridsTab />);
    expect(screen.getByText('Portions grid')).toBeInTheDocument();
    expect(screen.queryByText('Double parsha grid')).not.toBeInTheDocument();
  });

  it('switches to the holidays grid when that tab is clicked', () => {
    renderWithProviders(<GridsTab />);
    fireEvent.click(screen.getByText('Holidays'));
    expect(screen.getByText('Holiday grid')).toBeInTheDocument();
    expect(screen.queryByText('Portions grid')).not.toBeInTheDocument();
  });

  it('switches to the weekday grid when that tab is clicked', () => {
    renderWithProviders(<GridsTab />);
    fireEvent.click(screen.getByText('Weekday'));
    expect(screen.getByText('Weekday grid')).toBeInTheDocument();
  });

  it('switches to the double parshiyot grid when that tab is clicked', () => {
    renderWithProviders(<GridsTab />);
    fireEvent.click(screen.getByText('Double Parshiyot'));
    expect(screen.getByText('Double parsha grid')).toBeInTheDocument();
  });
});
