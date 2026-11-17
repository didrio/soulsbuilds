import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(slugify('Bleed Samurai Katana')).toBe('bleed-samurai-katana');
  });

  it('drops punctuation and collapses runs', () => {
    expect(slugify('  Rivers -- of Blood!!  (PvP) ')).toBe('rivers-of-blood-pvp');
  });

  it('folds accents', () => {
    expect(slugify('Café Müller’s Édition')).toBe('cafe-muller-s-edition');
  });

  it('falls back to "build" when nothing is left', () => {
    expect(slugify('')).toBe('build');
    expect(slugify('🔥🔥')).toBe('build');
    expect(slugify('ブラッド')).toBe('build');
  });

  it('keeps digits', () => {
    expect(slugify('RL150 Moonveil')).toBe('rl150-moonveil');
  });

  it('cuts long names at a word boundary', () => {
    const slug = slugify('word '.repeat(40));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
    expect(slug).toMatch(/^(word-)*word$/);
  });

  it('never equals a tab segment', () => {
    expect(slugify('Guide')).toBe('guide-build');
    expect(slugify('comments')).toBe('comments-build');
    expect(slugify('Route')).toBe('route-build');
  });
});
