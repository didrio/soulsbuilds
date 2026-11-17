// The routes of the link-preview function (T37) and what crawlers read (T50), apart from Firebase so
// they can be tested:
//   /build/:id[/slug][/tab]  the SPA's index.html with this build's title, description and card image, and the
//                        build as plain HTML inside #root (page.ts); a build that doesn't exist is a 404
//                        with noindex (the app still shows its own message)
//   /og/build/:id.png    the card image
//   /weapons/:slug       a weapon's page (T55): its head tags and, inside #root, its facts, where to find
//                        it and its builds (hub.ts); an unknown slug is a 404; under 3 builds, noindex
//   /tags/:slug          a tag's page (T55), the same way
//   /sitemap.xml         the home page, every build (at its named URL, T56), and the weapon and tag
//                        pages with 3 or more builds (T55)
// Anything else that goes wrong (a read fails, the content can't be made) serves the plain index.html with
// status 200: the page must never break because a preview couldn't be made.
import { getWeapon } from '@/data';
import { getCardItem, getCardWeapon, iconUrl } from '@/data/core';
import { weaponDetail } from '@/features/hubs/weaponFacts';
import { buildImage } from '@/lib/equipment';
import {
  HUB_PAGE_SIZE,
  indexable,
  tagBySlug,
  tagHubMeta,
  tagSlug,
  tagUrl,
  weaponBySlug,
  weaponHubMeta,
  weaponUrl,
} from '@/lib/hubs';
import type { BuildDoc } from '@/lib/models';
import {
  buildUrl,
  injectHead,
  injectMeta,
  injectNoindex,
  injectRoot,
  SITE_ORIGIN,
  shareMeta,
  sitemapXml,
  type SitemapEntry,
} from '@/lib/share';
import type { CardData } from './card';
import { tagHubHtml, type HubBuild } from './hub';
import { buildJsonLd } from './jsonld';
import { buildContentHtml } from './page';

export interface Deps {
  loadBuild(id: string): Promise<BuildDoc | null>;
  /** The author's display name, or '' when they have no profile. */
  loadAuthor(uid: string): Promise<string>;
  /** Every build's ID, name, last edit, tags and weapons: the sitemap's builds and hub pages. */
  listBuilds(): Promise<SitemapBuild[]>;
  /** Up to `limit` builds with the weapon in either hand, most liked first (T55). */
  listWeaponBuilds(weaponId: number, limit: number): Promise<HubBuild[]>;
  /** Up to `limit` builds with the tag, most liked first (T55). */
  listTagBuilds(tag: string, limit: number): Promise<HubBuild[]>;
  /** A file Hosting serves (index.html, an icon), or null. */
  fetchStatic(path: string): Promise<Uint8Array | null>;
  renderCard(card: CardData): Promise<Uint8Array>;
}

export interface SitemapBuild {
  id: string;
  name: string;
  updatedAt?: Date;
  tags: string[];
  /** `equipment.weapons`: game IDs and nulls. */
  weapons: (number | null)[];
}

export interface Reply {
  status: number;
  headers: Record<string, string>;
  body: string | Uint8Array;
}

const BUILD_ID = '[A-Za-z0-9]{1,40}';
// `/build/<id>`, then an optional name slug and tab, in any mix (T56): the ID alone decides the build.
const PAGE = new RegExp(`^/build/(${BUILD_ID})(?:/[^/]+){0,2}/?$`);
const IMAGE = new RegExp(`^/og/build/(${BUILD_ID})\\.png$`);
const WEAPON_PAGE = /^\/weapons\/([a-z0-9-]{1,80})\/?$/;
const TAG_PAGE = /^\/tags\/([a-z0-9-]{1,80})\/?$/;

/** Pages change when the author edits and when a deploy replaces the app's files: keep both short. */
const PAGE_CACHE = 'public, max-age=0, s-maxage=300';
/** The plain page, missing builds and failures: short, so a fix or a new build shows up soon. */
const SHORT_CACHE = 'public, max-age=0, s-maxage=60';
const IMAGE_CACHE = 'public, max-age=3600, s-maxage=3600';
/** Crawlers fetch the sitemap rarely; an hour keeps a crawl from re-reading every build. */
const SITEMAP_CACHE = 'public, max-age=3600, s-maxage=3600';

