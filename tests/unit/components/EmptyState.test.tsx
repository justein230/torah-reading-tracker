import React from 'react';
import { screen } from '@testing-library/react';
import { EmptyState } from '../../../src/components/shared/EmptyState.js';
import { renderWithProviders } from '../../helpers/renderWithProviders.js';

describe('EmptyState', () => {
  it('renders message text', () => {
    renderWithProviders(<EmptyState message="No readings found." />);
    expect(screen.getByText('No readings found.')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    renderWithProviders(<EmptyState icon="📚" message="Empty" />);
    expect(screen.getByText('📚')).toBeInTheDocument();
  });

  it('does not render icon element when prop omitted', () => {
    renderWithProviders(<EmptyState message="Empty" />);
    expect(screen.queryByText('📚')).not.toBeInTheDocument();
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('renders any string as message', () => {
    const long = 'You have not logged any Torah readings yet. Start by adding one!';
    renderWithProviders(<EmptyState message={long} />);
    expect(screen.getByText(long)).toBeInTheDocument();
  });
});
