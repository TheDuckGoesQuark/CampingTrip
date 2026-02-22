import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import LaptopScreenOverlay from './LaptopScreenOverlay';
import { useSceneStore } from '../../store/sceneStore';

// Mock the sound effects to avoid AudioContext issues
vi.mock('../../audio/soundEffects', () => ({
  playWindowOpen: vi.fn(),
  playSoftClick: vi.fn(),
  playLaptopOn: vi.fn(),
  playLaptopOff: vi.fn(),
  playMidiNote: vi.fn(),
  playGuitarStrum: vi.fn(),
  playCatMeow: vi.fn(),
}));

describe('LaptopScreenOverlay (CatOS)', () => {
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

  it('mounts CatOS desktop when laptop becomes focused', () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<LaptopScreenOverlay />);

    expect(screen.getByText('CatOS')).toBeInTheDocument();
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

  it('shows menu bar with CatOS branding', () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<LaptopScreenOverlay />);

    expect(screen.getByText('CatOS')).toBeInTheDocument();
    expect(screen.getByText('Finder', { exact: true })).toBeInTheDocument();
  });

  it('shows back to tent button', () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<LaptopScreenOverlay />);

    expect(screen.getByText(/Back to tent/)).toBeInTheDocument();
  });

  it('shows Esc hint on back button', () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<LaptopScreenOverlay />);

    expect(screen.getByText('Esc')).toBeInTheDocument();
  });

  it('renders project desktop icons', () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<LaptopScreenOverlay />);

    // Projects from data/projects.ts
    expect(screen.getByText('Camping Trip')).toBeInTheDocument();
  });

  it('renders dock with standard icons', () => {
    useSceneStore.setState({ laptopFocused: true });
    render(<LaptopScreenOverlay />);

    expect(screen.getByTitle('Finder')).toBeInTheDocument();
    expect(screen.getByTitle('Terminal')).toBeInTheDocument();
    expect(screen.getByTitle('Notes')).toBeInTheDocument();
    expect(screen.getByTitle('Trash')).toBeInTheDocument();
  });
});
