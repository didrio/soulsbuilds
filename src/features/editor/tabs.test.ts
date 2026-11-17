import { describe, expect, it } from 'vitest';
import { pageKey, parseTab, tabPath, visibleTabs } from './tabs';

describe('parseTab', () => {
  it('reads no segment as Loadout and known segments as their tab', () => {
    expect(parseTab(undefined)).toBe('loadout');
    expect(parseTab('description')).toBe('description');
    expect(parseTab('route')).toBe('route');
    expect(parseTab('comments')).toBe('comments');
  });

  it('returns null for an unknown segment', () => {
    expect(parseTab('stats')).toBeNull();
    expect(parseTab('loadout')).toBeNull();
  });
});

describe('tabPath', () => {
  it('puts Loadout at the build URL and the others under it', () => {
    expect(tabPath('abc', 'loadout')).toBe('/build/abc');
    expect(tabPath('abc', 'route')).toBe('/build/abc/route');
    expect(tabPath('new', 'description')).toBe('/build/new/description');
  });
});

describe('visibleTabs', () => {
  it('shows every tab to a viewer: Description always has something (T47)', () => {
    expect(visibleTabs({ editable: false })).toEqual([
      'loadout',
      'description',
      'route',
      'comments',
    ]);
  });

  it('shows only Loadout and Description while editing', () => {
    expect(visibleTabs({ editable: true })).toEqual(['loadout', 'description']);
  });
});

describe('pageKey', () => {
  it("treats a build's tabs as one page", () => {
    expect(pageKey('/build/abc')).toBe('/build/abc');
    expect(pageKey('/build/abc/comments')).toBe('/build/abc');
    expect(pageKey('/build/abc/route/')).toBe('/build/abc');
  });

  it('leaves other paths alone', () => {
    expect(pageKey('/')).toBe('/');
    expect(pageKey('/user/alice')).toBe('/user/alice');
  });
});
