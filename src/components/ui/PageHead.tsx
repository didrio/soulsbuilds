import { useEffect } from 'react';

interface PageHeadProps {
  /** The tab title, e.g. "Privacy | Souls Builds". */
  title: string;
  description?: string;
  /** An absolute URL on soulsbuilds.com; omitted for pages that aren't indexed. */
  canonical?: string;
  /** Keeps the page out of search results. */
  noindex?: boolean;
}

/** The first `<meta name=…>` or `<link rel=…>` in the head, created if the page has none. */
function headTag(
  selector: string,
  create: () => HTMLElement,
): { el: HTMLElement; created: boolean } {
  const found = document.head.querySelector<HTMLElement>(selector);
  if (found) return { el: found, created: false };
  const el = create();
  document.head.appendChild(el);
  return { el, created: true };
}

function metaTag(name: string) {
  return headTag(`meta[name="${name}"]`, () => {
    const el = document.createElement('meta');
    el.setAttribute('name', name);
    return el;
  });
}

/**
 * This page's title, description, canonical URL and `noindex` in `document.head` (T51). It edits the
 * tags that are already there (`index.html`'s, or the ones the link-preview function wrote for a build)
 * instead of rendering `<title>` and friends, which React 19 would hoist as a second copy beside them.
 * What it created, it removes when the page goes; the title and description are the next page's to set.
 */
function PageHead({ title, description, canonical, noindex = false }: PageHeadProps) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    if (description === undefined) return;
    const { el } = metaTag('description');
    el.setAttribute('content', description);
  }, [description]);

  useEffect(() => {
    if (!canonical) return;
    const { el, created } = headTag('link[rel="canonical"]', () => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      return link;
    });
    const before = el.getAttribute('href');
    el.setAttribute('href', canonical);
    return () => {
      if (created) el.remove();
      else if (before !== null) el.setAttribute('href', before);
    };
  }, [canonical]);

  useEffect(() => {
    if (!noindex) return;
    const { el, created } = metaTag('robots');
    const before = el.getAttribute('content');
    el.setAttribute('content', 'noindex');
    return () => {
      if (created) el.remove();
      else if (before !== null) el.setAttribute('content', before);
    };
  }, [noindex]);

  return null;
}

export default PageHead;
