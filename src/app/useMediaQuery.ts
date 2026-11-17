import { useSyncExternalStore } from 'react';

/**
 * Whether a media query matches, kept current as the window changes (T49: the build page picks one
 * layout per width instead of rendering both and hiding one with CSS). Pass the query as the
 * `@/theme` media constants spell it: `useMediaQuery(BELOW_TABLET)`.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
