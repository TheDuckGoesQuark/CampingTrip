import type { Middleware } from '@reduxjs/toolkit';
import { isRejected } from '@reduxjs/toolkit';
import { set, get, del, createStore } from 'idb-keyval';
import { baseApi } from '../api/base-api';

interface QueuedMutation {
  id: string;
  endpointName: string;
  args: unknown;
  timestamp: number;
}

const QUEUE_KEY = 'offline-mutation-queue';
const queueStore = createStore('workout-offline', 'queue');

async function getQueue(): Promise<QueuedMutation[]> {
  return (await get<QueuedMutation[]>(QUEUE_KEY, queueStore)) ?? [];
}

async function saveQueue(queue: QueuedMutation[]): Promise<void> {
  if (queue.length === 0) {
    await del(QUEUE_KEY, queueStore);
  } else {
    await set(QUEUE_KEY, queue, queueStore);
  }
}

/**
 * Middleware that catches failed mutations (network errors) and queues them
 * in IndexedDB for replay when the connection is restored.
 *
 * Combined with redux-persist (which persists the RTKQ cache including
 * optimistic updates), this enables full offline-first behavior:
 * 1. Mutation fires → optimistic update patches the cache immediately
 * 2. If network request fails → mutation is queued for later
 * 3. On reconnect → queued mutations replay in order
 * 4. Cache invalidation after replay ensures fresh server state
 */
export const offlineMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action);

  // Catch rejected mutations that look like network errors
  if (isRejected(action)) {
    const meta = (action as { meta?: { arg?: { endpointName?: string; originalArgs?: unknown }; baseQueryMeta?: unknown } }).meta;
    const error = (action as { payload?: { status?: string } }).payload;

    // Only queue genuine offline failures — if the browser reports offline,
    // the user is truly disconnected. CORS/auth errors also surface as
    // FETCH_ERROR but should NOT be queued (they won't succeed on retry).
    if (
      error?.status === 'FETCH_ERROR' &&
      meta?.arg?.endpointName &&
      !navigator.onLine
    ) {
      const mutation: QueuedMutation = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        endpointName: meta.arg.endpointName,
        args: meta.arg.originalArgs,
        timestamp: Date.now(),
      };

      getQueue().then((queue) => {
        queue.push(mutation);
        saveQueue(queue);
      });
    }
  }

  return result;
};

/**
 * Replay all queued mutations in order.
 * Call this when the app detects it's back online.
 */
export async function replayOfflineQueue(dispatch: (action: unknown) => unknown): Promise<number> {
  const queue = await getQueue();
  if (queue.length === 0) return 0;

  let replayed = 0;

  for (const mutation of queue) {
    try {
      // Dispatch the mutation through RTKQ
      await dispatch(
        (baseApi.endpoints as Record<string, { initiate: (args: unknown) => unknown }>)[mutation.endpointName]?.initiate(mutation.args)
      );
      replayed++;
    } catch {
      // If replay fails, stop and keep remaining items in queue
      const remaining = queue.slice(queue.indexOf(mutation));
      await saveQueue(remaining);
      return replayed;
    }
  }

  // All replayed successfully — clear queue
  await saveQueue([]);
  return replayed;
}

/**
 * Get the current count of queued mutations (for UI display).
 */
export async function getOfflineQueueCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}

/**
 * Clear the offline queue. Call on logout so stale mutations
 * don't replay for a different user on next login.
 */
export async function clearOfflineQueue(): Promise<void> {
  await saveQueue([]);
}
