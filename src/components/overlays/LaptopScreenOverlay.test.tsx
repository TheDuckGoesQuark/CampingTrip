import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import LaptopScreenOverlay from './LaptopScreenOverlay';
import { useSceneStore } from '../../store/sceneStore';

describe('LaptopScreenOverlay', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSceneStore.setState({ laptopFocused: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when laptop is not focused', () => {
    const { container } = render(<LaptopScreenOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('mounts when laptop becomes focused', () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<LaptopScreenOverlay />);

    // Mounted but opacity starts at 0
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });

  it('fades in after 650ms delay', () => {
    useSceneStore.setState({ laptopFocused: true });
    const { container } = render(<LaptopScreenOverlay />);

    const overlay = container.firstChild as HTMLElement;
    expect(overlay.style.opacity).toBe('0');

    act(() => {
      vi.advanceTimersByTime(650);
    });

    expect(overlay.style.opacity).toBe('1');
  });

  it('shows back button', () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<LaptopScreenOverlay />);

    const backBtn = screen.getByRole('button');
    expect(backBtn).toBeInTheDocument();
    expect(backBtn.textContent).toContain('Back to tent');
  });

  it('shows Esc hint', () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<LaptopScreenOverlay />);

    expect(screen.getByText('Esc')).toBeInTheDocument();
  });
});
