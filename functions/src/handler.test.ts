import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { BuildDoc } from '@/lib/models';
import { stripHome } from '@/lib/share';
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
      {
        id: 'SEEDMOON0001',
        name: 'Carian Moon Knight',
        updatedAt: new Date('2026-11-01T10:00:00Z'),
        tags: ['Rennala'],
        weapons: [MOONVEIL, null, null, null, null, null],
      },
      {
        id: 'SEEDBLEED001',
        name: 'Bleed Samurai',
        updatedAt: new Date('2026-11-15T10:00:00Z'),
        tags: ['PvP', 'Blood & Guts'],
        weapons: [UCHIGATANA, null, null, null, null, null],
      },
    ],
    listWeaponBuilds: async (weaponId) =>
      weaponId === MOONVEIL
        ? [{ id: 'SEEDMOON0001', name: 'Carian Moon Knight', level: 132, likeCount: 4 }]
        : [],
    listTagBuilds: async () => [],
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
    expect(body).toContain(
      'content="https://soulsbuilds.com/build/SEEDMOON0001/carian-moon-knight"',
    );
    expect(body).toContain('content="https://soulsbuilds.com/og/build/SEEDMOON0001.png"');
    expect(body).toContain('<div id="root"><style>');
  });

  it('carries the build as plain HTML inside #root', async () => {
    const body = html(await handle('/build/SEEDBLEED001', deps()));
    const root = body.slice(body.indexOf('<div id="root">'), body.indexOf('</main>'));
    expect(root).toContain('Level 132 Elden Ring build by <a href="/user/seed-ranni">Ranni</a>');
    expect(root).toContain('Starting class: Samurai');
    // T55: tags link to their pages (these two aren't in the tag list: the landing filter instead)
    expect(root).toContain(
      'Tags: <a href="/builds?tag=PvP">PvP</a>, <a href="/builds?tag=Blood%20%26%20Guts">Blood &amp; Guts</a>',
    );
    expect(root).toContain('<li>Strength: 12 (+5 from talismans)</li>');
    expect(root).toContain('<li>Intelligence: 80</li>');
    expect(root).toContain('<h2>Armaments</h2>');
    expect(root).toContain(
      '<li><a href="/weapons/uchigatana">Uchigatana</a> <span class="sb-muted">(Blood · Seppuku)</span></li>',
    );
    expect(root).toContain('<h2>Talismans</h2>');
    expect(root).toContain("<li>Radagon's Soreseal</li>");
    // The write-up as sanitized markdown: structure kept, raw HTML dropped, links marked as user content.
    expect(root).toContain('<h2>How to play</h2>');
    expect(root).toContain('<strong>bleed</strong>');
    expect(root).toContain('<a href="https://x.test" rel="nofollow ugc noopener">Guide</a>');
    expect(root).not.toContain('onerror');
  });

  it('escapes what the author wrote, in the head and in the page', async () => {
    const body = html(
      await handle('/build/SEEDBLEED001', deps({ loadAuthor: async () => '<b>Mal</b>' })),
    );
    expect(body).not.toContain('<script>alert(1)</script>');
    expect(body).toContain('<h1>Bleed &lt;script&gt;alert(1)&lt;/script&gt;</h1>');
    expect(body).toContain('&lt;b&gt;Mal&lt;/b&gt;</a>');
  });

  it('leaves the description out of a build without a write-up', async () => {
    const body = html(await handle('/build/SEEDEMPTY001', deps()));
    expect(body).toContain('<h2>Attributes</h2>');
    expect(body).not.toContain('<h2>Write-up</h2>');
    expect(body).not.toContain('<article>');
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
    for (const tab of ['guide', 'discussion', 'description', 'comments']) {
      const reply = await handle(`/build/SEEDMOON0001/${tab}`, deps());
      expect(html(reply)).toContain(
        '<title>Carian Moon Knight · Level 132 Elden Ring build | Souls Builds</title>',
      );
    }
  });

  it('answers a name slug, with or without a tab, and any stale one (T56)', async () => {
    for (const path of [
      '/build/SEEDMOON0001/carian-moon-knight',
      '/build/SEEDMOON0001/carian-moon-knight/guide',
      '/build/SEEDMOON0001/an-old-name/comments/',
    ]) {
      const body = html(await handle(path, deps()));
      expect(body).toContain('<h1>Carian Moon Knight</h1>');
      // One canonical URL however the page was reached.
      expect(body).toContain(
        '<link rel="canonical" href="https://soulsbuilds.com/build/SEEDMOON0001/carian-moon-knight" />',
      );
    }
  });

  it('describes the build as structured data (T56)', async () => {
    const withDates = {
      ...doc,
      likeCount: 7,
      commentCount: 3,
      createdAt: { toDate: () => new Date('2026-10-01T08:00:00Z') },
      updatedAt: { toDate: () => new Date('2026-11-01T09:30:00Z') },
    };
    const body = html(
      await handle(
        '/build/SEEDMOON0001',
        deps({ loadBuild: async () => withDates as unknown as BuildDoc }),
      ),
    );
    const blocks = [...body.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(
      (match) => JSON.parse(match[1]!) as Record<string, unknown>,
    );
    expect(blocks).toHaveLength(2);
    const [work, crumbs] = blocks;
    expect(work).toMatchObject({
      '@type': 'CreativeWork',
      url: 'https://soulsbuilds.com/build/SEEDMOON0001/carian-moon-knight',
      name: 'Carian Moon Knight',
      author: { '@type': 'Person', name: 'Ranni' },
      dateCreated: '2026-10-01T08:00:00.000Z',
      dateModified: '2026-11-01T09:30:00.000Z',
      about: { '@type': 'VideoGame', name: 'Elden Ring' },
      interactionStatistic: [{ userInteractionCount: 7 }, { userInteractionCount: 3 }],
    });
    expect(crumbs).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, name: 'Souls Builds' },
        { position: 2, name: 'Elden Ring builds' },
        { position: 3, name: 'Carian Moon Knight' },
      ],
    });
  });

  it('cannot be closed early by a build name that contains </script> (T56)', async () => {
    const body = html(await handle('/build/SEEDBLEED001', deps()));
    const blocks = [...body.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)];
    expect(blocks).toHaveLength(2);
    expect(JSON.parse(blocks[0]![1]!)).toMatchObject({ name: 'Bleed <script>alert(1)</script>' });
    expect(body).not.toContain('"name":"Bleed <script>');
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
    // Without the home page's static intro (T69): that's for `/`, which Hosting serves itself.
    const plain = stripHome(new TextDecoder().decode(INDEX));
    expect(plain).toContain('<div id="root"></div>');
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

describe('weapon and tag pages (T55)', () => {
  const many = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `B${i}`,
      name: `Build <${i}>`,
      level: 100 + i,
      likeCount: count - i,
    }));

  it("serves a weapon's head tags and its facts, where to find it and builds inside #root", async () => {
    const reply = await handle(
      '/weapons/moonveil',
      deps({ listWeaponBuilds: async () => many(3) }),
    );
    expect(reply.status).toBe(200);
    expect(reply.headers['Cache-Control']).toContain('s-maxage=300');
    const body = html(reply);
    expect(body).toContain('<title>Moonveil Builds (Elden Ring) | Souls Builds</title>');
    expect(body).toContain('Elden Ring builds with Moonveil, most liked first');
    expect(body).toContain('Requires: Str 12, Dex 18, Int 23.');
    expect(body).toContain(
      '<link rel="canonical" href="https://soulsbuilds.com/weapons/moonveil" />',
    );
    expect(body).not.toContain('noindex');
    const root = body.slice(body.indexOf('<div id="root">'), body.indexOf('</main>'));
    expect(root).toContain('<h1>Moonveil Builds</h1>');
    expect(root).toContain('<a href="/tags/katana">Katana</a> · Elden Ring');
    expect(root).toContain('<li>Requires: Str 12, Dex 18, Int 23</li>');
    expect(root).toContain('Defeat Magma Wyrm');
    expect(root).toContain(
      '<li><a href="/build/B0/build-0">Build &lt;0&gt;</a> <span class="sb-muted">Level 100 · 3 likes</span></li>',
    );
  });

  it('keeps a page with fewer than 3 builds out of search results', async () => {
    const one = html(await handle('/weapons/moonveil', deps()));
    expect(one).toContain('<meta name="robots" content="noindex" />');
    expect(one).toContain('Carian Moon Knight');
    const none = html(await handle('/weapons/uchigatana/', deps()));
    expect(none).toContain('noindex');
    expect(none).toContain('No builds with Uchigatana yet.');
  });

  it("serves a tag's page under its short name", async () => {
    const tagged: string[] = [];
    const body = html(
      await handle(
        '/tags/bleed',
        deps({
          listTagBuilds: async (tag) => {
            tagged.push(tag);
            return many(4);
          },
        }),
      ),
    );
    expect(tagged).toEqual(['Bleed (Hemorrhage)']);
    expect(body).toContain('<title>Bleed Builds (Elden Ring) | Souls Builds</title>');
    expect(body).toContain('<link rel="canonical" href="https://soulsbuilds.com/tags/bleed" />');
    expect(body).not.toContain('noindex');
    expect(body).toContain('<h1>Bleed Builds</h1>');
    expect(body).toContain('<a href="/build/B3/build-3">');
    const boss = html(await handle('/tags/malenia', deps()));
    expect(boss).toContain('<title>Builds for Malenia (Elden Ring) | Souls Builds</title>');
  });

  it('is a 404 with noindex for a weapon or tag that does not exist', async () => {
    for (const path of ['/weapons/not-a-weapon', '/tags/not-a-tag', '/tags/bleed-hemorrhage']) {
      const reply = await handle(path, deps());
      expect(reply.status).toBe(404);
      expect(html(reply)).toContain('<meta name="robots" content="noindex" />');
    }
  });

  it('serves the plain page when the builds cannot be read', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = deps({
      listWeaponBuilds: async () => {
        throw new Error('unavailable');
      },
      listTagBuilds: async () => {
        throw new Error('unavailable');
      },
    });
    for (const path of ['/weapons/moonveil', '/tags/malenia']) {
      const reply = await handle(path, failing);
      expect(reply.status).toBe(200);
      expect(reply.headers['Cache-Control']).toContain('s-maxage=60');
      expect(html(reply)).toContain('<div id="root"></div>');
    }
    expect(error).toHaveBeenCalled();
  });
});

