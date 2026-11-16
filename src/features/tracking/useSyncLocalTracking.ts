// On sign-up or log-in (T34): progress tracked on this device while signed out moves into the
// account, merged with any progress the account already has on the same build, and leaves local
// storage. If a write fails, that build stays local and is tried again at the next sign-in.
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import useAuth from '@/features/auth/useAuth';
import { getTracking, saveTracking } from '@/lib/firebase';
import { queryKeys } from '@/lib/queryKeys';
import { mergeTracking } from '@/lib/tracking';
// Runs on every page (App): keep it free of the full game data (@/data), like everything in the shell.
import { LOCAL_OWNER, readAllLocal, removeLocal } from './localTracking';

/** Copies local progress into the account; resolves to the build IDs moved. */
export async function moveLocalTracking(
  uid: string,
  onMoved: (buildId: string, merged: ReturnType<typeof mergeTracking>) => void = () => undefined,
): Promise<string[]> {
  const moved: string[] = [];
  for (const [buildId, local] of Object.entries(readAllLocal())) {
    try {
      const remote = await getTracking(uid, buildId);
      const merged = remote ? mergeTracking(remote, local) : local;
      await saveTracking(uid, buildId, merged);
      removeLocal(buildId);
      onMoved(buildId, merged);
      moved.push(buildId);
    } catch {
      // Kept on this device; tried again next time.
    }
  }
  return moved;
}

/** Mounted once in the app shell. */
export function useSyncLocalTracking() {
  const { uid } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!uid) return;
    void moveLocalTracking(uid, (buildId, merged) => {
      queryClient.setQueryData(queryKeys.tracking(uid, buildId), merged);
      queryClient.removeQueries({ queryKey: queryKeys.tracking(LOCAL_OWNER, buildId) });
    });
  }, [uid, queryClient]);
}
