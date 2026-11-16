// A rehype step for a build's write-up (T28): ids on its section headings and a "Jump to" row of links
// to them, prepended to the document. It runs after rehype-sanitize, so it only adds what it writes
// itself; ids get sanitize's `user-content-` prefix so they can never clobber the page's own ids.

/** The parts of a hast tree this step reads and writes (structurally the `hast` types). */
interface HastText {
  type: 'text';
  value: string;
}
interface HastElement {
  type: 'element';
  tagName: string;
  properties: Record<string, unknown>;
  children: HastNode[];
}
type HastNode = HastText | HastElement | { type: string; children?: HastNode[] };
interface HastRoot {
  type: 'root';
  children: HastNode[];
}

export const HEADING_ID_PREFIX = 'user-content-';

const HEADING = /^h([1-6])$/;

const isElement = (node: HastNode): node is HastElement => node.type === 'element';

function textOf(node: HastNode): string {
  if (node.type === 'text') return (node as HastText).value;
  return 'children' in node && node.children ? node.children.map(textOf).join('') : '';
}

/** "Weapon & Shield (early)" → "weapon-shield-early"; "section" when nothing is left. */
export function slugify(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'section';
}

function headings(node: HastNode, found: HastElement[] = []): HastElement[] {
  if (isElement(node) && HEADING.test(node.tagName)) found.push(node);
  if ('children' in node && node.children)
    for (const child of node.children) headings(child, found);
  return found;
}

/**
 * The write-up's sections: the headings of the highest level used at least twice (usually h2; a
 * write-up that starts at ### gets its h3s). None when no level has two (owner, 2026-11-16).
 */
function sectionHeadings(tree: HastRoot): HastElement[] {
  const all = headings(tree as HastNode);
  const levelOf = (heading: HastElement) => Number(HEADING.exec(heading.tagName)?.[1]);
  for (let level = 1; level <= 6; level++) {
    const atLevel = all.filter((heading) => levelOf(heading) === level);
    if (atLevel.length >= 2) return atLevel;
  }
  return [];
}

/** The plugin: `rehypePlugins={[rehypeSanitize, rehypeJumpTo]}`. */
export default function rehypeJumpTo() {
  return (tree: HastRoot) => {
    const sections = sectionHeadings(tree);
    if (sections.length === 0) return;
    const used = new Map<string, number>();
    const links: HastElement[] = sections.map((heading) => {
      const text = textOf(heading).trim();
      const slug = slugify(text);
      const count = (used.get(slug) ?? 0) + 1;
      used.set(slug, count);
      const id = `${HEADING_ID_PREFIX}${count === 1 ? slug : `${slug}-${count}`}`;
      heading.properties = { ...heading.properties, id };
      return {
        type: 'element',
        tagName: 'a',
        properties: { href: `#${id}` },
        children: [{ type: 'text', value: text }],
      };
    });
    const nav: HastElement = {
      type: 'element',
      tagName: 'nav',
      properties: { ariaLabel: 'Jump to', className: ['jump-to'] },
      children: [
        {
          type: 'element',
          tagName: 'span',
          properties: { ariaHidden: 'true' },
          children: [{ type: 'text', value: 'Jump to' }],
        },
        ...links,
      ],
    };
    tree.children.unshift(nav);
  };
}
