import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';
import { makeCtx } from '../../helpers/appContextMock.js';

vi.mock('../../../src/context/AppContext.js', () => ({ useApp: vi.fn() }));
import { useApp } from '../../../src/context/AppContext.js';

vi.mock('../../../src/components/Hero.js', () => ({ Hero: () => <div>Hero</div> }));
vi.mock('../../../src/components/SeferCards.js', () => ({ SeferCards: () => <div>SeferCards</div> }));
vi.mock('../../../src/components/ProgressLineChart.js', () => ({ ProgressLineChart: () => <div>ProgressLineChart</div> }));
vi.mock('../../../src/components/YearChart.js', () => ({ YearChart: () => <div>YearChart</div> }));
vi.mock('../../../src/components/LocationStats.js', () => ({ LocationStats: () => <div>LocationStats</div> }));
vi.mock('../../../src/components/Forecast.js', () => ({ default: () => <div>Forecast</div> }));
vi.mock('../../../src/components/AsOfDate.js', () => ({ default: () => <div>AsOfDate</div> }));

import Overview from '../../../src/components/Overview.js';

const mockUseApp = useApp as unknown as ReturnType<typeof vi.fn>;

describe('Overview', () => {
  it('renders nothing when stats are not yet loaded', () => {
    mockUseApp.mockReturnValue(makeCtx({ stats: null }));
    renderWithProviders(<Overview />);
    expect(screen.queryByText('Hero')).not.toBeInTheDocument();
  });

  it('renders all summary sections once stats are loaded', () => {
    mockUseApp.mockReturnValue(makeCtx({ stats: {} as never }));
    renderWithProviders(<Overview />);
    for (const label of ['Hero', 'SeferCards', 'ProgressLineChart', 'YearChart', 'LocationStats', 'Forecast', 'AsOfDate']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole('link', { name: 'Hebcal.com' })).toHaveAttribute('href', 'https://www.hebcal.com');
  });
});
