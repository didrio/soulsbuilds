// Weapon and tag pages (T55): `/weapons/moonveil`, `/tags/bleed`. Their slugs, paths and the title and
// description search results show. Pure and light (card data only), shared by the app, the build page's
// links and the link-preview function (functions/, which bundles this file).
import { cardWeapons, getWeaponType, tagGroups, type CardWeapon } from '@/data/core';
import { pageTitle, SITE_ORIGIN, truncate, type ShareMeta } from './share';
import { slugify } from './slug';

/** A hub page with fewer builds is `noindex` and left out of the sitemap: no thin pages. */
export const HUB_MIN_BUILDS = 3;

/** How many builds a hub page loads at a time (and the function lists). */
export const HUB_PAGE_SIZE = 24;

const DESCRIPTION_MAX = 200;

// --- Weapons ------------------------------------------------------------------------------------------

/** "Rivers of Blood" → "rivers-of-blood". Every weapon's slug is unique (hubs.test.ts). */
export const weaponSlug = (name: string) => slugify(name);

let weaponsBySlug: Map<string, CardWeapon> | undefined;

/** The weapon a `/weapons/<slug>` page is about, or undefined for a slug that names none. */
export function weaponBySlug(slug: string): CardWeapon | undefined {
  weaponsBySlug ??= new Map(cardWeapons.map((weapon) => [weaponSlug(weapon.name), weapon]));
  return weaponsBySlug.get(slug);
}

/** The weapon page's path: `/weapons/moonveil`. */
export const weaponPath = (name: string) => `/weapons/${weaponSlug(name)}`;

// --- Tags ---------------------------------------------------------------------------------------------

/** Tags whose name isn't what people search: the page says the short name ("Bleed builds"). */
const TAG_LABELS: Record<string, string> = { 'Bleed (Hemorrhage)': 'Bleed' };

/** A tag as hub pages name it: "Bleed (Hemorrhage)" → "Bleed", the rest as they are. */
export const tagLabel = (tag: string) => TAG_LABELS[tag] ?? tag;

/** "Radagon / Elden Beast" → "radagon-elden-beast"; "Bleed (Hemorrhage)" → "bleed". Unique (tested). */
export const tagSlug = (tag: string) => slugify(tagLabel(tag));

/** The tag's group in the tag picker ("Bosses", "Effects"…), or undefined for a tag not in the list. */
export function tagGroupOf(tag: string): string | undefined {
  return Object.entries(tagGroups).find(([, tags]) => tags.includes(tag))?.[0];
}

let tagsBySlug: Map<string, string> | undefined;

/** The tag a `/tags/<slug>` page is about, or undefined for a slug that names none. */
export function tagBySlug(slug: string): string | undefined {
  tagsBySlug ??= new Map(
    Object.values(tagGroups)
      .flat()
      .map((tag) => [tagSlug(tag), tag]),
  );
  return tagsBySlug.get(slug);
}

/** The tag page's path: `/tags/bleed`. */
export const tagPath = (tag: string) => `/tags/${tagSlug(tag)}`;

const isBoss = (tag: string) => tagGroupOf(tag) === 'Bosses';

/** Where a build's tag links: its page, or the builds page filtered by it (a tag no longer in the list). */
export const tagHref = (tag: string) =>
  tagBySlug(tagSlug(tag)) === tag ? tagPath(tag) : `/builds?tag=${encodeURIComponent(tag)}`;

// --- Links from a build -------------------------------------------------------------------------------

/** A build's distinct weapons in slot order (right hand first), as links to their pages. */
export function weaponLinks(weapons: readonly (number | null)[]): { name: string; path: string }[] {
  const ids = [...new Set(weapons.filter((id) => id !== null))];
  return ids.flatMap((id) => {
    const weapon = cardWeapons.find((card) => card.id === id);
    return weapon ? [{ name: weapon.name, path: weaponPath(weapon.name) }] : [];
  });
}

/**
 * The landing's Popular weapons (T55): the most used weapons from the daily stats, by build count, ties by
 * name, at most `max`. Only weapons whose page is worth indexing, so every link leads somewhere full, and no
 * staffs or seals (owner's call, 2026-11-17): casters carry one whatever the build, so they'd lead the line.
 * Their pages stay, linked from the builds.
 */
export function popularWeapons(
  weaponCounts: Record<string, number> | undefined,
  max = 8,
): { name: string; path: string; count: number }[] {
  return Object.entries(weaponCounts ?? {})
    .flatMap(([id, count]) => {
      const weapon = indexable(count) ? cardWeapons.find((card) => card.id === Number(id)) : null;
      if (!weapon || getWeaponType(weapon.type)?.group === 'catalyst') return [];
      return [{ name: weapon.name, path: weaponPath(weapon.name), count }];
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, max);
}

// --- What search results show -------------------------------------------------------------------------

/** "Moonveil Builds (Elden Ring) | Souls Builds". */
export const weaponHubTitle = (name: string, gameName: string) =>
  pageTitle(`${name} Builds (${gameName})`);

/** `detail`: the weapon at a glance ("Katana. Requires: Str 12, Dex 18, Int 23."), '' for none. */
export function weaponHubMeta(name: string, gameName: string, detail = ''): ShareMeta {
  const lead = `${gameName} builds with ${name}, most liked first: the community's stats, gear and write-ups, and where to find ${name}.`;
  return {
    title: weaponHubTitle(name, gameName),
    description: truncate(detail ? `${lead} ${detail}` : lead, DESCRIPTION_MAX),
  };
}

/** A tag page's heading: "Builds for Malenia" for a boss, else "Bleed Builds". */
export const tagHubHeading = (tag: string) =>
  isBoss(tag) ? `Builds for ${tag}` : `${tagLabel(tag)} Builds`;

/** "Builds for Malenia (Elden Ring) | Souls Builds", "Bleed Builds (Elden Ring) | Souls Builds". */
export function tagHubMeta(tag: string, gameName: string): ShareMeta {
  const description = isBoss(tag)
    ? `${gameName} builds for ${tag}, most liked first: what the community brings to the fight, with stats, gear and a route to get it.`
    : `${tagLabel(tag)} builds for ${gameName}, most liked first: the community's stats, weapons, armor and talismans, with a route to get the gear.`;
  return {
    title: pageTitle(`${tagHubHeading(tag)} (${gameName})`),
    description: truncate(description, DESCRIPTION_MAX),
  };
}

/** Absolute URLs, for canonical links and the sitemap. */
export const weaponUrl = (name: string) => `${SITE_ORIGIN}${weaponPath(name)}`;
export const tagUrl = (tag: string) => `${SITE_ORIGIN}${tagPath(tag)}`;

/** Whether a hub page with `count` builds is worth indexing. */
export const indexable = (count: number) => count >= HUB_MIN_BUILDS;
