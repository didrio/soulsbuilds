// The routes of the link-preview function (T37), apart from Firebase so they can be tested:
//   /build/:id[/tab]     the SPA's index.html with this build's title, description and card image
//   /og/build/:id.png    the card image
// Anything that goes wrong (no such build, a read fails) serves the plain index.html: the page must
// never break because a preview couldn't be made.
import { getCardItem, getCardWeapon, iconUrl } from '@/data/core';
import { buildImage } from '@/lib/equipment';
import type { BuildDoc } from '@/lib/models';
import { injectMeta, SITE_ORIGIN, shareMeta } from '@/lib/share';
import type { CardData } from './card';

export interface Deps {
  loadBuild(id: string): Promise<BuildDoc | null>;
  /** The author's display name, or '' when they have no profile. */
  loadAuthor(uid: string): Promise<string>;
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
const IMAGE_CACHE = 'public, max-age=3600, s-maxage=3600';

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
  const image = IMAGE.exec(path);
  if (image) return buildCard(image[1]!, deps);
  const page = PAGE.exec(path);
  const html = await indexHtml(deps);
  // Without the app's own index.html there's nothing to serve: Hosting would have, so say so.
  if (!html) return text(502, 'The app is not available right now.');
  const ok = (body: string, cache: string): Reply => ({
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': cache },
    body,
  });
  if (!page) return ok(html, 'public, max-age=0, s-maxage=60');
  const id = page[1]!;
  try {
    const found = await load(id, deps);
    if (!found) return ok(html, 'public, max-age=0, s-maxage=60');
    const meta = shareMeta({
      name: found.build.name,
      level: found.build.level,
      author: found.author,
      description: found.build.description,
      weapons: found.weapons,
    });
    return ok(
      injectMeta(html, {
        ...meta,
        url: `${SITE_ORIGIN}/build/${id}`,
        image: `${SITE_ORIGIN}/og/build/${id}.png`,
      }),
      PAGE_CACHE,
    );
  } catch (cause) {
    console.error('preview failed', id, cause);
    return ok(html, 'public, max-age=0, s-maxage=60');
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
