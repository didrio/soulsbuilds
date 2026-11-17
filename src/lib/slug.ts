// A build's name as a URL segment (T56): `/build/<id>/bleed-samurai-katana`. Pure, shared by the app and the
// link-preview function. The ID alone decides the build; the slug is for readers and search engines.

/** URL segments a build's tabs (and links from before T48) use: a slug must never equal one. */
const RESERVED = new Set(['description', 'route', 'guide', 'comments', 'discussion']);

const SLUG_MAX = 60;

/**
 * "Bleed Samurai (Katana)!" → "bleed-samurai-katana". Accents fold ("Café" → "cafe"), anything that isn't a
 * letter or digit becomes a hyphen, and a name with no Latin letters or digits ("🔥", "ブラッド") becomes
 * "build". A name equal to a tab's segment gets "-build" so `/build/<id>/guide` stays the Guide.
 */
export function slugify(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const cut =
    base.length > SLUG_MAX
      ? base.slice(0, SLUG_MAX).replace(/-[^-]*$/, '') || base.slice(0, SLUG_MAX)
      : base;
  const slug = cut.replace(/-+$/, '') || 'build';
  return RESERVED.has(slug) ? `${slug}-build` : slug;
}
