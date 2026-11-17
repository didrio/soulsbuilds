import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { BuildDoc } from '@/lib/models';
import { emptyEquipment, makeBuild, MOONVEIL } from '@/test/fixtures';
import { handle, type Deps } from './handler';

const INDEX = readFileSync('index.html');
const { id: _id, createdAt: _c, updatedAt: _u, ...fields } = makeBuild();
const doc = {
  ...fields,
  equipment: { ...emptyEquipment(), weapons: [MOONVEIL, null, null, null, null, null] },
};

function deps(overrides: Partial<Deps> = {}): Deps {
  return {
    loadBuild: async (id) => (id === 'SEEDMOON0001' ? (doc as unknown as BuildDoc) : null),
    loadAuthor: async () => 'Ranni',
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
    expect(body).toContain('<title>Carian Moon Knight · Souls Builds</title>');
    expect(body).toContain('Level 132 Elden Ring build by Ranni.');
    expect(body).toContain('content="https://soulsbuilds.com/build/SEEDMOON0001"');
    expect(body).toContain('content="https://soulsbuilds.com/og/build/SEEDMOON0001.png"');
    expect(body).toContain('<div id="root"></div>');
  });

  it('answers every tab of the build the same way', async () => {
    for (const tab of ['description', 'guide', 'comments']) {
      const reply = await handle(`/build/SEEDMOON0001/${tab}`, deps());
      expect(html(reply)).toContain('<title>Carian Moon Knight · Souls Builds</title>');
    }
  });

  it('falls back to the plain page for a missing build, a non-build path and a failed read', async () => {
    const plain = new TextDecoder().decode(INDEX);
    expect(html(await handle('/build/NOSUCHBUILD', deps()))).toBe(plain);
    expect(html(await handle('/build/new', deps()))).toBe(plain);
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
