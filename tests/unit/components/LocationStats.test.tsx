import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import type { LocationStat } from '../../../src/types/index.js';

const fetchLocationStats = vi.fn();
vi.mock('../../../src/api.js', () => ({ fetchLocationStats: () => fetchLocationStats() }));

import { LocationStats } from '../../../src/components/LocationStats.js';

describe('LocationStats', () => {
  it('renders nothing before the fetch resolves', () => {
    fetchLocationStats.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<LocationStats />);
    expect(screen.queryByText('Readings by Location')).not.toBeInTheDocument();
  });

  it('shows a placeholder when there are no rows', async () => {
    fetchLocationStats.mockResolvedValue([]);
    renderWithProviders(<LocationStats />);
    await screen.findByText('No readings yet.');
  });

  it('renders each location with a muted "(no location)" fallback and plain count', async () => {
    const rows: LocationStat[] = [
      { location: '', count: 3, past_count: 3, upcoming_count: 0 },
      { location: 'Shul', count: 5, past_count: 4, upcoming_count: 1 },
    ];
    fetchLocationStats.mockResolvedValue(rows);
    renderWithProviders(<LocationStats />);

    await screen.findByText('(no location)');
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Shul')).toBeInTheDocument();
    expect(screen.getByText('4 (5↑)')).toBeInTheDocument();
  });
});
