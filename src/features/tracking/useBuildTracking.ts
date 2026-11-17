// Tracking a build on its page (T34): the player's progress, what it adds up to, and the actions.
// Tracking needs an account (T41): signed out there's no progress, and "Track this build" opens the
// intro (TrackingIntro), which continues into tracking once the visitor signs up or logs in. Changes
// show at once (the query cache) and are saved in the background (./saveQueue).
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getStartingClass } from '@/data';
import useAuth from '@/features/auth/useAuth';
import { errorMessage, getTracking, tracksAnyBuild } from '@/lib/firebase';
import type { StatKey } from '@/lib/buildMath';
import type { Build } from '@/lib/models';
import { queryKeys } from '@/lib/queryKeys';
import {
  applyChange,
  counterDelta,
  newItems,
  startTracking,
  trackedItems,
  trackingBaseline,
  trackingProgress,
  trackingStatus,
  type TrackingChange,
  type TrackingContext,
  type TrackingState,
} from '@/lib/tracking';
import { deleteNow, flushSaves, noteLoaded, scheduleSave } from './saveQueue';

/** What a build's progress is measured against: its tracked items, its stats, where stats start. */
export function trackingContext(build: Pick<Build, 'equipment' | 'stats' | 'startingClass'>) {
  return {
    items: trackedItems(build.equipment),
    target: build.stats,
    baseline: trackingBaseline(build.stats, getStartingClass(build.startingClass)?.stats ?? null),
  } satisfies TrackingContext;
}

/** Reads the player's progress, and tells the save queue what the database has (T36 counters). */
async function fetchTracking(uid: string, buildId: string) {
  const state = await getTracking(uid, buildId);
  noteLoaded(uid, buildId, state);
  return state;
}

export type BuildTracking = ReturnType<typeof useBuildTracking>;

/** `build` is null while it loads (or on /build/new): then nothing is tracked. */
export function useBuildTracking(build: Build | null) {
  const { uid, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const buildId = build?.id ?? '';
  const query = useQuery({
    queryKey: queryKeys.tracking(uid ?? '', buildId),
    queryFn: () => fetchTracking(uid ?? '', buildId),
    enabled: Boolean(build && uid),
    // This page is the only writer: a refetch could only undo a change that's still being saved.
    staleTime: Infinity,
  });
  const state = query.data ?? null;
  // Whether to show the intro first: the player tracks no build yet. One read, kept for the session.
  const anyBuild = useQuery({
    queryKey: queryKeys.tracksAnyBuild(uid ?? ''),
    queryFn: () => tracksAnyBuild(uid ?? ''),
    enabled: Boolean(build && uid) && query.isSuccess && !query.data,
    staleTime: Infinity,
  });
  const [error, setError] = useState('');

  // Leaving the page writes what's still waiting.
  useEffect(() => flushSaves, []);

  const context = build ? trackingContext(build) : null;

  const persist = (owner: string, next: TrackingState | null, delay?: number) => {
    const key = queryKeys.tracking(owner, buildId);
    const buildKey = queryKeys.build(buildId);
    const onError = (cause: unknown) => {
      setError(errorMessage(cause));
      void queryClient.invalidateQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: buildKey });
    };
    // The hero's "N playing · M finished" follows the player's own status at once (T36).
    const previous = queryClient.getQueryData<TrackingState | null>(key) ?? null;
    const delta = counterDelta(trackingStatus(previous), trackingStatus(next));
    if (delta.playerCount || delta.finishedCount) {
      queryClient.setQueryData<Build | null>(buildKey, (cached) =>
        cached
          ? {
              ...cached,
              playerCount: Math.max(0, cached.playerCount + delta.playerCount),
              finishedCount: Math.max(0, cached.finishedCount + delta.finishedCount),
            }
          : cached,
      );
    }
    queryClient.setQueryData(key, next);
    // The profile's Playing and Completed lists reload when they're next shown.
    void queryClient.invalidateQueries({ queryKey: queryKeys.trackedBuilds(owner) });
    setError('');
    if (next) {
      queryClient.setQueryData(queryKeys.tracksAnyBuild(owner), true);
      scheduleSave(owner, buildId, next, onError, delay);
    } else {
      deleteNow(owner, buildId)
        .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.tracksAnyBuild(owner) }))
        .catch(onError);
    }
  };

  const start = (owner: string) => {
    if (context) persist(owner, startTracking(context, new Date()), 0);
  };

  const change = (update: TrackingChange) => {
    if (uid && state && context) persist(uid, applyChange(state, update, context, new Date()));
  };

  return {
    /** True until we know whether (and how) the player can track this build. */
    loading:
      Boolean(build) &&
      (authLoading || (Boolean(uid) && (query.isPending || (!state && anyBuild.isPending)))),
    signedIn: Boolean(uid),
    /** Signed in and tracking no build yet: "Track this build" shows the intro first (T41). */
    firstTime: Boolean(uid) && anyBuild.data === false,
    state,
    progress: state && context ? trackingProgress(state, context) : null,
    newItems: state && context ? newItems(state, context.items) : [],
    baseline: context?.baseline ?? null,
    error,
    start: () => {
      if (uid) start(uid);
    },
    /**
     * After signing up or logging in from the intro: starts tracking on that account, unless it
     * already tracks this build (then its progress just shows).
     */
    startAfterSignIn: async (newUid: string) => {
      try {
        const existing = await queryClient.fetchQuery({
          queryKey: queryKeys.tracking(newUid, buildId),
          queryFn: () => fetchTracking(newUid, buildId),
          staleTime: Infinity,
        });
        if (!existing) start(newUid);
      } catch (cause) {
        setError(errorMessage(cause));
      }
    },
    stop: () => {
      if (uid) persist(uid, null);
    },
    /** Checks an item off on the route, or undoes it (T46): its tracking keys. */
    toggle: (keys: string[]) => change({ type: 'toggle', keys }),
    setStat: (stat: StatKey, value: number) => change({ type: 'stat', key: stat, value }),
    acknowledge: () => change({ type: 'acknowledge' }),
    /** Marks a route stop done, or undoes it (T44): its mark keys, and every mark key on the route. */
    mark: (keys: string[], route: string[]) => change({ type: 'mark', keys, route }),
  };
}
