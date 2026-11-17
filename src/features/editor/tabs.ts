// The build page's tabs (T28, T48; Equipment and Discussion since T63): which exist, their URLs, and which a visitor sees. Pure, so the
// route table, the tab bar and the page agree on one list.

import { slugify } from '@/lib/slug';

export type BuildTab = 'equipment' | 'guide' | 'discussion';

/** In tab-bar order, with the URL segment after `/build/:buildId` (Equipment has none). */
export const BUILD_TABS: { tab: BuildTab; segment: string; label: string }[] = [
  { tab: 'equipment', segment: '', label: 'Equipment' },
  { tab: 'guide', segment: 'guide', label: 'Guide' },
  { tab: 'discussion', segment: 'discussion', label: 'Discussion' },
];

/**
 * Segments older links use, still opened (the page redirects to the tab's own URL): `route` (before
 * T48), `description` and `comments` (before T63: the write-up now heads the Discussion).
 */
const OLD_SEGMENTS: Record<string, BuildTab> = {
  description: 'discussion',
  route: 'guide',
  comments: 'discussion',
};

/** The tab a URL segment names: none is Equipment; an old one its tab; an unknown one null. */
export function parseTab(segment: string | undefined): BuildTab | null {
  if (!segment) return 'equipment';
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
 * `/build/x`, `/build/x/guide`, `/build/x/discussion`; with the build's name the URL carries its slug
 * (`/build/x/bleed-samurai/guide`). The ID alone decides the build, so the name is optional.
 */
export function tabPath(buildId: string, tab: BuildTab, name?: string): string {
  const segment = BUILD_TABS.find((entry) => entry.tab === tab)?.segment ?? '';
  const parts = ['/build', buildId, name === undefined ? '' : slugify(name), segment];
  return parts.filter(Boolean).join('/');
}

/**
 * The tabs shown. Editing (and `/build/new`): Equipment only (the stats, the equipment and the
 * write-up are all edited there). Viewing: all of them.
 */
export function visibleTabs({ editable }: { editable: boolean }): BuildTab[] {
  if (editable) return ['equipment'];
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
