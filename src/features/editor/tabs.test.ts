import { describe, expect, it } from 'vitest';
import { isCanonical, pageKey, parseTab, tabPath, visibleTabs } from './tabs';

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
  });

  it('leaves other paths alone', () => {
    expect(pageKey('/')).toBe('/');
    expect(pageKey('/user/alice')).toBe('/user/alice');
  });
});
