// The like toggle on the build page: optimistic count and liked state, then a Firestore write.
import { useState, useEffect, type Dispatch, type SetStateAction } from 'react';
import { handleUserLike } from '@/lib/firebase';
import type { User } from '@/lib/models';
import type { AuthState } from './useBuildEditor';

interface UseLikeBuildOptions {
  auth: AuthState;
  buildId: string | null;
  loggedInUser: User | null;
  setLikes: Dispatch<SetStateAction<number>>;
}

export function useLikeBuild({ auth, buildId, loggedInUser, setLikes }: UseLikeBuildOptions) {
  const [handlingLike, setHandlingLike] = useState(false);
  const [likedBuilds, setLikedBuilds] = useState<string[]>([]);

  useEffect(() => {
    const { likedBuilds: savedLikedBuilds = [] } = loggedInUser || {};
    setLikedBuilds(savedLikedBuilds);
  }, [loggedInUser]);

  // On an error the button stays locked (T5).
  const handleLike = async () => {
    if (!handlingLike && auth && loggedInUser && buildId) {
      setHandlingLike(true);
      const shouldAdd = !likedBuilds.includes(buildId);
      if (shouldAdd) {
        setLikedBuilds([...likedBuilds, buildId]);
      } else {
        setLikedBuilds(likedBuilds.filter((id) => id !== buildId));
      }
      setLikes((prevLikes) => (shouldAdd ? prevLikes + 1 : prevLikes - 1));
      try {
        await handleUserLike(auth.uid, buildId, shouldAdd);
        setHandlingLike(false);
      } catch (error) {
        console.log(error instanceof Error ? error.message : error);
      }
    }
  };

  return { handleLike };
}
