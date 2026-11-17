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

  it('links to the full list at the top and the bottom', async () => {
    renderWithProviders(<Landing />, { uid: 'alice' });
    expect(
      await screen.findByRole('link', { name: 'Search and filter all builds' }),
    ).toHaveAttribute('href', '/builds');
    expect(await screen.findByRole('link', { name: 'View all 128 builds' })).toHaveAttribute(
      'href',
      '/builds',
    );
    expect(screen.getByText(/builds by/)).toHaveTextContent('128 builds by 41 players');
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

describe('Landing intro (T69)', () => {
  it('signed out: the intro holds the h1, with one link or button per thing to do', async () => {
    renderWithProviders(<Landing />);
    expect(await screen.findByRole('region', { name: 'Trending' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Plan, share and follow Elden Ring builds' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Elden Ring builds' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start planning' })).toHaveAttribute(
      'href',
      '/build/new',
    );
    expect(screen.getByRole('link', { name: 'See an example route' })).toHaveAttribute(
      'href',
      '/build/IAumzY2DNj2NHObXD0QB/moonveil-early-game-spellblade/guide',
    );
    expect(screen.getByRole('button', { name: 'Browse builds' })).toBeInTheDocument();
  });

  it('"Browse builds" moves focus to the builds', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const { user } = renderWithProviders(<Landing />);
    await user.click(screen.getByRole('button', { name: 'Browse builds' }));
    expect(screen.getByRole('heading', { name: 'Elden Ring builds' })).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('signed in: no intro, the title keeps the h1', async () => {
    renderWithProviders(<Landing />, { uid: 'alice' });
    expect(await screen.findByRole('region', { name: 'Trending' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Elden Ring builds' }),
    ).toBeInTheDocument();
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
