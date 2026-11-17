// The routes of the link-preview function (T37) and what crawlers read (T50), apart from Firebase so
// they can be tested:
//   /build/:id[/tab]     the SPA's index.html with this build's title, description and card image, and the
//                        build as plain HTML inside #root (page.ts); a build that doesn't exist is a 404
//                        with noindex (the app still shows its own message)
//   /og/build/:id.png    the card image
//   /sitemap.xml         the home page and every build
// Anything else that goes wrong (a read fails, the content can't be made) serves the plain index.html with
// status 200: the page must never break because a preview couldn't be made.
import { getCardItem, getCardWeapon, iconUrl } from '@/data/core';
import { buildImage } from '@/lib/equipment';
import type { BuildDoc } from '@/lib/models';
import {
  injectMeta,
  injectNoindex,
  injectRoot,
  SITE_ORIGIN,
  shareMeta,
  sitemapXml,
} from '@/lib/share';
import type { CardData } from './card';
import { buildContentHtml } from './page';

export interface Deps {
  loadBuild(id: string): Promise<BuildDoc | null>;
  /** The author's display name, or '' when they have no profile. */
  loadAuthor(uid: string): Promise<string>;
  /** Every build's ID and last edit, for the sitemap. */
  listBuilds(): Promise<{ id: string; updatedAt?: Date }[]>;
  /** A file Hosting serves (index.html, an icon), or null. */
  fetchStatic(path: string): Promise<Uint8Array | null>;
  renderCard(card: CardData): Promise<Uint8Array>;
}

export interface Reply {
  status: number;
  headers: Record<string, string>;
  body: string | Uint8Array;
}

const BUILD_ID = '[A-Za-z0-9]{1,40}';
const PAGE = new RegExp(`^/build/(${BUILD_ID})(?:/(?:description|guide|comments))?/?$`);
const IMAGE = new RegExp(`^/og/build/(${BUILD_ID})\\.png$`);

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
      url: `${SITE_ORIGIN}/build/${id}`,
      image: `${SITE_ORIGIN}/og/build/${id}.png`,
    });
    return reply(200, withContent(withMeta, found.build, found.author, id), PAGE_CACHE);
  } catch (cause) {
    console.error('preview failed', id, cause);
    return reply(200, html, SHORT_CACHE);
  }
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
      ...builds.map(({ id, updatedAt }) => ({
        loc: `${SITE_ORIGIN}/build/${id}`,
        lastmod: updatedAt,
      })),
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
