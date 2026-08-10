import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReadingStatusBadges } from '../../../src/components/shared/ReadingStatusBadges.js';

describe('ReadingStatusBadges', () => {
  it('renders nothing when no props passed', () => {
    const { container } = render(<ReadingStatusBadges />);
    expect(container.firstChild).toBeNull();
  });

  it('isReread shows full re-read label', () => {
    render(<ReadingStatusBadges isReread />);
    expect(screen.getByText('↺ re-read')).toBeInTheDocument();
  });

  it('compact mode shortens reread label to ↺ only', () => {
    render(<ReadingStatusBadges isReread compact />);
    expect(screen.getByText('↺')).toBeInTheDocument();
    expect(screen.queryByText('↺ re-read')).not.toBeInTheDocument();
  });

  it('isFuture shows upcoming badge', () => {
    render(<ReadingStatusBadges isFuture />);
    expect(screen.getByText('↑ upcoming')).toBeInTheDocument();
  });

  it('both flags render both badges', () => {
    render(<ReadingStatusBadges isReread isFuture />);
    expect(screen.getByText('↺ re-read')).toBeInTheDocument();
    expect(screen.getByText('↑ upcoming')).toBeInTheDocument();
  });

  it('compact does not affect future badge label', () => {
    render(<ReadingStatusBadges isFuture compact />);
    expect(screen.getByText('↑ upcoming')).toBeInTheDocument();
  });
});
