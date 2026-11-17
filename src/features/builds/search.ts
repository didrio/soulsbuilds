// Search over the daily index (T74): words anywhere in a build's name, its tags or its weapons' names,
// with the filters and the sort kept. The index comes with the community stats (`stats/<game>`
// searchIndex, written by `scripts/admin.mjs stats`), so searching costs no query of its own; the
// results are then read by id, fresh. Pure.
import { cardWeapons, getCardWeapon, tagGroups } from '@/data/core';
import type { BuildSort } from '@/lib/firebase';
import { tagLabel, tagPath, weaponPath } from '@/lib/hubs';
import type { SearchEntry } from '@/lib/models';
import { weaponIdOf, type BuildFilters } from './filters';

/** Lowercase, accents and punctuation gone: "Godslayer's Seal" → "godslayer s seal". */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** The words of a text, normalized. */
export const words = (text: string): string[] => normalize(text).split(' ').filter(Boolean);

/** True when every query word starts a word of the text's words. */
export function matchesWords(query: readonly string[], haystack: readonly string[]): boolean {
  return query.every((word) => haystack.some((candidate) => candidate.startsWith(word)));
}

/** A build's searchable words: its name, its tags (and their short names), its weapons' names. */
export function entryWords(entry: SearchEntry): string[] {
  return [
    entry.name,
    ...entry.tags.flatMap((tag) => [tag, tagLabel(tag)]),
    ...entry.weapons.map((id) => getCardWeapon(id)?.name ?? ''),
  ].flatMap(words);
}

/** True when the entry passes the filters (level range, every tag, the weapon). */
export function entryPasses(entry: SearchEntry, filters: BuildFilters): boolean {
  const weaponId = weaponIdOf(filters);
  return (
    entry.level >= filters.minLevel &&
    entry.level <= filters.maxLevel &&
    filters.tags.every((tag) => entry.tags.includes(tag)) &&
    (weaponId === undefined || entry.weapons.includes(weaponId))
  );
}

/** Orders like the Firestore lists: by the sort's count, ties newest first (T74). */
export function compareEntries(sort: BuildSort) {
  return (a: SearchEntry, b: SearchEntry) => {
    if (sort === 'top' && a.likeCount !== b.likeCount) return b.likeCount - a.likeCount;
    if (sort === 'played' && a.playerCount !== b.playerCount) return b.playerCount - a.playerCount;
    return b.createdAt - a.createdAt;
  };
}

/** The ids of the indexed builds matching the search and the filters, in the sort's order. */
export function searchIds(index: readonly SearchEntry[], filters: BuildFilters): string[] {
  const query = words(filters.search);
  return index
    .filter((entry) => entryPasses(entry, filters))
    .filter((entry) => matchesWords(query, entryWords(entry)))
    .sort(compareEntries(filters.sort))
    .map((entry) => entry.id);
}

export interface Suggestion {
  kind: 'weapon' | 'tag';
  name: string;
  path: string;
  /** Builds with it (from the daily counts). */
  count: number;
  /** Weapons: the game ID, for the icon. */
  id?: number;
}

const ALL_TAGS = Object.values(tagGroups).flat();

/**
 * The weapon and tag pages a search names (T74: "moonveil" → Moonveil's page): those whose name has
 * every query word and that some build uses, most used first, at most `max` of each. Nothing for a
 * query under two characters.
 */
export function suggestions(
  search: string,
  counts: { weaponCounts?: Record<string, number>; tagCounts?: Record<string, number> },
  max = 3,
): Suggestion[] {
  const query = words(search);
  if (query.join('').length < 2) return [];
  const byCount = (a: Suggestion, b: Suggestion) =>
    b.count - a.count || a.name.localeCompare(b.name);
  const weapons = cardWeapons
    .flatMap((weapon): Suggestion[] => {
      const count = counts.weaponCounts?.[weapon.id] ?? 0;
      if (!count || !matchesWords(query, words(weapon.name))) return [];
      return [
        { kind: 'weapon', name: weapon.name, path: weaponPath(weapon.name), count, id: weapon.id },
      ];
    })
    .sort(byCount)
    .slice(0, max);
  const tags = ALL_TAGS.flatMap((tag): Suggestion[] => {
    const count = counts.tagCounts?.[tag] ?? 0;
    if (!count || !matchesWords(query, words(`${tag} ${tagLabel(tag)}`))) return [];
    return [{ kind: 'tag', name: tagLabel(tag), path: tagPath(tag), count }];
  })
    .sort(byCount)
    .slice(0, max);
  return [...weapons, ...tags];
}

/**
 * How many builds match, when it can be known (T74's count): all loaded (exact), or the daily index's
 * count (at least what's loaded: builds newer than the index aren't in it). Undefined = unknown.
 */
export function resultCount(
  shown: number,
  more: boolean,
  stats: { searchIndex?: SearchEntry[] } | null | undefined,
  filters: BuildFilters,
): number | undefined {
  if (!more) return shown;
  const index = stats?.searchIndex;
  if (!index) return undefined;
  return Math.max(shown, index.filter((entry) => entryPasses(entry, filters)).length);
}
