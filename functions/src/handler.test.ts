import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { BuildDoc } from '@/lib/models';
import { emptyEquipment, makeBuild, MOONVEIL, SEPPUKU_ASH, UCHIGATANA } from '@/test/fixtures';
import { handle, type Deps } from './handler';

const INDEX = readFileSync('index.html');
const { id: _id, createdAt: _c, updatedAt: _u, ...fields } = makeBuild();
const doc = {
  ...fields,
  equipment: { ...emptyEquipment(), weapons: [MOONVEIL, null, null, null, null, null] },
};

const RADAGONS_SORESEAL = 1051;
const SAMURAI = 3007;
const bleed = {
  ...doc,
  name: 'Bleed <script>alert(1)</script>',
  description:
    '## How to play\n\nStack **bleed**. <img src=x onerror=alert(1)> [Guide](https://x.test)',
  tags: ['PvP', 'Blood & Guts'],
  startingClass: SAMURAI,
  equipment: {
    ...emptyEquipment(),
    weapons: [UCHIGATANA, null, null, null, null, null],
    weaponAffinities: ['blood', null, null, null, null, null],
    weaponSkills: [SEPPUKU_ASH, null, null, null, null, null],
    talismans: [RADAGONS_SORESEAL],
  },
};
const builds: Record<string, unknown> = {
  SEEDMOON0001: doc,
  SEEDBLEED001: bleed,
  SEEDEMPTY001: { ...doc, description: '  ' },
};

function deps(overrides: Partial<Deps> = {}): Deps {
  return {
    loadBuild: async (id) => (builds[id] as BuildDoc | undefined) ?? null,
    loadAuthor: async () => 'Ranni',
    listBuilds: async () => [
      { id: 'SEEDMOON0001', updatedAt: new Date('2026-11-01T10:00:00Z') },
      { id: 'SEEDBLEED001', updatedAt: new Date('2026-11-15T10:00:00Z') },
    ],
    fetchStatic: async (path) => (path === '/index.html' ? INDEX : new Uint8Array([1, 2, 3])),
    renderCard: async () => new Uint8Array([137, 80, 78, 71]),
    ...overrides,
  };
}

const html = (reply: { body: string | Uint8Array }) => reply.body as string;

describe('build pages', () => {
  it("serves index.html with the build's title, description, url and card image", async () => {
    const reply = await handle('/build/SEEDMOON0001', deps());
    expect(reply.status).toBe(200);
    expect(reply.headers['Content-Type']).toContain('text/html');
    expect(reply.headers['Cache-Control']).toContain('s-maxage=300');
    const body = html(reply);
    expect(body).toContain(
      '<title>Carian Moon Knight · Level 132 Elden Ring build | Souls Builds</title>',
    );
    expect(body).toContain('Level 132 Elden Ring build by Ranni.');
    expect(body).toContain('content="https://soulsbuilds.com/build/SEEDMOON0001"');
    expect(body).toContain('content="https://soulsbuilds.com/og/build/SEEDMOON0001.png"');
    expect(body).toContain('<div id="root"><style>');
  });

  it('carries the build as plain HTML inside #root', async () => {
    const body = html(await handle('/build/SEEDBLEED001', deps()));
    const root = body.slice(body.indexOf('<div id="root">'), body.indexOf('</main>'));
    expect(root).toContain('Level 132 Elden Ring build by <a href="/user/seed-ranni">Ranni</a>');
    expect(root).toContain('Starting class: Samurai');
    expect(root).toContain('Tags: PvP, Blood &amp; Guts');
    expect(root).toContain('<li>Strength: 12 (+5 from talismans)</li>');
    expect(root).toContain('<li>Intelligence: 80</li>');
    expect(root).toContain('<h2>Armaments</h2>');
    expect(root).toContain('<li>Uchigatana <span class="sb-muted">(Blood · Seppuku)</span></li>');
    expect(root).toContain('<h2>Talismans</h2>');
    expect(root).toContain("<li>Radagon's Soreseal</li>");
    // The write-up as sanitized markdown: structure kept, raw HTML dropped, links marked as user content.
    expect(root).toContain('<h2>How to play</h2>');
    expect(root).toContain('<strong>bleed</strong>');
    expect(root).toContain('<a href="https://x.test" rel="nofollow ugc noopener">Guide</a>');
    expect(root).not.toContain('onerror');
    expect(root).not.toContain('This description was automatically generated.');
  });

  it('escapes what the author wrote, in the head and in the page', async () => {
    const body = html(
      await handle('/build/SEEDBLEED001', deps({ loadAuthor: async () => '<b>Mal</b>' })),
    );
    expect(body).not.toContain('<script>alert(1)</script>');
    expect(body).toContain('<h1>Bleed &lt;script&gt;alert(1)&lt;/script&gt;</h1>');
    expect(body).toContain('&lt;b&gt;Mal&lt;/b&gt;</a>');
  });

  it('describes a build without a write-up, and says the text was generated', async () => {
    const body = html(await handle('/build/SEEDEMPTY001', deps()));
    expect(body).toMatch(/<article>\n<p>A level 132 build/);
    expect(body).toContain('This description was automatically generated.');
  });

  it('still serves the meta when the plain content fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const broken = { ...doc, stats: undefined };
    const reply = await handle(
      '/build/SEEDMOON0001',
      deps({ loadBuild: async () => broken as unknown as BuildDoc }),
    );
    expect(reply.status).toBe(200);
    expect(html(reply)).toContain(
      '<title>Carian Moon Knight · Level 132 Elden Ring build | Souls Builds</title>',
    );
    expect(html(reply)).toContain('<div id="root"></div>');
    expect(error).toHaveBeenCalledWith('page content failed', 'SEEDMOON0001', expect.anything());
  });

  it('answers every tab of the build the same way', async () => {
    for (const tab of ['description', 'guide', 'comments']) {
      const reply = await handle(`/build/SEEDMOON0001/${tab}`, deps());
      expect(html(reply)).toContain(
        '<title>Carian Moon Knight · Level 132 Elden Ring build | Souls Builds</title>',
      );
    }
  });

  it('is a 404 with noindex for a build that does not exist', async () => {
    const reply = await handle('/build/NOSUCHBUILD/guide', deps());
    expect(reply.status).toBe(404);
    expect(reply.headers['Content-Type']).toContain('text/html');
    expect(reply.headers['Cache-Control']).toContain('s-maxage=60');
    expect(html(reply)).toContain('<meta name="robots" content="noindex" />');
    expect(html(reply)).toContain('<div id="root"></div>');
  });

  it('serves the plain page for the new-build page, a non-build path and a failed read', async () => {
    const plain = new TextDecoder().decode(INDEX);
    const created = await handle('/build/new', deps());
    expect(created.status).toBe(200);
    expect(html(created)).toBe(plain);
    expect(html(await handle('/', deps()))).toBe(plain);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = deps({
      loadBuild: async () => {
        throw new Error('unavailable');
      },
    });
    const reply = await handle('/build/SEEDMOON0001', failing);
    expect(reply.status).toBe(200);
    expect(html(reply)).toBe(plain);
    expect(error).toHaveBeenCalled();
  });

  it("says so when the app's own index.html can't be fetched", async () => {
    const reply = await handle('/build/SEEDMOON0001', deps({ fetchStatic: async () => null }));
    expect(reply.status).toBe(502);
  });

  it('names an author without a profile', async () => {
    const reply = await handle('/build/SEEDMOON0001', deps({ loadAuthor: async () => '' }));
    expect(html(reply)).toContain('by a player.');
  });
});

