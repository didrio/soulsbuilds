// A weapon's page as plain HTML (T55): its facts and where to find it (the Guide's route, so the ~400 KB
// acquisition data), then its builds. Its own chunk, imported by the handler on the first weapon page, so
// build pages and the sitemap don't load the acquisition data on a cold start.
import type { Weapon } from '@/data';
import { acquisition } from '@/data/acquisition';
import { whereToFind } from '@/features/hubs/findStops';
import { weaponFacts } from '@/features/hubs/weaponFacts';
import { tagBySlug, tagPath, tagSlug } from '@/lib/hubs';
import { escapeHtml } from '@/lib/share';
import { buildsHtml, footer, join, type HubBuild } from './hub';
import { STYLE } from './page';

/** `/weapons/<slug>`: the weapon's facts, where to find it, and the builds using it. */
export function weaponHubHtml(weapon: Weapon, builds: readonly HubBuild[]): string {
  const facts = weaponFacts(weapon);
  // The weapon type's tag page, when there is one ("Katana" → /tags/katana).
  const typeTag = tagBySlug(tagSlug(facts.kind));
  const kind = typeTag
    ? `<a href="${tagPath(typeTag)}">${escapeHtml(facts.kind)}</a>`
    : escapeHtml(facts.kind);
  const rows = [
    facts.subline ? `<li>Skill: ${escapeHtml(facts.subline)}</li>` : null,
    ...facts.rows.map(
      (row) =>
        `<li>${escapeHtml(row.label)}: ${escapeHtml(row.parts.map((part) => part.text).join(', '))}</li>`,
    ),
  ];
  const stops = whereToFind(weapon.id, acquisition).map((stop) => {
    const where = stop.place ? `${stop.area}, ${stop.place}` : stop.area;
    return `<li>${escapeHtml(stop.how)} <span class="sb-muted">(${escapeHtml(where)})</span></li>`;
  });
  return join([
    STYLE,
    '<main class="sb-plain">',
    `<h1>${escapeHtml(weapon.name)} Builds</h1>`,
    `<p class="sb-muted">${kind} · Elden Ring</p>`,
    '<h2>At a glance</h2>',
    `<ul>\n${join(rows)}\n</ul>`,
    '<h2>Where to find it</h2>',
    stops.length
      ? `<ol>\n${stops.join('\n')}\n</ol>`
      : '<p class="sb-muted">Where it comes from isn’t in our data yet.</p>',
    buildsHtml(`Builds with ${weapon.name}`, builds, `No builds with ${weapon.name} yet.`),
    footer,
    '</main>',
  ]);
}
