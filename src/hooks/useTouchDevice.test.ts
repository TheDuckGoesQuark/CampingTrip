import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTouchDevice } from './useTouchDevice';

describe('useTouchDevice', () => {
  it('returns false for non-touch devices', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: '(pointer: coarse)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useTouchDevice());
    expect(result.current).toBe(false);
  });

  it('returns true for touch devices', () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: '(pointer: coarse)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const { result } = renderHook(() => useTouchDevice());
    expect(result.current).toBe(true);
  });
});
