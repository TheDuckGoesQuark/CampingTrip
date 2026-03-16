import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InteractionOverlay from './InteractionOverlay';
import { useInteractionStore } from '../../store/interactionStore';

describe('InteractionOverlay', () => {
  beforeEach(() => {
    useInteractionStore.setState({ hoveredId: null, focusedId: null });
  });

  it('renders a toolbar with accessible label', () => {
    render(<InteractionOverlay />);
    const toolbar = screen.getByRole('toolbar');
    expect(toolbar).toBeInTheDocument();
    expect(toolbar).toHaveAttribute(
      'aria-label',
      'Interactive objects in tent scene',
    );
  });

  it('renders buttons for all interactive objects', () => {
    render(<InteractionOverlay />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(9);
  });

  it('renders buttons with correct aria-labels', () => {
    render(<InteractionOverlay />);
    expect(screen.getByLabelText('Guitar')).toBeInTheDocument();
    expect(screen.getByLabelText(/Laptop/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Projects/)).toBeInTheDocument();
    expect(screen.getByLabelText('Moka Pot')).toBeInTheDocument();
    expect(screen.getByLabelText(/Scarlett/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Shure/)).toBeInTheDocument();
    expect(screen.getByLabelText('MIDI controller')).toBeInTheDocument();
    expect(screen.getByLabelText('Notepad')).toBeInTheDocument();
    expect(screen.getByLabelText('Cat walking outside')).toBeInTheDocument();
  });

  it('sets focused ID on focus', () => {
    render(<InteractionOverlay />);
    const guitarBtn = screen.getByLabelText('Guitar');

    fireEvent.focus(guitarBtn);
    expect(useInteractionStore.getState().focusedId).toBe('guitar');
  });

  it('clears focused ID on blur', () => {
    render(<InteractionOverlay />);
    const guitarBtn = screen.getByLabelText('Guitar');

    fireEvent.focus(guitarBtn);
    expect(useInteractionStore.getState().focusedId).toBe('guitar');

    fireEvent.blur(guitarBtn);
    expect(useInteractionStore.getState().focusedId).toBeNull();
  });

  it('dispatches scene-activate on Enter key', () => {
    render(<InteractionOverlay />);
    const handler = vi.fn();
    window.addEventListener('scene-activate', handler);

    const guitarBtn = screen.getByLabelText('Guitar');
    fireEvent.keyDown(guitarBtn, { key: 'Enter' });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ id: 'guitar' });

    window.removeEventListener('scene-activate', handler);
  });

  it('dispatches scene-activate on Space key', () => {
    render(<InteractionOverlay />);
    const handler = vi.fn();
    window.addEventListener('scene-activate', handler);

    const midiBtn = screen.getByLabelText('MIDI controller');
    fireEvent.keyDown(midiBtn, { key: ' ' });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail).toEqual({ id: 'midi' });

    window.removeEventListener('scene-activate', handler);
  });

  it('all buttons are tabbable (tabIndex=0)', () => {
    render(<InteractionOverlay />);
    const buttons = screen.getAllByRole('button');
    for (const btn of buttons) {
      expect(btn).toHaveAttribute('tabindex', '0');
    }
  });
});
