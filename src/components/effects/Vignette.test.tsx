import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Vignette from './Vignette';

describe('Vignette', () => {
  it('renders a fixed overlay', () => {
    const { container } = render(<Vignette />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.position).toBe('fixed');
  });

  it('has pointer-events: none (click-through)', () => {
    const { container } = render(<Vignette />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.pointerEvents).toBe('none');
  });

  it('applies radial gradient background', () => {
    const { container } = render(<Vignette />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.background).toContain('radial-gradient');
  });

  it('has zIndex for layering above canvas', () => {
    const { container } = render(<Vignette />);
    const div = container.firstChild as HTMLElement;
    expect(parseInt(div.style.zIndex)).toBeGreaterThan(0);
  });
});
