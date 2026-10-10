import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { useElementWidth } from '../../../src/hooks/useElementWidth.js';

function Probe() {
  const { ref, width } = useElementWidth();
  return <div ref={ref} data-testid="probe">{width}</div>;
}

describe('useElementWidth', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reports the measured width on the first render, before any resize event', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 504 } as DOMRect);
    render(<Probe />);
    expect(screen.getByTestId('probe').textContent).toBe('504');
  });

  it('starts at 0 when the element has no layout', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 0 } as DOMRect);
    render(<Probe />);
    expect(screen.getByTestId('probe').textContent).toBe('0');
  });
});