/** The editor's create page shares the build route (`/build/new`): it's not a missing build. */
const NEW_BUILD = 'new';

export const FALLBACK_NAME = 'a player';

function text(status: number, body: string): Reply {
  return { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' }, body };
}

async function indexHtml(deps: Deps): Promise<string | null> {
  const bytes = await deps.fetchStatic('/index.html');
  return bytes ? new TextDecoder().decode(bytes) : null;
}

/** The facts the page and the card both use. */
async function load(id: string, deps: Deps) {
  const build = await deps.loadBuild(id);
  if (!build) return null;
  const author = (await deps.loadAuthor(build.ownerId)) || FALLBACK_NAME;
  const weapons = build.equipment.weapons.flatMap((weapon) =>
    weapon === null ? [] : [getCardWeapon(weapon)?.name ?? []].flat(),
  );
  const picture = getCardItem(
    buildImage({ image: build.image ?? null, equipment: build.equipment }),
  );
  return { build, author, weapons, picture };
}

export async function handle(path: string, deps: Deps): Promise<Reply> {
  if (path === '/sitemap.xml') return sitemap(deps);
  const image = IMAGE.exec(path);
  if (image) return buildCard(image[1]!, deps);
  const page = PAGE.exec(path);
  const html = await indexHtml(deps);
  // Without the app's own index.html there's nothing to serve: Hosting would have, so say so.
  if (!html) return text(502, 'The app is not available right now.');
  const reply = (status: number, body: string, cache: string): Reply => ({
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache },
    body,
  });
  const weaponPage = WEAPON_PAGE.exec(path);
  if (weaponPage) return weaponHub(weaponPage[1]!, html, deps);
  const tagPage = TAG_PAGE.exec(path);
  if (tagPage) return tagHub(tagPage[1]!, html, deps);
  if (!page || page[1] === NEW_BUILD) return reply(200, html, SHORT_CACHE);
  const id = page[1]!;
  try {
    const found = await load(id, deps);
    if (!found) return reply(404, injectNoindex(html), SHORT_CACHE);
    const meta = shareMeta({
      name: found.build.name,
      level: found.build.level,
      author: found.author,
      description: found.build.description,
      weapons: found.weapons,
    });
    const withMeta = injectMeta(html, {
      ...meta,
      url: buildUrl(id, found.build.name),
      image: `${SITE_ORIGIN}/og/build/${id}.png`,
    });
    const withData = injectHead(withMeta, buildJsonLd(found.build, found.author, id));
    return reply(200, withContent(withData, found.build, found.author, id), PAGE_CACHE);
  } catch (cause) {
    console.error('preview failed', id, cause);
    return reply(200, html, SHORT_CACHE);
  }
}

const htmlReply = (status: number, body: string, cache: string): Reply => ({
  status,
  headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache },
  body,
});

/** The site-level image: hub pages have no card of their own. */
const SITE_IMAGE = `${SITE_ORIGIN}/icons/og-image.png`;

/**
 * A hub page (T55): the head tags, then the content inside #root (or not, if making it fails). Fewer
 * than 3 builds: noindex, like the app does.
 */
function hubPage(
  html: string,
  meta: { title: string; description: string },
  url: string,
  builds: readonly HubBuild[],
  content: () => string,
): Reply {
  let page = injectMeta(html, { ...meta, url, image: SITE_IMAGE });
  if (!indexable(builds.length)) page = injectNoindex(page);
  try {
    page = injectRoot(page, content());
  } catch (cause) {
    console.error('hub content failed', url, cause);
  }
  return htmlReply(200, page, PAGE_CACHE);
}

