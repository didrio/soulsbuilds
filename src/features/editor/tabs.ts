// The build page's tabs (T28): which exist, their URLs, and which a visitor sees. Pure, so the route
// table, the tab bar and the page agree on one list.

export type BuildTab = 'loadout' | 'description' | 'route' | 'comments';

/** In tab-bar order, with the URL segment after `/build/:buildId` (Loadout has none). */
export const BUILD_TABS: { tab: BuildTab; segment: string; label: string }[] = [
  { tab: 'loadout', segment: '', label: 'Loadout' },
  { tab: 'description', segment: 'description', label: 'Description' },
  { tab: 'route', segment: 'route', label: 'How to get' },
  { tab: 'comments', segment: 'comments', label: 'Comments' },
];

/** The tab a `:tab?` URL segment names: none is Loadout; an unknown one is null. */
export function parseTab(segment: string | undefined): BuildTab | null {
  if (!segment) return 'loadout';
  return BUILD_TABS.find((entry) => entry.segment === segment)?.tab ?? null;
}

/** `/build/x`, `/build/x/description`, `/build/x/route`, `/build/x/comments`. */
export function tabPath(buildId: string, tab: BuildTab): string {
  const segment = BUILD_TABS.find((entry) => entry.tab === tab)?.segment ?? '';
  return segment ? `/build/${buildId}/${segment}` : `/build/${buildId}`;
}

/**
 * The tabs shown. Editing (and `/build/new`): Loadout and Description only. Viewing: Description only
 * when the build has one (owner, 2026-11-16: the owner adds one through Edit).
 */
export function visibleTabs({
  editable,
  hasDescription,
}: {
  editable: boolean;
  hasDescription: boolean;
}): BuildTab[] {
  if (editable) return ['loadout', 'description'];
  return BUILD_TABS.map((entry) => entry.tab).filter(
    (tab) => tab !== 'description' || hasDescription,
  );
}

/**
 * The page a pathname belongs to, for scroll-to-top: a build's tabs are one page
 * (`/build/x/route` → `/build/x`), so switching tabs keeps the scroll position.
 */
export function pageKey(pathname: string): string {
  const match = /^\/build\/([^/]+)\/([^/]+)\/?$/.exec(pathname);
  return match ? `/build/${match[1]}` : pathname;
}
