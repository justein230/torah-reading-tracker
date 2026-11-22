import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CollapsibleRow } from '../../../src/components/shared/CollapsibleRow.js';

describe('CollapsibleRow', () => {
  it('renders summary content inside a button', () => {
    render(<CollapsibleRow summary="Section Header"><p>detail</p></CollapsibleRow>);
    expect(screen.getByRole('button', { name: /Section Header/ })).toBeInTheDocument();
  });

  it('starts closed with children not yet mounted', () => {
    const { container } = render(
      <CollapsibleRow summary="Header"><p>detail</p></CollapsibleRow>
    );
    expect(screen.queryByText('detail')).not.toBeInTheDocument();
    expect(container.querySelector('.collapsible-row')).not.toHaveClass('open');
  });

  it('mounts children on first open and keeps them mounted after closing', async () => {
    render(<CollapsibleRow summary="Header"><p>detail</p></CollapsibleRow>);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('detail')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByText('detail')).toBeInTheDocument();
  });

  it('clicking summary adds open class', async () => {
    const { container } = render(
      <CollapsibleRow summary="Header"><p>detail</p></CollapsibleRow>
    );
    await userEvent.click(screen.getByRole('button'));
    expect(container.querySelector('.collapsible-row')).toHaveClass('open');
  });

  it('clicking again removes open class', async () => {
    const { container } = render(
      <CollapsibleRow summary="Header"><p>detail</p></CollapsibleRow>
    );
    await userEvent.click(screen.getByRole('button'));
    await userEvent.click(screen.getByRole('button'));
    expect(container.querySelector('.collapsible-row')).not.toHaveClass('open');
  });

  it('accentColor sets borderLeftColor on the summary button', () => {
    render(<CollapsibleRow summary="Header" accentColor="#e74c3c"><p>c</p></CollapsibleRow>);
    expect(screen.getByRole('button')).toHaveStyle({ borderLeftColor: '#e74c3c' });
  });

  it('no accentColor means no inline borderLeftColor', () => {
    render(<CollapsibleRow summary="Header"><p>c</p></CollapsibleRow>);
    expect((screen.getByRole('button') as HTMLElement).style.borderLeftColor).toBe('');
  });

  it('summary accepts a ReactNode', () => {
    render(
      <CollapsibleRow summary={<strong>Bold Header</strong>}><p>c</p></CollapsibleRow>
    );
    expect(screen.getByText('Bold Header')).toBeInTheDocument();
  });
});
