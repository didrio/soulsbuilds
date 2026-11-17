import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { countPage } from '@/lib/usage';

/**
 * Counts each page the visitor opens (T38). The first page of a visit keeps the browser's referrer;
 * the rest have none, or every page would credit the site that sent the visitor.
 */
export function usePageViews() {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    countPage(pathname, first.current ? undefined : '');
    first.current = false;
  }, [pathname]);
}
