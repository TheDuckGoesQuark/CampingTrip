import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch } from '../store/hooks';
import { replayOfflineQueue, getOfflineQueueCount } from '../store/offlineMiddleware';

export function useOfflineSync() {
  const dispatch = useAppDispatch();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const refreshCount = useCallback(async () => {
    const count = await getOfflineQueueCount();
    setPendingCount(count);
  }, []);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await replayOfflineQueue(dispatch);
      await refreshCount();
    } finally {
      setIsSyncing(false);
    }
  }, [dispatch, refreshCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check queue on mount
    refreshCount();

    // Try to sync on mount if online and there are pending mutations
    if (navigator.onLine) {
      sync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sync, refreshCount]);

  return { isOnline, pendingCount, isSyncing, sync };
}
