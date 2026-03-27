import { useCallback, useEffect, useState } from 'react';
import type {
  DeletePhotosResponse,
  FetchPhotosResponse,
  PingResponse,
  ScrapedPhoto,
} from '../types';

/**
 * Extension ID — set this to your unpacked extension's ID from chrome://extensions.
 * For development, you can also pass it as a Vite env var.
 */
const EXTENSION_ID =
  import.meta.env.VITE_EXTENSION_ID || 'YOUR_EXTENSION_ID_HERE';

/**
 * Send a message to the PhotoBroom Chrome extension via externally_connectable.
 * Returns null if the extension is not installed or unreachable.
 */
function sendToExtension<T>(message: Record<string, unknown>): Promise<T | null> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve(null);
      return;
    }
    try {
      chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
          return;
        }
        resolve(response as T);
      });
    } catch {
      resolve(null);
    }
  });
}

export type ExtensionStatus = 'checking' | 'connected' | 'not-found';

/**
 * Hook to communicate with the PhotoBroom Chrome extension.
 *
 * Provides:
 * - Extension connection status (auto-detected on mount)
 * - fetchPhotos(date) — scrape Google Photos for a date string
 * - deletePhotos(ids) — delete photos by ID via simulated clicks
 */
export function useExtension() {
  const [status, setStatus] = useState<ExtensionStatus>('checking');

  // Ping the extension on mount to check if it's installed
  useEffect(() => {
    let cancelled = false;
    sendToExtension<PingResponse>({ action: 'ping' }).then((response) => {
      if (cancelled) return;
      setStatus(response?.ok ? 'connected' : 'not-found');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPhotos = useCallback(
    async (date: string): Promise<ScrapedPhoto[]> => {
      const response = await sendToExtension<FetchPhotosResponse>({
        action: 'fetchPhotos',
        date,
      });
      if (!response || response.error) {
        throw new Error(response?.error || 'Extension unreachable');
      }
      return response.photos || [];
    },
    []
  );

  const deletePhotos = useCallback(
    async (ids: string[]): Promise<DeletePhotosResponse> => {
      const response = await sendToExtension<DeletePhotosResponse>({
        action: 'deletePhotos',
        ids,
      });
      if (!response || response.error) {
        throw new Error(response?.error || 'Extension unreachable');
      }
      return response;
    },
    []
  );

  return { status, fetchPhotos, deletePhotos };
}
