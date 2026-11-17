// The build as plain HTML inside the page's `#root` (T50), so search engines and AI crawlers can read it
// without running JavaScript. The same content the app shows: it goes through the editor's own store,
// selectors, gear groups and generated description, and `createRoot` replaces it on the first render.
// Users see it until the bundle runs, so a small stylesheet in the site's colors makes that read as a
// plain page.
import { makeStore } from '@/app/store';
import { getStartingClass } from '@/data';
import { describeBuild, GENERATED_NOTE, STAT_NAMES } from '@/features/editor/describe';
import { gearGroups, slotWeaponDetails } from '@/features/editor/gear';
import { itemSubline } from '@/features/editor/itemDetails';
import { loadBuild } from '@/features/editor/store/build';
import {
  selectDescriptionFacts,
  selectGearState,
  selectStatBonuses,
} from '@/features/editor/store/derived';
import { selectStats } from '@/features/editor/store/selectors';
import { STAT_KEYS } from '@/lib/buildMath';
import type { BuildDoc } from '@/lib/models';
import { escapeHtml } from '@/lib/share';
import { COLOR_BG, COLOR_LINE, COLOR_TEXT, COLOR_TEXT_MUTED } from '@/theme/colors';
import { FONT_DISPLAY, FONT_UI } from '@/theme/fonts';
import { markdownToHtml } from './markdown';

export interface PageAuthor {
  uid: string;
  /** The display name, or the fallback for an author without a profile. */
  name: string;
}

// Body rules too: before the app's global styles load, the browser's white margin would frame the page
// (and index.html's <noscript> line would be black on the dark background).
const STYLE = `<style>
body{margin:0;background:${COLOR_BG}}
noscript{display:block;padding:8px 16px;color:${COLOR_TEXT_MUTED};font:14px ${FONT_UI}}
.sb-plain{box-sizing:border-box;max-width:760px;margin:0 auto;padding:32px 16px 64px;color:${COLOR_TEXT};font:16px/1.6 ${FONT_UI}}
.sb-plain h1,.sb-plain h2{font-family:${FONT_DISPLAY};font-weight:600;line-height:1.2;margin:1.4em 0 .4em}
.sb-plain h1{font-size:32px;margin-top:0}
.sb-plain h2{font-size:22px;border-bottom:1px solid ${COLOR_LINE};padding-bottom:4px}
.sb-plain a{color:inherit}
.sb-plain .sb-muted{color:${COLOR_TEXT_MUTED}}
.sb-plain ul{padding-left:20px}
.sb-plain article{font-family:${FONT_DISPLAY};font-size:18px}
</style>`;

const join = (parts: (string | null | false | undefined)[]) => parts.filter(Boolean).join('\n');

/** The build's content as HTML for `#root`. Everything the user wrote is escaped or sanitized. */
export function buildContentHtml(build: BuildDoc, author: PageAuthor): string {
  const store = makeStore();
  store.dispatch(
    loadBuild({
      stats: build.stats,
      startingClass: build.startingClass ?? null,
      equipment: build.equipment,
    }),
  );
  const state = store.getState();
  const stats = selectStats(state);
  const bonuses = selectStatBonuses(state);
  const startingClass = getStartingClass(build.startingClass ?? null);

  const byline = `Level ${build.level} Elden Ring build by <a href="/user/${encodeURIComponent(
    author.uid,
  )}">${escapeHtml(author.name)}</a>`;
  const tags = build.tags.length
    ? `<p class="sb-muted">Tags: ${build.tags.map(escapeHtml).join(', ')}</p>`
    : null;

  const attributes = STAT_KEYS.map((key) => {
    const bonus = bonuses[key] ? ` (+${bonuses[key]} from talismans)` : '';
    return `<li>${STAT_NAMES[key]}: ${stats[key]}${bonus}</li>`;
  });

  const gear = gearGroups(selectGearState(state), false).map((group) => {
    const items = group.entries.flatMap((entry) => {
      if (!entry.item) return [];
      const detail = itemSubline(entry.item, slotWeaponDetails(entry));
      const sub = detail ? ` <span class="sb-muted">(${escapeHtml(detail)})</span>` : '';
      return [`<li>${escapeHtml(entry.item.name)}${sub}</li>`];
    });
    return `<h2>${escapeHtml(group.title)}</h2>\n<ul>\n${items.join('\n')}\n</ul>`;
  });

  const generated = !build.description.trim();
  const writeUp = markdownToHtml(
    generated ? describeBuild(selectDescriptionFacts(state)) : build.description,
  );

  return join([
    STYLE,
    '<main class="sb-plain">',
    `<h1>${escapeHtml(build.name)}</h1>`,
    `<p class="sb-muted">${byline}</p>`,
    startingClass ? `<p>Starting class: ${escapeHtml(startingClass.name)}</p>` : null,
    tags,
    '<h2>Attributes</h2>',
    `<ul>\n${attributes.join('\n')}\n</ul>`,
    ...gear,
    '<h2>Description</h2>',
    `<article>\n${writeUp}\n</article>`,
    generated ? `<p class="sb-muted">${GENERATED_NOTE}</p>` : null,
    '<p><a href="/">More Elden Ring builds on Souls Builds</a></p>',
    '</main>',
  ]);
}
