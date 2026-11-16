import { describe, expect, it } from 'vitest';
import rehypeJumpTo, { slugify } from './rehypeJumpTo';

/** A hast node as the tests build and read it. */
interface Node {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
  value?: string;
}

const text = (value: string): Node => ({ type: 'text', value });
const el = (tagName: string, children: Node[] = []): Node => ({
  type: 'element',
  tagName,
  properties: {},
  children,
});

type Tree = Parameters<ReturnType<typeof rehypeJumpTo>>[0];

/** Runs the plugin on a root with these children and returns them. */
const run = (children: Node[]): Node[] => {
  const tree = { type: 'root', children };
  rehypeJumpTo()(tree as Tree);
  return tree.children;
};
const nth = (nodes: Node[], index: number): Node => nodes[index] ?? { type: 'missing' };

describe('slugify', () => {
  it('lowercases, drops accents and joins words with dashes', () => {
    expect(slugify('Weapon & Shield (Early)')).toBe('weapon-shield-early');
    expect(slugify('Élden Ríng')).toBe('elden-ring');
    expect(slugify('!!!')).toBe('section');
  });
});

describe('rehypeJumpTo', () => {
  it('links the h2s, with prefixed and deduplicated ids', () => {
    const nodes = run([
      el('h1', [text('Spoilers')]),
      el('h2', [text('Weapon')]),
      el('p', [text('…')]),
      el('h2', [text('Weapon')]),
      el('h2', [el('strong', [text('Stats')])]),
    ]);
    const nav = nth(nodes, 0);
    expect(nth(nodes, 2).properties?.id).toBe('user-content-weapon');
    expect(nth(nodes, 4).properties?.id).toBe('user-content-weapon-2');
    expect(nth(nodes, 5).properties?.id).toBe('user-content-stats');
    expect(nav.tagName).toBe('nav');
    expect(nav.properties?.ariaLabel).toBe('Jump to');
    const links = (nav.children ?? []).filter((child) => child.tagName === 'a');
    expect(links.map((link) => link.properties?.href)).toEqual([
      '#user-content-weapon',
      '#user-content-weapon-2',
      '#user-content-stats',
    ]);
  });

  it('uses the highest level that appears twice (a write-up starting at h3)', () => {
    const nodes = run([
      el('h2', [text('Only one')]),
      el('h3', [text('Early')]),
      el('h3', [text('Late')]),
    ]);
    expect(nth(nodes, 0).tagName).toBe('nav');
    expect(nth(nodes, 1).properties?.id).toBeUndefined();
    expect(nth(nodes, 2).properties?.id).toBe('user-content-early');
  });

  it('adds nothing when no level has two headings', () => {
    const nodes = run([el('h2', [text('One')]), el('p', [text('text')])]);
    expect(nodes).toHaveLength(2);
    expect(nth(nodes, 0).properties?.id).toBeUndefined();
  });
});
