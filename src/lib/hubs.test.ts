import { describe, expect, it } from 'vitest';
import { cardWeapons, tagGroups } from '@/data/core';
import {
  indexable,
  popularWeapons,
  tagBySlug,
  tagHref,
  tagGroupOf,
  tagHubHeading,
  tagHubMeta,
  tagPath,
  tagSlug,
  tagUrl,
  weaponBySlug,
  weaponHubMeta,
  weaponLinks,
  weaponPath,
  weaponSlug,
  weaponUrl,
} from './hubs';

const allTags = Object.values(tagGroups).flat();

describe('weapon slugs', () => {
  it('names the weapon page by the weapon', () => {
    expect(weaponPath('Moonveil')).toBe('/weapons/moonveil');
    expect(weaponPath('Rivers of Blood')).toBe('/weapons/rivers-of-blood');
    expect(weaponUrl('Moonveil')).toBe('https://soulsbuilds.com/weapons/moonveil');
  });

  it('gives every weapon, DLC included, its own slug that leads back to it', () => {
    const slugs = cardWeapons.map((weapon) => weaponSlug(weapon.name));
    expect(new Set(slugs).size).toBe(cardWeapons.length);
    for (const weapon of cardWeapons) expect(weaponBySlug(weaponSlug(weapon.name))).toBe(weapon);
  });

  it('finds nothing for a slug that names no weapon', () => {
    expect(weaponBySlug('not-a-weapon')).toBeUndefined();
    expect(weaponBySlug('')).toBeUndefined();
  });
});

describe('tag slugs', () => {
  it('uses the short name people search', () => {
    expect(tagSlug('Bleed (Hemorrhage)')).toBe('bleed');
    expect(tagPath('Radagon / Elden Beast')).toBe('/tags/radagon-elden-beast');
    expect(tagUrl('PVP')).toBe('https://soulsbuilds.com/tags/pvp');
  });

  it('gives every tag its own slug that leads back to it', () => {
    const slugs = allTags.map(tagSlug);
    expect(new Set(slugs).size).toBe(allTags.length);
    for (const tag of allTags) expect(tagBySlug(tagSlug(tag))).toBe(tag);
    expect(tagBySlug('bleed-hemorrhage')).toBeUndefined();
  });

  it('knows each tag’s group', () => {
    expect(tagGroupOf('Malenia')).toBe('Bosses');
    expect(tagGroupOf('Katana')).toBe('Melee Weapons');
    expect(tagGroupOf('Nope')).toBeUndefined();
  });
});

describe('links from a build', () => {
  it('lists each weapon once, right hand first, and skips unknown IDs', () => {
    expect(weaponLinks([9040000, null, 9060000, 9040000, 1, null])).toEqual([
      { name: 'Rivers of Blood', path: '/weapons/rivers-of-blood' },
      { name: 'Moonveil', path: '/weapons/moonveil' },
    ]);
    expect(weaponLinks([null, null, null, null, null, null])).toEqual([]);
  });

  it('links a tag to its page, or to the landing filter for one no longer in the list', () => {
    expect(tagHref('Bleed (Hemorrhage)')).toBe('/tags/bleed');
    expect(tagHref('Old tag')).toBe('/?tag=Old%20tag');
  });
});

describe('popularWeapons', () => {
  it('lists weapons with enough builds, most used first, ties by name', () => {
    const counts = { '9060000': 3, '9040000': 5, '9000000': 3, '2000000': 2, '1': 9 };
    expect(popularWeapons(counts).map(({ name, count }) => `${name} ${count}`)).toEqual([
      'Rivers of Blood 5',
      'Moonveil 3',
      'Uchigatana 3',
    ]);
    expect(popularWeapons(counts, 1)).toHaveLength(1);
    expect(popularWeapons(undefined)).toEqual([]);
  });

  it('leaves out staffs and seals, which casters carry whatever the build', () => {
    const counts = { '34040000': 6, '33090000': 5, '31130000': 3, '9060000': 3 }; // Clawmark Seal,
    // Carian Regal Scepter, Brass Shield, Moonveil
    expect(popularWeapons(counts).map(({ name }) => name)).toEqual(['Brass Shield', 'Moonveil']);
  });
});

describe('hub titles and descriptions', () => {
  it('leads with what people search', () => {
    expect(weaponHubMeta('Moonveil', 'Elden Ring').title).toBe(
      'Moonveil Builds (Elden Ring) | Souls Builds',
    );
    expect(tagHubMeta('Bleed (Hemorrhage)', 'Elden Ring').title).toBe(
      'Bleed Builds (Elden Ring) | Souls Builds',
    );
    expect(tagHubMeta('Malenia', 'Elden Ring').title).toBe(
      'Builds for Malenia (Elden Ring) | Souls Builds',
    );
    expect(tagHubHeading('Malenia')).toBe('Builds for Malenia');
  });

  it('adds the weapon’s detail and keeps descriptions short', () => {
    const meta = weaponHubMeta(
      'Moonveil',
      'Elden Ring',
      'Katana. Requires: Str 12, Dex 18, Int 23.',
    );
    expect(meta.description).toMatch(/^Elden Ring builds with Moonveil, most liked first/);
    for (const weapon of cardWeapons) {
      const { description } = weaponHubMeta(weapon.name, 'Elden Ring', 'x '.repeat(100));
      expect(description.length).toBeLessThanOrEqual(200);
    }
    for (const tag of allTags) {
      expect(tagHubMeta(tag, 'Elden Ring').description.length).toBeLessThanOrEqual(200);
    }
  });

  it('keeps titles short enough not to be cut much in search results', () => {
    for (const weapon of cardWeapons) {
      expect(weaponHubMeta(weapon.name, 'Elden Ring').title.length).toBeLessThanOrEqual(80);
    }
    for (const tag of allTags) {
      expect(tagHubMeta(tag, 'Elden Ring').title.length).toBeLessThanOrEqual(80);
    }
  });

  it('indexes a hub from three builds', () => {
    expect(indexable(2)).toBe(false);
    expect(indexable(3)).toBe(true);
  });
});
