import { describe, expect, it } from 'vitest';
import { slugify } from '@/lib/slug';
import {
  BUILD_TABS,
  hasWriteUp,
  isCanonical,
  pageKey,
  parseTab,
  splitBuildPath,
  tabLabel,
  tabPath,
  visibleTabs,
} from './tabs';

describe('tabLabel (T71)', () => {
  it('names the write-up in the discussion tab when the build has one', () => {
    expect(tabLabel('discussion', { hasWriteUp: true })).toBe('Write-up & comments');
    expect(tabLabel('discussion', { hasWriteUp: false })).toBe('Comments');
  });

  it('leaves the other tabs alone', () => {
    expect(tabLabel('equipment', { hasWriteUp: true })).toBe('Equipment');
    expect(tabLabel('guide', { hasWriteUp: true })).toBe('Guide');
  });

  it('counts only text as a write-up', () => {
    expect(hasWriteUp('How it plays')).toBe(true);
    expect(hasWriteUp('  \n ')).toBe(false);
    expect(hasWriteUp('')).toBe(false);
    expect(hasWriteUp(undefined)).toBe(false);
  });
});

describe('parseTab', () => {
  it('reads no segment as Equipment and known segments as their tab', () => {
    expect(parseTab(undefined)).toBe('equipment');
    expect(parseTab('guide')).toBe('guide');
    expect(parseTab('discussion')).toBe('discussion');
  });

  it('still opens the segments older links use', () => {
    expect(parseTab('route')).toBe('guide');
    expect(parseTab('description')).toBe('discussion');
    expect(parseTab('comments')).toBe('discussion');
  });

  it('returns null for an unknown segment', () => {
    expect(parseTab('stats')).toBeNull();
    expect(parseTab('loadout')).toBeNull();
  });
});

describe('isCanonical', () => {
  it("is true only for the tab's own segment, so old links redirect", () => {
    expect(isCanonical(undefined, 'equipment')).toBe(true);
    expect(isCanonical('guide', 'guide')).toBe(true);
    expect(isCanonical('comments', 'discussion')).toBe(false);
    expect(isCanonical('route', 'guide')).toBe(false);
  });
});

describe('tabPath', () => {
  it('puts Equipment at the build URL and the others under it', () => {
    expect(tabPath('abc', 'equipment')).toBe('/build/abc');
    expect(tabPath('abc', 'guide')).toBe('/build/abc/guide');
    expect(tabPath('new', 'discussion')).toBe('/build/new/discussion');
  });

  it('puts the name slug between the ID and the tab (T56)', () => {
    expect(tabPath('abc', 'equipment', 'Bleed Samurai')).toBe('/build/abc/bleed-samurai');
    expect(tabPath('abc', 'guide', 'Bleed Samurai')).toBe('/build/abc/bleed-samurai/guide');
  });

  it('no name slug can be mistaken for a tab', () => {
    for (const { segment } of BUILD_TABS) {
      if (segment) expect(slugify(segment)).not.toBe(segment);
    }
    expect(parseTab(slugify('Guide'))).toBeNull();
    expect(parseTab(slugify('Comments'))).toBeNull();
    expect(parseTab(slugify('Discussion'))).toBeNull();
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
  it('shows every tab to a viewer', () => {
    expect(visibleTabs({ editable: false })).toEqual(['equipment', 'guide', 'discussion']);
  });

  it('shows only Equipment while editing (the whole build is edited there)', () => {
    expect(visibleTabs({ editable: true })).toEqual(['equipment']);
  });
});

describe('pageKey', () => {
  it("treats a build's tabs as one page", () => {
    expect(pageKey('/build/abc')).toBe('/build/abc');
    expect(pageKey('/build/abc/discussion')).toBe('/build/abc');
    expect(pageKey('/build/abc/guide/')).toBe('/build/abc');
    expect(pageKey('/build/abc/bleed-samurai')).toBe('/build/abc');
    expect(pageKey('/build/abc/bleed-samurai/guide')).toBe('/build/abc');
  });

  it('leaves other paths alone', () => {
    expect(pageKey('/')).toBe('/');
    expect(pageKey('/user/alice')).toBe('/user/alice');
  });
});
