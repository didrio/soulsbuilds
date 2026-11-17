import { describe, expect, it } from 'vitest';
import { slugify } from '@/lib/slug';
import {
  BUILD_TABS,
  isCanonical,
  pageKey,
  parseTab,
  splitBuildPath,
  tabPath,
  visibleTabs,
} from './tabs';

describe('parseTab', () => {
  it('reads no segment as Description and known segments as their tab', () => {
    expect(parseTab(undefined)).toBe('description');
    expect(parseTab('guide')).toBe('guide');
    expect(parseTab('comments')).toBe('comments');
  });

  it('still opens the segments links used before T48', () => {
    expect(parseTab('description')).toBe('description');
    expect(parseTab('route')).toBe('guide');
  });

  it('returns null for an unknown segment', () => {
    expect(parseTab('stats')).toBeNull();
    expect(parseTab('loadout')).toBeNull();
  });
});

describe('isCanonical', () => {
  it("is true only for the tab's own segment, so old links redirect", () => {
    expect(isCanonical(undefined, 'description')).toBe(true);
    expect(isCanonical('guide', 'guide')).toBe(true);
    expect(isCanonical('description', 'description')).toBe(false);
    expect(isCanonical('route', 'guide')).toBe(false);
  });
});

describe('tabPath', () => {
  it('puts Description at the build URL and the others under it', () => {
    expect(tabPath('abc', 'description')).toBe('/build/abc');
    expect(tabPath('abc', 'guide')).toBe('/build/abc/guide');
    expect(tabPath('new', 'comments')).toBe('/build/new/comments');
  });

  it('puts the name slug between the ID and the tab (T56)', () => {
    expect(tabPath('abc', 'description', 'Bleed Samurai')).toBe('/build/abc/bleed-samurai');
    expect(tabPath('abc', 'guide', 'Bleed Samurai')).toBe('/build/abc/bleed-samurai/guide');
  });

  it('no name slug can be mistaken for a tab', () => {
    for (const { segment } of BUILD_TABS) {
      if (segment) expect(slugify(segment)).not.toBe(segment);
    }
    expect(parseTab(slugify('Guide'))).toBeNull();
  });
});

describe('splitBuildPath', () => {
  it('reads nothing as no slug and no tab', () => {
    expect(splitBuildPath(undefined)).toEqual({ slug: null, tabSegment: undefined });
    expect(splitBuildPath('')).toEqual({ slug: null, tabSegment: undefined });
  });

  it('reads a lone tab segment (old links) as the tab, not a slug', () => {
    expect(splitBuildPath('guide')).toEqual({ slug: null, tabSegment: 'guide' });
    expect(splitBuildPath('route')).toEqual({ slug: null, tabSegment: 'route' });
  });

  it('reads a lone other segment as the slug', () => {
    expect(splitBuildPath('bleed-samurai')).toEqual({
      slug: 'bleed-samurai',
      tabSegment: undefined,
    });
  });

  it('reads slug then tab, ignoring a trailing slash', () => {
    expect(splitBuildPath('bleed-samurai/guide/')).toEqual({
      slug: 'bleed-samurai',
      tabSegment: 'guide',
    });
  });
});

describe('visibleTabs', () => {
  it('shows every tab to a viewer: Description always has something (T47)', () => {
    expect(visibleTabs({ editable: false })).toEqual(['description', 'guide', 'comments']);
  });

  it('shows only Description while editing (the build is edited in the sidebar)', () => {
    expect(visibleTabs({ editable: true })).toEqual(['description']);
  });
});

describe('pageKey', () => {
  it("treats a build's tabs as one page", () => {
    expect(pageKey('/build/abc')).toBe('/build/abc');
    expect(pageKey('/build/abc/comments')).toBe('/build/abc');
    expect(pageKey('/build/abc/guide/')).toBe('/build/abc');
    expect(pageKey('/build/abc/bleed-samurai')).toBe('/build/abc');
    expect(pageKey('/build/abc/bleed-samurai/guide')).toBe('/build/abc');
  });

  it('leaves other paths alone', () => {
    expect(pageKey('/')).toBe('/');
    expect(pageKey('/user/alice')).toBe('/user/alice');
  });
});
