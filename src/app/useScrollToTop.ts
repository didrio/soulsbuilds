import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router';
import { pageKey } from '@/features/editor/tabs';

/**
 * Opens each new page at the top (T20: "More by" cards link from the bottom of one build to another).
 * Back/forward is left to the browser's own scroll restoration, and links to a `#fragment` scroll to
 * their target as usual. A build's tabs are one page (T28): switching tabs doesn't jump to the top
 * (the tab bar brings itself into view, `BuildTabs`).
 */
export function useScrollToTop() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const page = pageKey(pathname);
  const previous = useRef(page);
  useEffect(() => {
    const samePage = previous.current === page;
    previous.current = page;
    if (!samePage && navigationType !== 'POP' && !hash) window.scrollTo(0, 0);
    // Only a new page counts; the hash and navigation type are read as of that change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
}
