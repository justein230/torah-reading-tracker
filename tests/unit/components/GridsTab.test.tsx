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

  it.each([
    ['Holidays',          'Holiday grid'],
    ['Weekday',           'Weekday grid'],
    ['Double Parshiyot',  'Double parsha grid'],
  ])('switches to the %s grid when that tab is clicked', (tab, grid) => {
    renderWithProviders(<GridsTab />);
    fireEvent.click(screen.getByText(tab));
    expect(screen.getByText(grid)).toBeInTheDocument();
    expect(screen.queryByText('Portions grid')).not.toBeInTheDocument();
  });
});
