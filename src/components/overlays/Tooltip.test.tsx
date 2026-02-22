import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Tooltip from './Tooltip';

describe('Tooltip', () => {
  it('renders the provided text', () => {
    render(<Tooltip text="Guitar" />);
    expect(screen.getByText('Guitar')).toBeInTheDocument();
  });

  it('has pointer-events: none (click-through)', () => {
    const { container } = render(<Tooltip text="Test" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.pointerEvents).toBe('none');
  });

  it('prevents text selection', () => {
    const { container } = render(<Tooltip text="Test" />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.userSelect).toBe('none');
  });
});