describe('sitemap', () => {
  it('lists the home page and every build with its last edit, cached for an hour', async () => {
    const reply = await handle('/sitemap.xml', deps());
    expect(reply.status).toBe(200);
    expect(reply.headers['Content-Type']).toContain('application/xml');
    expect(reply.headers['Cache-Control']).toBe('public, max-age=3600, s-maxage=3600');
    const xml = html(reply);
    expect(xml).toContain('<url><loc>https://soulsbuilds.com/</loc></url>');
    expect(xml).toContain(
      '<url><loc>https://soulsbuilds.com/build/SEEDBLEED001</loc><lastmod>2026-11-15</lastmod></url>',
    );
    expect(xml.match(/<url>/g)).toHaveLength(3);
  });

  it('is an uncached error, never a partial list, when the builds cannot be read', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reply = await handle(
      '/sitemap.xml',
      deps({
        listBuilds: async () => {
          throw new Error('unavailable');
        },
      }),
    );
    expect(reply.status).toBe(500);
    expect(reply.headers['Cache-Control']).toBe('no-store');
    expect(error).toHaveBeenCalled();
  });
});

describe('card images', () => {
  it("renders the build's card with its picture item's icon", async () => {
    const renderCard = vi.fn(async () => new Uint8Array([137, 80, 78, 71]));
    const reply = await handle('/og/build/SEEDMOON0001.png', deps({ renderCard }));
    expect(reply.status).toBe(200);
    expect(reply.headers['Content-Type']).toBe('image/png');
    expect(reply.headers['Cache-Control']).toContain('s-maxage');
    expect(renderCard).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Carian Moon Knight',
        level: 132,
        author: 'Ranni',
        weapons: ['Moonveil'],
        icon: new Uint8Array([1, 2, 3]),
      }),
    );
  });

  it('is a 404 for a missing build, and falls back to the site image when rendering fails', async () => {
    expect((await handle('/og/build/NOSUCHBUILD.png', deps())).status).toBe(404);
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reply = await handle(
      '/og/build/SEEDMOON0001.png',
      deps({
        renderCard: async () => {
          throw new Error('no fonts');
        },
      }),
    );
    expect(reply.status).toBe(302);
    expect(reply.headers.Location).toBe('https://soulsbuilds.com/icons/og-image.png');
    expect(error).toHaveBeenCalled();
  });
});
