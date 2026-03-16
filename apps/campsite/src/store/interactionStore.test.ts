import { describe, it, expect, beforeEach } from 'vitest';
import { useInteractionStore } from './interactionStore';

describe('useInteractionStore', () => {
  beforeEach(() => {
    useInteractionStore.setState({
      hoveredId: null,
      focusedId: null,
    });
  });

  it('initialises with null values', () => {
    const state = useInteractionStore.getState();
    expect(state.hoveredId).toBeNull();
    expect(state.focusedId).toBeNull();
  });

  it('setHovered sets and clears hover', () => {
    useInteractionStore.getState().setHovered('laptop');
    expect(useInteractionStore.getState().hoveredId).toBe('laptop');

    useInteractionStore.getState().setHovered(null);
    expect(useInteractionStore.getState().hoveredId).toBeNull();
  });

  it('setFocused sets and clears focus', () => {
    useInteractionStore.getState().setFocused('guitar');
    expect(useInteractionStore.getState().focusedId).toBe('guitar');

    useInteractionStore.getState().setFocused(null);
    expect(useInteractionStore.getState().focusedId).toBeNull();
  });

  it('hover and focus are independent', () => {
    useInteractionStore.getState().setHovered('laptop');
    useInteractionStore.getState().setFocused('guitar');

    const state = useInteractionStore.getState();
    expect(state.hoveredId).toBe('laptop');
    expect(state.focusedId).toBe('guitar');
  });
});
