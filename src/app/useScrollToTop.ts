import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router';

/**
 * Opens each new page at the top (T20: "More by" cards link from the bottom of one build to another).
 * Back/forward is left to the browser's own scroll restoration, and links to a `#fragment` scroll to
 * their target as usual.
 */
export function useScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (navigationType !== 'POP' && !hash) window.scrollTo(0, 0);
    // Only a new page counts; the hash and navigation type are read as of that change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
