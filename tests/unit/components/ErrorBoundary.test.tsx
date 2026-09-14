import { screen, fireEvent, render } from '@testing-library/react';
import { ErrorBoundary } from '../../../src/components/ErrorBoundary.js';

function Bomb(): never {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(<ErrorBoundary><div>All good</div></ErrorBoundary>);
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('renders a fallback with the error message when a child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Bomb /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/boom/)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('clears the error and re-renders children after "Try again"', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    function Maybe() {
      if (shouldThrow) throw new Error('boom');
      return <div>Recovered</div>;
    }
    const { rerender } = render(<ErrorBoundary><Maybe /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByText('Try again'));
    rerender(<ErrorBoundary><Maybe /></ErrorBoundary>);
    expect(screen.getByText('Recovered')).toBeInTheDocument();
    spy.mockRestore();
  });
});
