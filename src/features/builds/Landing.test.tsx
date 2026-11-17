import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchEntry } from '@/lib/models';
import { makeBuild } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import Landing from './Landing';

const firebase = vi.hoisted(() => ({
  getGameStats: vi.fn(),
  listBuilds: vi.fn(),
  getBuildsByIds: vi.fn(),
  searchBuilds: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({ ...firebase, errorMessage: () => 'error' }));

const entry = (id: string, tags: string[], createdAt: number, likeCount = 0): SearchEntry => ({
  id,
  name: id,
  tags,
  weapons: [],
  level: 100,
  likeCount,
  commentCount: 0,
  playerCount: 0,
  createdAt,
});

const builds = {
  A: makeBuild({ id: 'A', name: 'Bleed', tags: ['Malenia', 'Mohg'] }),
  B: makeBuild({ id: 'B', name: 'Moon', tags: ['Malenia'] }),
  C: makeBuild({ id: 'C', name: 'Faith', tags: ['Malenia'] }),
  N: makeBuild({ id: 'N', name: 'Newest', tags: [] }),
};

const stats = {
  buildCount: 128,
  authorCount: 41,
  userCount: 60,
  tagCounts: { Malenia: 3, Mohg: 1 },
  weaponCounts: {},
  searchIndex: [
    entry('A', ['Malenia', 'Mohg'], 3, 2),
    entry('B', ['Malenia'], 2),
    entry('C', ['Malenia'], 1),
  ],
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getGameStats.mockResolvedValue(stats);
  firebase.getBuildsByIds.mockImplementation(async (ids: string[]) =>
    ids.map((id) => builds[id as keyof typeof builds]),
  );
  firebase.listBuilds.mockResolvedValue({
    builds: [builds.N, builds.A, builds.B, builds.C],
    nextCursor: null,
  });
});

describe('Landing: the home shelves (T74)', () => {
  it('leads with Trending from the daily index, read by id', async () => {
    renderWithProviders(<Landing />, { uid: 'alice' });
    const trending = await screen.findByRole('region', { name: 'Trending' });
    expect(within(trending).getByText('Bleed')).toBeInTheDocument();
    expect(firebase.getBuildsByIds).toHaveBeenCalledWith(expect.arrayContaining(['A', 'B', 'C']));
  });

  it('shows Fresh builds from Firestore and a Top shelf per used tag, each with See all', async () => {
    renderWithProviders(<Landing />, { uid: 'alice' });
    const fresh = await screen.findByRole('region', { name: 'Fresh builds' });
    expect(within(fresh).getByText('Newest')).toBeInTheDocument();
    expect(firebase.listBuilds).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'new', pageSize: 4 }),
    );
    expect(within(fresh).getByRole('link', { name: 'See all: Fresh builds' })).toHaveAttribute(
      'href',
      '/builds?sort=new',
    );
    const malenia = screen.getByRole('region', { name: 'Top Malenia builds' });
    expect(within(malenia).getByRole('link', { name: /See all/ })).toHaveAttribute(
      'href',
      '/builds?tag=Malenia',
    );
    // Mohg has one build: no shelf. Nobody plays any: no Most played.
    expect(screen.queryByRole('region', { name: 'Top Mohg builds' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Most played' })).not.toBeInTheDocument();
  });

  it('orders the page: Popular weapons, Trending, then the Top shelves and Fresh builds', async () => {
    firebase.getGameStats.mockResolvedValue({ ...stats, weaponCounts: { 9060000: 5 } }); // Moonveil
    renderWithProviders(<Landing />, { uid: 'alice' });
    await screen.findByRole('region', { name: 'Trending' });
    const order = screen
      .getAllByRole('region')
      .map((region) => region.getAttribute('aria-labelledby'))
      .filter((id) => id?.startsWith('shelf-'));
    expect(order).toEqual(['shelf-weapons', 'shelf-trending', 'shelf-tag-Malenia', 'shelf-fresh']);
  });

  it('a lone Fresh builds shelf (no Top shelves) takes the full width, with full rows (T79)', async () => {
    firebase.getGameStats.mockResolvedValue({ ...stats, tagCounts: {} });
    renderWithProviders(<Landing />, { uid: 'alice' });
    const fresh = await screen.findByRole('region', { name: 'Fresh builds' });
    expect(fresh.querySelector('[data-testid="slots"]')).not.toBeNull();
  });

  it('one way to the full list, at the top; no community count (T79)', async () => {
    renderWithProviders(<Landing />, { uid: 'alice' });
    await screen.findByRole('region', { name: 'Trending' });
    expect(screen.getByRole('link', { name: 'View all builds →' })).toHaveAttribute(
      'href',
      '/builds',
    );
    expect(screen.queryByText(/builds by/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Elden Ring builds' })).not.toBeInTheDocument();
  });

  it('without the daily index yet: the newest builds lead, no other shelves', async () => {
    firebase.getGameStats.mockResolvedValue(null);
    renderWithProviders(<Landing />, { uid: 'alice' });
    const fresh = await screen.findByRole('region', { name: 'Fresh builds' });
    expect(within(fresh).getByText('Newest')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Trending' })).not.toBeInTheDocument();
    expect(firebase.getBuildsByIds).not.toHaveBeenCalled();
  });

  it('says so when there are no builds', async () => {
    firebase.getGameStats.mockResolvedValue(null);
    firebase.listBuilds.mockResolvedValue({ builds: [], nextCursor: null });
    renderWithProviders(<Landing />, { uid: 'alice' });
    expect(await screen.findByText('No builds yet')).toBeInTheDocument();
  });
});

describe('Landing intro (T69, T79)', () => {
  beforeEach(() => window.localStorage.clear());

  it('holds the h1 and one link per thing to do, signed out', async () => {
    renderWithProviders(<Landing />);
    expect(await screen.findByRole('region', { name: 'Trending' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Plan, share and follow Elden Ring builds' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start planning' })).toHaveAttribute(
      'href',
      '/build/new',
    );
    expect(screen.getByRole('link', { name: 'See an example route' })).toHaveAttribute(
      'href',
      '/build/IAumzY2DNj2NHObXD0QB/moonveil-early-game-spellblade/guide',
    );
    expect(screen.getByRole('link', { name: 'Browse builds' })).toHaveAttribute('href', '/builds');
  });

  it('signed in too: the title and the panels', async () => {
    renderWithProviders(<Landing />, { uid: 'alice' });
    expect(await screen.findByRole('region', { name: 'Trending' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Plan, share and follow Elden Ring builds' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start planning' })).toBeInTheDocument();
  });

  it('closing the panels keeps the title, and they stay closed on the next visit', async () => {
    const { user, unmount } = renderWithProviders(<Landing />);
    await user.click(await screen.findByRole('button', { name: 'Hide these tips' }));
    expect(screen.queryByRole('link', { name: 'Start planning' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Plan, share and follow Elden Ring builds',
    );
    unmount();
    renderWithProviders(<Landing />);
    expect(await screen.findByRole('region', { name: 'Trending' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Start planning' })).not.toBeInTheDocument();
  });
});

describe('Landing head', () => {
  it('titles the page for Elden Ring builds, canonical to the home page', async () => {
    renderWithProviders(<Landing />);
    expect(await screen.findByRole('region', { name: 'Trending' })).toBeInTheDocument();
    expect(document.title).toBe('Elden Ring Build Planner and Builds | Souls Builds');
    expect(
      document.head.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toMatch(/^Elden Ring build planner/);
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://soulsbuilds.com/',
    );
  });
});
