// Weapon and tag pages as plain HTML inside `#root` (T55), like a build's (page.ts): what crawlers read
// without running JavaScript: the builds, most liked first, each linking to its page. The weapon page's
// own part is ./weaponHub.ts, loaded on demand (it needs the ~400 KB acquisition data).
import { tagHubHeading } from '@/lib/hubs';
import { escapeHtml } from '@/lib/share';
import { slugify } from '@/lib/slug';
import { STYLE } from './page';

/** What a hub page lists of each build. */
export interface HubBuild {
  id: string;
  name: string;
  level: number;
  likeCount: number;
}

export const join = (parts: (string | null | false | undefined)[]) =>
  parts.filter(Boolean).join('\n');

const likes = (count: number) => `${count} ${count === 1 ? 'like' : 'likes'}`;

export function buildsHtml(heading: string, builds: readonly HubBuild[], empty: string): string {
  const items = builds.map(
    (build) =>
      `<li><a href="/build/${encodeURIComponent(build.id)}/${slugify(build.name)}">${escapeHtml(
        build.name,
      )}</a> <span class="sb-muted">Level ${build.level} · ${likes(build.likeCount)}</span></li>`,
  );
  return join([
    `<h2>${escapeHtml(heading)}</h2>`,
    items.length
      ? `<ul>\n${items.join('\n')}\n</ul>`
      : `<p class="sb-muted">${escapeHtml(empty)}</p>`,
  ]);
}

export const footer = '<p><a href="/">More Elden Ring builds on Souls Builds</a></p>';

/** `/tags/<slug>`: every build with the tag. */
export function tagHubHtml(tag: string, builds: readonly HubBuild[]): string {
  return join([
    STYLE,
    '<main class="sb-plain">',
    `<h1>${escapeHtml(tagHubHeading(tag))}</h1>`,
    `<p class="sb-muted">Elden Ring builds tagged ${escapeHtml(tag)}, most liked first.</p>`,
    buildsHtml('Community builds', builds, `No builds tagged ${tag} yet.`),
    footer,
    '</main>',
  ]);
}
