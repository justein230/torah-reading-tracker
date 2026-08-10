import React from 'react';
import { render } from '@testing-library/react';
import { SeferDot } from '../../../src/components/shared/SeferDot.js';

describe('SeferDot', () => {
  it('renders a span with sefer-dot class', () => {
    const { container } = render(<SeferDot color="#f00" />);
    expect(container.querySelector('.sefer-dot')).toBeInTheDocument();
  });

  it('filled mode applies background color as inline style', () => {
    const { container } = render(<SeferDot color="#f00" />);
    const dot = container.querySelector('.sefer-dot') as HTMLElement;
    expect(dot.style.background).toBe('rgb(255, 0, 0)');
  });

  it('reread mode adds sefer-dot--reread class', () => {
    const { container } = render(<SeferDot color="#f00" reread />);
    expect(container.querySelector('.sefer-dot--reread')).toBeInTheDocument();
  });

  it('reread mode applies borderColor style instead of background', () => {
    const { container } = render(<SeferDot color="#f00" reread />);
    const dot = container.querySelector('.sefer-dot') as HTMLElement;
    expect(dot.style.borderColor).toBe('rgb(255, 0, 0)');
    expect(dot.style.background).toBe('');
  });

  it('reread defaults to false — no --reread class', () => {
    const { container } = render(<SeferDot color="#f00" />);
    expect(container.querySelector('.sefer-dot--reread')).not.toBeInTheDocument();
  });
});
