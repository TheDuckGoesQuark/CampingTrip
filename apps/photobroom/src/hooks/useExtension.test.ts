import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExtension } from './useExtension';

// ---------------------------------------------------------------------------
// Mock chrome.runtime.sendMessage at the global level
// ---------------------------------------------------------------------------

type MessageCallback = (response: unknown) => void;

let mockSendMessage: ReturnType<typeof vi.fn>;
let mockLastError: { message: string } | undefined;

beforeEach(() => {
  mockLastError = undefined;
  mockSendMessage = vi.fn();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).chrome = {
    runtime: {
      sendMessage: mockSendMessage,
      get lastError() {
        return mockLastError;
      },
    },
  };
});

afterEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).chrome;
  vi.restoreAllMocks();
});

/** Helper: make mockSendMessage invoke its callback with `response`. */
function respondWith(response: unknown) {
  mockSendMessage.mockImplementation(
    (_extId: string, _msg: unknown, cb: MessageCallback) => {
      cb(response);
    }
  );
}

/** Helper: make mockSendMessage simulate chrome.runtime.lastError. */
function respondWithError(message: string) {
  mockSendMessage.mockImplementation(
    (_extId: string, _msg: unknown, cb: MessageCallback) => {
      mockLastError = { message };
      cb(undefined);
      mockLastError = undefined;
    }
  );
}

describe('useExtension', () => {
  describe('status detection', () => {
    it('reports "connected" when ping succeeds', async () => {
      respondWith({ ok: true, version: '0.1.0' });

      const { result } = renderHook(() => useExtension());

      // Initial state should be 'checking'
      expect(result.current.status).toBe('checking');

      await waitFor(() => {
        expect(result.current.status).toBe('connected');
      });

      // Verify the ping message format
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.any(String), // extension ID
        { action: 'ping' },
        expect.any(Function)
      );
    });

    it('reports "not-found" when ping returns null (extension not installed)', async () => {
      respondWith(null);

      const { result } = renderHook(() => useExtension());

      await waitFor(() => {
        expect(result.current.status).toBe('not-found');
      });
    });

    it('reports "not-found" when chrome.runtime.lastError is set', async () => {
      respondWithError('Could not establish connection');

      const { result } = renderHook(() => useExtension());

      await waitFor(() => {
        expect(result.current.status).toBe('not-found');
      });
    });

    it('reports "not-found" when chrome is not defined', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).chrome;

      const { result } = renderHook(() => useExtension());

      await waitFor(() => {
        expect(result.current.status).toBe('not-found');
      });
    });
  });

  describe('fetchPhotos', () => {
    it('sends correctly shaped message and returns photos', async () => {
      // Ping succeeds first
      respondWith({ ok: true, version: '0.1.0' });
      const { result } = renderHook(() => useExtension());
      await waitFor(() => expect(result.current.status).toBe('connected'));

      // Now set up fetchPhotos response
      const mockPhotos = [
        { id: 'abc123', thumbnailUrl: 'https://lh3.googleusercontent.com/abc', ariaLabel: 'Photo - Mar 27, 2024' },
        { id: 'def456', thumbnailUrl: 'https://lh3.googleusercontent.com/def', ariaLabel: 'Photo - Mar 27, 2023' },
      ];
      respondWith({ photos: mockPhotos });

      let photos: unknown;
      await act(async () => {
        photos = await result.current.fetchPhotos('March 27');
      });

      // Verify the fetchPhotos message contract
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.any(String),
        { action: 'fetchPhotos', date: 'March 27' },
        expect.any(Function)
      );
      expect(photos).toEqual(mockPhotos);
    });

    it('throws when extension returns an error', async () => {
      respondWith({ ok: true, version: '0.1.0' });
      const { result } = renderHook(() => useExtension());
      await waitFor(() => expect(result.current.status).toBe('connected'));

      respondWith({ error: 'Tab not found' });

      await expect(
        act(() => result.current.fetchPhotos('March 27'))
      ).rejects.toThrow('Tab not found');
    });

    it('throws when extension is unreachable', async () => {
      respondWith({ ok: true, version: '0.1.0' });
      const { result } = renderHook(() => useExtension());
      await waitFor(() => expect(result.current.status).toBe('connected'));

      respondWithError('Extension context invalidated');

      await expect(
        act(() => result.current.fetchPhotos('March 27'))
      ).rejects.toThrow('Extension unreachable');
    });
  });

  describe('deletePhotos', () => {
    it('sends correctly shaped message and returns results', async () => {
      respondWith({ ok: true, version: '0.1.0' });
      const { result } = renderHook(() => useExtension());
      await waitFor(() => expect(result.current.status).toBe('connected'));

      const mockResponse = {
        deleted: true,
        results: [
          { id: 'abc123', success: true },
          { id: 'def456', success: false, error: 'Button not found' },
        ],
      };
      respondWith(mockResponse);

      let response: unknown;
      await act(async () => {
        response = await result.current.deletePhotos(['abc123', 'def456']);
      });

      // Verify the deletePhotos message contract
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.any(String),
        { action: 'deletePhotos', ids: ['abc123', 'def456'] },
        expect.any(Function)
      );
      expect(response).toEqual(mockResponse);
    });

    it('throws when extension returns an error', async () => {
      respondWith({ ok: true, version: '0.1.0' });
      const { result } = renderHook(() => useExtension());
      await waitFor(() => expect(result.current.status).toBe('connected'));

      respondWith({ error: 'No Google Photos tab found' });

      await expect(
        act(() => result.current.deletePhotos(['abc123']))
      ).rejects.toThrow('No Google Photos tab found');
    });
  });
});
