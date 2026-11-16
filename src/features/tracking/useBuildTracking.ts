// Tracking a build on its page (T34): the player's progress (Firestore when signed in, local storage
// when not), what it adds up to, and the actions. Changes show at once (the query cache) and are saved
// in the background (./saveQueue).
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getStartingClass } from '@/data';
import useAuth from '@/features/auth/useAuth';
import { deleteTracking, errorMessage, getTracking } from '@/lib/firebase';
import type { StatKey } from '@/lib/buildMath';
import type { Build } from '@/lib/models';
import { queryKeys } from '@/lib/queryKeys';
import {
  applyChange,
  newItems,
  startTracking,
  trackedItems,
  trackingBaseline,
  trackingProgress,
  type TrackingChange,
  type TrackingContext,
  type TrackingState,
} from '@/lib/tracking';
import { LOCAL_OWNER, readLocal, removeLocal, writeLocal } from './localTracking';
import { cancelSave, flushSaves, scheduleSave } from './saveQueue';

/** What a build's progress is measured against: its tracked items, its stats, where stats start. */
export function trackingContext(build: Pick<Build, 'equipment' | 'stats' | 'startingClass'>) {
  return {
    items: trackedItems(build.equipment),
    target: build.stats,
    baseline: trackingBaseline(build.stats, getStartingClass(build.startingClass)?.stats ?? null),
  } satisfies TrackingContext;
}

export type BuildTracking = ReturnType<typeof useBuildTracking>;

/** `build` is null while it loads (or on /build/new): then nothing is tracked. */
export function useBuildTracking(build: Build | null) {
  const { uid, loading } = useAuth();
  const queryClient = useQueryClient();
  const buildId = build?.id ?? '';
  const key = queryKeys.tracking(uid ?? LOCAL_OWNER, buildId);
  const query = useQuery({
    queryKey: key,
    queryFn: async () => (uid ? getTracking(uid, buildId) : readLocal(buildId)),
    enabled: Boolean(build) && !loading,
    // This page is the only writer: a refetch could only undo a change that's still being saved.
    staleTime: Infinity,
  });
  const [error, setError] = useState('');

  // Leaving the page writes what's still waiting.
  useEffect(() => flushSaves, []);

  const state = query.data ?? null;
  const context = build ? trackingContext(build) : null;

  const onError = (cause: unknown) => {
    setError(errorMessage(cause));
    void queryClient.invalidateQueries({ queryKey: key });
  };

  const persist = (next: TrackingState | null, delay?: number) => {
    queryClient.setQueryData(key, next);
    setError('');
    if (!uid) {
      if (next) writeLocal(buildId, next);
      else removeLocal(buildId);
    } else if (next) {
      scheduleSave(uid, buildId, next, onError, delay);
    } else {
      cancelSave(uid, buildId);
      deleteTracking(uid, buildId).catch(onError);
    }
  };

  const change = (update: TrackingChange) => {
    if (state && context) persist(applyChange(state, update, context, new Date()));
  };

  return {
    /** True until we know whether the player tracks this build. */
    loading: Boolean(build) && (loading || query.isPending),
    signedIn: Boolean(uid),
    state,
    progress: state && context ? trackingProgress(state, context) : null,
    newItems: state && context ? newItems(state, context.items) : [],
    baseline: context?.baseline ?? null,
    error,
    start: () => {
      if (context) persist(startTracking(context, new Date()), 0);
    },
    stop: () => persist(null),
    toggle: (itemKey: string) => change({ type: 'toggle', key: itemKey }),
    setStat: (stat: StatKey, value: number) => change({ type: 'stat', key: stat, value }),
    acknowledge: () => change({ type: 'acknowledge' }),
  };
}
