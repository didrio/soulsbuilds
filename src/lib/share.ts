// What a pasted build link shows (T37): the card's title, description and image, as pure functions so the
// Cloud Function (functions/, which bundles this file) and the tests share them. Framework-free.
import { firstParagraph } from './markdown';

/** The canonical origin: crawlers need absolute URLs, and every other domain redirects here (index.html). */
export const SITE_ORIGIN = 'https://soulsbuilds.com';

const DESCRIPTION_MAX = 200;

export interface ShareInput {
  name: string;
  level: number;
  author: string;
  /** The build's markdown write-up ('' when the author hasn't written one). */
  description: string;
  /** Names of the build's weapons, main weapon first. */
  weapons: string[];
}

export interface ShareMeta {
  title: string;
  description: string;
}

/** Cuts at a word boundary, with an ellipsis. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.-]+$/, '')}…`;
}

/** "Level 150 build by Anne. <the write-up's first paragraph, or the weapons>". */
export function shareMeta(input: ShareInput): ShareMeta {
  const { name, level, author, description, weapons } = input;
  const lead = `Level ${level} Elden Ring build by ${author}.`;
  const prose = firstParagraph(description);
  const detail = prose || (weapons.length ? `Wields ${weapons.slice(0, 3).join(', ')}.` : '');
  return {
    title: `${name} · Souls Builds`,
    description: truncate(detail ? `${lead} ${detail}` : lead, DESCRIPTION_MAX),
  };
}

export const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface PageMeta extends ShareMeta {
  url: string;
  image: string;
}

/** The tag matching `attr="key"` in the page's head (any attribute order or line breaks). */
const metaTag = (attr: 'name' | 'property', key: string) =>
  new RegExp(`<meta\\s+${attr}="${key}"[^>]*>`);

/**
 * The SPA's `index.html` with this build's title, description and card image. Tags that aren't found
 * are left alone, so a changed `index.html` degrades to the site-level preview rather than breaking.
 */
export function injectMeta(html: string, meta: PageMeta): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(meta.url);
  const image = escapeHtml(meta.image);
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(metaTag('name', 'description'), `<meta name="description" content="${description}" />`)
    .replace(metaTag('property', 'og:title'), `<meta property="og:title" content="${title}" />`)
    .replace(
      metaTag('property', 'og:description'),
      `<meta property="og:description" content="${description}" />`,
    )
    .replace(metaTag('property', 'og:url'), `<meta property="og:url" content="${url}" />`)
    .replace(metaTag('property', 'og:image'), `<meta property="og:image" content="${image}" />`)
    .replace('</head>', `<link rel="canonical" href="${url}" />\n  </head>`);
}