async function weaponHub(slug: string, html: string, deps: Deps): Promise<Reply> {
  const weapon = getWeapon(weaponBySlug(slug)?.id);
  if (!weapon) return htmlReply(404, injectNoindex(html), SHORT_CACHE);
  try {
    const builds = await deps.listWeaponBuilds(weapon.id, HUB_PAGE_SIZE);
    // The acquisition data (~400 KB) only weapon pages need: loaded with the first one.
    const { weaponHubHtml } = await import('./weaponHub');
    return hubPage(
      html,
      weaponHubMeta(weapon.name, 'Elden Ring', weaponDetail(weapon)),
      weaponUrl(weapon.name),
      builds,
      () => weaponHubHtml(weapon, builds),
    );
  } catch (cause) {
    console.error('weapon page failed', slug, cause);
    return htmlReply(200, html, SHORT_CACHE);
  }
}

async function tagHub(slug: string, html: string, deps: Deps): Promise<Reply> {
  const tag = tagBySlug(slug);
  if (!tag) return htmlReply(404, injectNoindex(html), SHORT_CACHE);
  try {
    const builds = await deps.listTagBuilds(tag, HUB_PAGE_SIZE);
    return hubPage(html, tagHubMeta(tag, 'Elden Ring'), tagUrl(tag), builds, () =>
      tagHubHtml(tag, builds),
    );
  } catch (cause) {
    console.error('tag page failed', slug, cause);
    return htmlReply(200, html, SHORT_CACHE);
  }
}

/**
 * The weapon and tag pages worth listing (T55): those with 3 or more builds, each dated by its newest
 * edit. From the builds the sitemap reads anyway, so no extra reads.
 */
export function hubEntries(builds: readonly SitemapBuild[]): SitemapEntry[] {
  const hubs = new Map<string, { count: number; lastmod?: Date }>();
  const add = (loc: string, updatedAt?: Date) => {
    const hub = hubs.get(loc) ?? { count: 0 };
    hub.count += 1;
    if (updatedAt && (!hub.lastmod || updatedAt > hub.lastmod)) hub.lastmod = updatedAt;
    hubs.set(loc, hub);
  };
  for (const build of builds) {
    for (const id of new Set(build.weapons)) {
      const name = id === null ? undefined : getCardWeapon(id)?.name;
      if (name) add(weaponUrl(name), build.updatedAt);
    }
    for (const tag of new Set(build.tags)) {
      if (tagBySlug(tagSlug(tag)) === tag) add(tagUrl(tag), build.updatedAt);
    }
  }
  return [...hubs]
    .filter(([, hub]) => indexable(hub.count))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([loc, { lastmod }]) => ({ loc, ...(lastmod ? { lastmod } : {}) }));
}

/** The page with the build inside #root, or without it (the meta still work) if that fails. */
function withContent(html: string, build: BuildDoc, author: string, id: string): string {
  try {
    return injectRoot(html, buildContentHtml(build, { uid: build.ownerId, name: author }));
  } catch (cause) {
    console.error('page content failed', id, cause);
    return html;
  }
}

async function sitemap(deps: Deps): Promise<Reply> {
  try {
    const builds = await deps.listBuilds();
    const body = sitemapXml([
      { loc: `${SITE_ORIGIN}/` },
      ...builds.map(({ id, name, updatedAt }) => ({
        loc: buildUrl(id, name),
        lastmod: updatedAt,
      })),
      ...hubEntries(builds),
    ]);
    return {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': SITEMAP_CACHE },
      body,
    };
  } catch (cause) {
    // Never a partial list: crawlers retry an error, while a short sitemap would look like removed pages.
    console.error('sitemap failed', cause);
    return {
      ...text(500, 'The sitemap is not available right now.'),
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    };
  }
}

async function buildCard(id: string, deps: Deps): Promise<Reply> {
  try {
    const found = await load(id, deps);
    if (!found) return text(404, 'No such build.');
    const iconBytes = found.picture ? await deps.fetchStatic(iconUrl(found.picture.icon)) : null;
    const png = await deps.renderCard({
      game: found.build.game,
      name: found.build.name,
      level: found.build.level,
      author: found.author,
      weapons: found.weapons,
      icon: iconBytes,
    });
    return {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': IMAGE_CACHE },
      body: png,
    };
  } catch (cause) {
    console.error('card failed', id, cause);
    // The site-level image keeps the link looking right while the card is unavailable.
    return { status: 302, headers: { Location: `${SITE_ORIGIN}/icons/og-image.png` }, body: '' };
  }
}
