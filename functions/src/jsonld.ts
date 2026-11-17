// Structured data for a build's page (T56): what search engines read to know the page is one person's Elden
// Ring build, how it was received, and where it sits on the site. JSON-LD in the head, next to the meta tags.
import type { BuildDoc } from '@/lib/models';
import { buildUrl, SITE_NAME, SITE_ORIGIN } from '@/lib/share';

const GAME_NAME = 'Elden Ring';

/** A Firestore Timestamp (or anything with `toDate`) as an ISO date, or nothing. */
function isoDate(value: unknown): string | undefined {
  const date = (value as { toDate?: () => Date } | undefined)?.toDate?.();
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
}

/** A `<script>` tag that can't be closed early by anything a user wrote ("</script>" in a name). */
const scriptTag = (data: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

/** The build as a `CreativeWork` and its place on the site as a `BreadcrumbList`. */
export function buildJsonLd(build: BuildDoc, author: string, id: string): string {
  const url = buildUrl(id, build.name);
  const work = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': url,
    url,
    name: build.name,
    author: { '@type': 'Person', name: author, url: `${SITE_ORIGIN}/user/${build.ownerId}` },
    dateCreated: isoDate(build.createdAt),
    dateModified: isoDate(build.updatedAt),
    about: { '@type': 'VideoGame', name: GAME_NAME },
    keywords: build.tags.length ? build.tags.join(', ') : undefined,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: build.likeCount,
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: build.commentCount,
      },
    ],
  };
  const crumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: SITE_NAME, item: `${SITE_ORIGIN}/` },
      { name: `${GAME_NAME} builds`, item: `${SITE_ORIGIN}/` },
      { name: build.name, item: url },
    ].map((entry, index) => ({ '@type': 'ListItem', position: index + 1, ...entry })),
  };
  return `${scriptTag(work)}\n  ${scriptTag(crumbs)}`;
}
