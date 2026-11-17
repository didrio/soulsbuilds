// What a pasted build link shows (T37): the card's title, description and image, as pure functions so the
// Cloud Function (functions/, which bundles this file) and the tests share them. Framework-free.
import { firstParagraph } from './markdown';
import { slugify } from './slug';

/** The canonical origin: crawlers need absolute URLs, and every other domain redirects here (index.html). */
export const SITE_ORIGIN = 'https://soulsbuilds.com';

/** A build's own page, the canonical URL: `/build/<id>/<slug of the name>` (T56). Absolute. */
export const buildUrl = (id: string, name: string) => `${SITE_ORIGIN}/build/${id}/${slugify(name)}`;

const DESCRIPTION_MAX = 200;

/** The name every title ends with. */
export const SITE_NAME = 'Souls Builds';

/** "<what> | Souls Builds": every page's title (T51). */
export const pageTitle = (what: string) => `${what} | ${SITE_NAME}`;

/** A build's title, in the tab, in search results and on the share card (T51). */
export const buildTitle = (name: string, level: number) =>
  pageTitle(`${name} · Level ${level} Elden Ring build`);

/** The landing page's title and description: "Elden Ring builds" first, for what people search (T51). */
export const homeMeta = (gameName: string): ShareMeta => ({
  title: pageTitle(`${gameName} Build Planner and Builds`),
  description: `${gameName} build planner: plan a build with stats, equip load and poise, share it, and discover what the community plays. Weapons, armor, talismans and spells, with a route to get the gear.`,
});

/** The builds page's title and description (T74: the full, filterable list at /builds). */
export const buildsMeta = (gameName: string): ShareMeta => ({
  title: pageTitle(`All ${gameName} builds`),
  description: `Every ${gameName} build on ${SITE_NAME}: search by name, weapon or tag, filter by level, tags and weapon, and sort by likes, newest or most played.`,
});

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
    title: buildTitle(name, level),
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

/**
 * The SPA's `index.html` with `inner` inside `<div id="root">` (T50): what crawlers read without running
 * JavaScript. `createRoot` replaces it on the app's first render. Left alone if the div isn't found.
 */
export function injectRoot(html: string, inner: string): string {
  return html.replace('<div id="root"></div>', () => `<div id="root">${inner}</div>`);
}

/**
 * `index.html` without the home page's static intro (T69: the `<!--home-->…<!--/home-->` block inside
 * `#root`), so the link-preview function's build and hub pages, and its 404s, carry only their own content,
 * and `injectRoot` finds the empty root.
 */
export function stripHome(html: string): string {
  return html.replace(
    /<div id="root">\s*<!--home-->[\s\S]*?<!--\/home-->\s*<\/div>/,
    () => '<div id="root"></div>',
  );
}

/** `snippet` at the end of the page's head (T56: structured data). */
export function injectHead(html: string, snippet: string): string {
  return html.replace('</head>', () => `${snippet}\n  </head>`);
}

/** Keeps a page out of search results (T50: builds that don't exist). */
export function injectNoindex(html: string): string {
  return html.replace('</head>', '<meta name="robots" content="noindex" />\n  </head>');
}

export interface SitemapEntry {
  /** An absolute URL. */
  loc: string;
  /** When the page last changed. */
  lastmod?: Date;
}

/** A sitemap (sitemaps.org protocol; one file holds up to 50,000 URLs). */
export function sitemapXml(entries: readonly SitemapEntry[]): string {
  const urls = entries.map(({ loc, lastmod }) => {
    const date = lastmod ? `<lastmod>${lastmod.toISOString().slice(0, 10)}</lastmod>` : '';
    return `  <url><loc>${escapeHtml(loc)}</loc>${date}</url>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}
