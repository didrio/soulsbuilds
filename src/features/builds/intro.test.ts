import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EXAMPLE_BUILD,
  EXAMPLE_GUIDE_PATH,
  INTRO_LEAD,
  INTRO_PANELS,
  introItem,
  introTitle,
} from './intro';

const SEED_DIR = 'content/builds/er';

describe('the home intro (T69)', () => {
  it('links to a seeded build that exists in content/builds/er, by its fixed id and name', () => {
    const seeds = readdirSync(SEED_DIR)
      .filter((file) => file.endsWith('.json'))
      .map(
        (file) =>
          JSON.parse(readFileSync(`${SEED_DIR}/${file}`, 'utf8')) as Record<string, unknown>,
      );
    const seed = seeds.find(({ id }) => id === EXAMPLE_BUILD.id);
    expect(seed?.name).toBe(EXAMPLE_BUILD.name);
    expect(EXAMPLE_GUIDE_PATH).toBe(
      '/build/IAumzY2DNj2NHObXD0QB/moonveil-early-game-spellblade/guide',
    );
  });

  it('every icon is an item in the game data', () => {
    for (const panel of INTRO_PANELS) {
      for (const icon of panel.icons)
        expect(introItem(icon), `${panel.key} ${icon.id}`).toBeDefined();
    }
  });

  it("index.html's static copy (for crawlers on /) says the same and links to the same places", () => {
    const index = readFileSync('index.html', 'utf8');
    // Prettier wraps the block's lines: compare with the whitespace around tags and between words collapsed.
    const home = index
      .slice(index.indexOf('<!--home-->'), index.indexOf('<!--/home-->'))
      .replace(/\s+/g, ' ')
      .replace(/\s*>\s*/g, '>')
      .replace(/\s*</g, '<');
    expect(home).toContain(`<h1>${introTitle('Elden Ring')}</h1>`);
    expect(home).toContain(`<p>${INTRO_LEAD}</p>`);
    for (const panel of INTRO_PANELS) {
      expect(home).toContain(`>${panel.title}</a></h2>`);
      expect(home).toContain(`<p>${panel.text}</p>`);
      expect(home).toContain(`<a href="${panel.to}">${panel.title}</a>`);
    }
  });
});
