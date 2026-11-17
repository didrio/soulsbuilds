import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildTitle,
  escapeHtml,
  homeMeta,
  injectMeta,
  injectNoindex,
  injectRoot,
  shareMeta,
  sitemapXml,
  stripHome,
  truncate,
} from './share';

const input = {
  name: 'Bleed Samurai',
  level: 150,
  author: 'Anne',
  description: '',
  weapons: ['Uchigatana', 'Rivers of Blood', 'Moonveil', 'Nagakiba'],
};

describe('shareMeta', () => {
  it('says the level and author, then the weapons when there is no write-up', () => {
    expect(shareMeta(input)).toEqual({
      title: 'Bleed Samurai · Level 150 Elden Ring build | Souls Builds',
      description:
        'Level 150 Elden Ring build by Anne. Wields Uchigatana, Rivers of Blood, Moonveil.',
    });
  });

  it("uses the write-up's first paragraph as plain text", () => {
    const { description } = shareMeta({
      ...input,
      description: '# Bleed\n\nStack **bleed** with [Rivers of Blood](https://x.test).\n\nMore.',
    });
    expect(description).toBe(
      'Level 150 Elden Ring build by Anne. Stack bleed with Rivers of Blood.',
    );
  });

  it('copes with no weapons and no write-up, and stays short', () => {
    expect(shareMeta({ ...input, weapons: [] }).description).toBe(
      'Level 150 Elden Ring build by Anne.',
    );
    expect(
      shareMeta({ ...input, description: 'word '.repeat(100) }).description.length,
    ).toBeLessThanOrEqual(200);
  });
});

describe('truncate', () => {
  it('cuts at a word with an ellipsis, and leaves short text alone', () => {
    expect(truncate('short', 20)).toBe('short');
    expect(truncate('one two three four five six', 15)).toBe('one two three…');
  });
});

describe('injectMeta', () => {
  const html = stripHome(readFileSync('index.html', 'utf8'));
  const meta = {
    title: 'A "quoted" <build> · Souls Builds',
    description: 'Level 1 & more.',
    url: 'https://soulsbuilds.com/build/ABC',
    image: 'https://soulsbuilds.com/og/build/ABC.png',
  };

  it("replaces the page's own tags, escaped", () => {
    const out = injectMeta(html, meta);
    expect(out).toContain('<title>A &quot;quoted&quot; &lt;build&gt; · Souls Builds</title>');
    expect(out).toContain(
      '<meta property="og:title" content="A &quot;quoted&quot; &lt;build&gt; · Souls Builds" />',
    );
    expect(out).toContain('<meta name="description" content="Level 1 &amp; more." />');
    expect(out).toContain('<meta property="og:description" content="Level 1 &amp; more." />');
    expect(out).toContain('<meta property="og:url" content="https://soulsbuilds.com/build/ABC" />');
    expect(out).toContain(
      '<meta property="og:image" content="https://soulsbuilds.com/og/build/ABC.png" />',
    );
    expect(out).toContain('<link rel="canonical" href="https://soulsbuilds.com/build/ABC" />');
    // Nothing of the site-level preview is left, and each tag appears once.
    expect(out).not.toContain('icons/og-image.png');
    expect(out.match(/og:title/g)).toHaveLength(1);
    expect(out.match(/<title>/g)).toHaveLength(1);
  });

  it('keeps the rest of the page (scripts, other tags)', () => {
    const out = injectMeta(html, meta);
    expect(out).toContain('<div id="root"></div>');
    expect(out).toContain('property="og:image:width"');
  });
});

describe('escapeHtml', () => {
  it('escapes the characters that break an attribute', () => {
    expect(escapeHtml(`<a href="x">&</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});

describe('stripHome (T69)', () => {
  const index = readFileSync('index.html', 'utf8');

  it("takes the home page's static intro out of the root, leaving it empty", () => {
    expect(index).not.toContain('<div id="root"></div>');
    const html = stripHome(index);
    expect(html).toContain('<div id="root"></div>');
    expect(html).not.toContain('sb-home');
    expect(html).not.toContain('Plan, share and follow');
    // Only the home block goes: the head, the redirect script and the app's script stay.
    expect(html).toContain('<title>');
    expect(html).toContain('soulsbuilds.web.app');
    expect(html).toContain('src="/src/main.tsx"');
  });
});

describe('injectRoot', () => {
  const index = stripHome(readFileSync('index.html', 'utf8'));

  it("puts the content inside the app's root div, once", () => {
    const html = injectRoot(index, '<main>$& Bleed</main>');
    expect(html).toContain('<div id="root"><main>$& Bleed</main></div>');
    expect(html.match(/id="root"/g)).toHaveLength(1);
  });

  it('leaves a page without an empty root div alone', () => {
    expect(injectRoot('<div id="app"></div>', '<p>x</p>')).toBe('<div id="app"></div>');
  });
});

describe('injectNoindex', () => {
  it('adds the robots tag to the head', () => {
    const html = injectNoindex(readFileSync('index.html', 'utf8'));
    expect(html).toMatch(/<meta name="robots" content="noindex" \/>\s*<\/head>/);
  });
});

describe('sitemapXml', () => {
  it('lists each URL with its date, escaped', () => {
    const xml = sitemapXml([
      { loc: 'https://soulsbuilds.com/' },
      { loc: 'https://soulsbuilds.com/build/A?x=1&y=2', lastmod: new Date('2026-11-16T23:59:00Z') },
    ]);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns=/);
    expect(xml).toContain('<url><loc>https://soulsbuilds.com/</loc></url>');
    expect(xml).toContain(
      '<url><loc>https://soulsbuilds.com/build/A?x=1&amp;y=2</loc><lastmod>2026-11-16</lastmod></url>',
    );
    expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
  });
});

describe('titles', () => {
  it('names the build with its level and game, and the site last', () => {
    expect(buildTitle('Bleed Samurai', 150)).toBe(
      'Bleed Samurai · Level 150 Elden Ring build | Souls Builds',
    );
  });

  it('leads the home page with the game and the build planner', () => {
    const home = homeMeta('Elden Ring');
    expect(home.title).toBe('Elden Ring Build Planner and Builds | Souls Builds');
    expect(home.description.startsWith('Elden Ring build planner')).toBe(true);
    expect(home.description).toContain('equip load and poise');
  });
});
