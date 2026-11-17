// The build page's tabs (T28, T48): which exist, their URLs, and which a visitor sees. Pure, so the
// route table, the tab bar and the page agree on one list.

import { slugify } from '@/lib/slug';

export type BuildTab = 'description' | 'guide' | 'comments';

/** In tab-bar order, with the URL segment after `/build/:buildId` (Description has none). */
export const BUILD_TABS: { tab: BuildTab; segment: string; label: string }[] = [
  { tab: 'description', segment: '', label: 'Description' },
  { tab: 'guide', segment: 'guide', label: 'Guide' },
  { tab: 'comments', segment: 'comments', label: 'Comments' },
];

/** Segments links used before T48, still opened (the page redirects to the tab's own URL). */
const OLD_SEGMENTS: Record<string, BuildTab> = { description: 'description', route: 'guide' };

/** The tab a URL segment names: none is Description; an old one its tab; an unknown one null. */
export function parseTab(segment: string | undefined): BuildTab | null {
  if (!segment) return 'description';
  return (
    BUILD_TABS.find((entry) => entry.segment === segment)?.tab ?? OLD_SEGMENTS[segment] ?? null
  );
}

/** Whether `segment` is the tab's own URL segment (not an old one): otherwise the page redirects. */
export const isCanonical = (segment: string | undefined, tab: BuildTab) =>
  (segment ?? '') === BUILD_TABS.find((entry) => entry.tab === tab)?.segment;

/**
 * What follows `/build/:buildId` (T56): an optional name slug, then an optional tab segment. A lone
 * segment that names a tab (or an old one) is the tab (links from before T56: `/build/x/guide`);
 * anything else is the slug.
 */
export function splitBuildPath(rest: string | undefined): {
  slug: string | null;
  tabSegment: string | undefined;
} {
  const [first, second] = (rest ?? '').split('/').filter(Boolean);
  if (first === undefined) return { slug: null, tabSegment: undefined };
  if (second === undefined && parseTab(first) !== null) return { slug: null, tabSegment: first };
  return { slug: first, tabSegment: second };
}

/**
 * `/build/x`, `/build/x/guide`, `/build/x/comments`; with the build's name the URL carries its slug
 * (`/build/x/bleed-samurai/guide`). The ID alone decides the build, so the name is optional.
 */
export function tabPath(buildId: string, tab: BuildTab, name?: string): string {
  const segment = BUILD_TABS.find((entry) => entry.tab === tab)?.segment ?? '';
  const parts = ['/build', buildId, name === undefined ? '' : slugify(name), segment];
  return parts.filter(Boolean).join('/');
}

/**
 * The tabs shown. Editing (and `/build/new`): Description only (the build itself is edited in the
 * sidebar). Viewing: all of them; Description always has something (the author's write-up or a
 * generated one, T47).
 */
export function visibleTabs({ editable }: { editable: boolean }): BuildTab[] {
  if (editable) return ['description'];
  return BUILD_TABS.map((entry) => entry.tab);
}

/**
 * The page a pathname belongs to, for scroll-to-top: a build's tabs are one page
 * (`/build/x/guide` → `/build/x`), so switching tabs keeps the scroll position.
 */
export function pageKey(pathname: string): string {
  const match = /^\/build\/([^/]+)\/.+$/.exec(pathname);
  return match ? `/build/${match[1]}` : pathname;
}