describe('sitemap', () => {
  it('lists the home page, the builds page and every build with its last edit, cached for an hour', async () => {
    const reply = await handle('/sitemap.xml', deps());
    expect(reply.status).toBe(200);
    expect(reply.headers['Content-Type']).toContain('application/xml');
    expect(reply.headers['Cache-Control']).toBe('public, max-age=3600, s-maxage=3600');
    const xml = html(reply);
    expect(xml).toContain('<url><loc>https://soulsbuilds.com/</loc></url>');
    expect(xml).toContain('<url><loc>https://soulsbuilds.com/builds</loc></url>');
    expect(xml).toContain(
      '<url><loc>https://soulsbuilds.com/build/SEEDBLEED001/bleed-samurai</loc><lastmod>2026-11-15</lastmod></url>',
    );
    expect(xml.match(/<url>/g)).toHaveLength(4);
  });

  it('lists the weapon and tag pages with 3 or more builds, dated by their newest build (T55)', async () => {
    const at = (day: number) => new Date(`2026-11-${String(day).padStart(2, '0')}T10:00:00Z`);
    const build = (id: string, day: number, tags: string[], weapons: (number | null)[]) => ({
      id,
      name: id,
      updatedAt: at(day),
      tags,
      weapons: [...weapons, null, null, null, null, null].slice(0, 6),
    });
    const xml = html(
      await handle(
        '/sitemap.xml',
        deps({
          listBuilds: async () => [
            build('A', 1, ['Malenia', 'Bleed (Hemorrhage)'], [MOONVEIL, MOONVEIL]),
            build('B', 9, ['Malenia', 'Bleed (Hemorrhage)', 'Retired tag'], [null, MOONVEIL]),
            build('C', 5, ['Malenia', 'Retired tag', 'Retired tag'], [UCHIGATANA, MOONVEIL]),
            build('D', 2, ['Retired tag'], [UCHIGATANA]),
          ],
        }),
      ),
    );
    expect(xml).toContain(
      '<url><loc>https://soulsbuilds.com/weapons/moonveil</loc><lastmod>2026-11-09</lastmod></url>',
    );
    expect(xml).toContain(
      '<url><loc>https://soulsbuilds.com/tags/malenia</loc><lastmod>2026-11-09</lastmod></url>',
    );
    // two builds each: thin; a tag no longer in the list has no page
    expect(xml).not.toContain('/weapons/uchigatana');
    expect(xml).not.toContain('/tags/bleed');
    expect(xml).not.toContain('retired');
    expect(xml.match(/<url>/g)).toHaveLength(2 + 4 + 2);
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
