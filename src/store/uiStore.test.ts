import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState({
      hoveredObject: null,
      activeOverlay: 'none',
    });
  });

  it('initialises with null hovered and no overlay', () => {
    const state = useUIStore.getState();
    expect(state.hoveredObject).toBeNull();
    expect(state.activeOverlay).toBe('none');
  });

  it('setHoveredObject sets and clears hover', () => {
    useUIStore.getState().setHoveredObject('guitar');
    expect(useUIStore.getState().hoveredObject).toBe('guitar');

    useUIStore.getState().setHoveredObject(null);
    expect(useUIStore.getState().hoveredObject).toBeNull();
  });

  it('setActiveOverlay switches overlays', () => {
    useUIStore.getState().setActiveOverlay('laptop');
    expect(useUIStore.getState().activeOverlay).toBe('laptop');

    useUIStore.getState().setActiveOverlay('guitar');
    expect(useUIStore.getState().activeOverlay).toBe('guitar');

    useUIStore.getState().setActiveOverlay('none');
    expect(useUIStore.getState().activeOverlay).toBe('none');
  });
});
