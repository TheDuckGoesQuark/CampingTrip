import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsMenu from './SettingsMenu';
import { useSessionStore } from '../../store/sessionStore';

describe('SettingsMenu', () => {
  beforeEach(() => {
    useSessionStore.setState({
      soundEnabled: true,
      effectsEnabled: true,
      hasCompletedWelcome: false,
    });
  });

  it('renders the settings gear button', () => {
    render(<SettingsMenu />);
    const button = screen.getByLabelText('Settings');
    expect(button).toBeInTheDocument();
  });

  it('gear button has aria-expanded=false initially', () => {
    render(<SettingsMenu />);
    const button = screen.getByLabelText('Settings');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens panel on click', () => {
    render(<SettingsMenu />);
    const button = screen.getByLabelText('Settings');

    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Sound', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Effects', { exact: false })).toBeInTheDocument();
  });

  it('closes panel on second click', () => {
    render(<SettingsMenu />);
    const button = screen.getByLabelText('Settings');

    fireEvent.click(button); // open
    fireEvent.click(button); // close

    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles sound via switch', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByLabelText('Settings')); // open

    const soundSwitch = screen.getAllByRole('switch')[0];
    expect(soundSwitch).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(soundSwitch);
    expect(useSessionStore.getState().soundEnabled).toBe(false);
  });

  it('toggles effects via switch', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByLabelText('Settings')); // open

    const effectsSwitch = screen.getAllByRole('switch')[1];
    expect(effectsSwitch).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(effectsSwitch);
    expect(useSessionStore.getState().effectsEnabled).toBe(false);
  });

  it('reset button resets welcome state', () => {
    useSessionStore.setState({ hasCompletedWelcome: true });

    render(<SettingsMenu />);
    fireEvent.click(screen.getByLabelText('Settings')); // open

    const resetBtn = screen.getByText('Reset preferences');
    fireEvent.click(resetBtn);

    expect(useSessionStore.getState().hasCompletedWelcome).toBe(false);
  });

  it('switch responds to Enter key', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByLabelText('Settings'));

    const soundSwitch = screen.getAllByRole('switch')[0];
    fireEvent.keyDown(soundSwitch, { key: 'Enter' });
    expect(useSessionStore.getState().soundEnabled).toBe(false);
  });

  it('switch responds to Space key', () => {
    render(<SettingsMenu />);
    fireEvent.click(screen.getByLabelText('Settings'));

    const effectsSwitch = screen.getAllByRole('switch')[1];
    fireEvent.keyDown(effectsSwitch, { key: ' ' });
    expect(useSessionStore.getState().effectsEnabled).toBe(false);
  });
});
