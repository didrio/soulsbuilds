import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchEntry } from '@/lib/models';
import { makeBuild, MOONVEIL } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import BuildsPage from './BuildsPage';

const firebase = vi.hoisted(() => ({
  getGameStats: vi.fn(),
  listBuilds: vi.fn(),
  getBuildsByIds: vi.fn(),
  searchBuilds: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({ ...firebase, errorMessage: () => 'error' }));

const page = (builds: ReturnType<typeof makeBuild>[]) => ({ builds, nextCursor: null });

const builds = {
  A: makeBuild({ id: 'A', name: 'Bleed', level: 150, tags: ['Malenia', 'Mohg'] }),
  B: makeBuild({
    id: 'B',
    name: 'Level 100 Dark Moon Greatsword Build',
    level: 50,
    tags: ['Malenia'],
  }),
  C: makeBuild({ id: 'C', name: 'Faith', level: 150, tags: ['Godrick'] }),
};

const entry = (id: string, name: string, more: Partial<SearchEntry> = {}): SearchEntry => ({
  id,
  name,
  tags: [],
  weapons: [],
  level: 100,
  likeCount: 0,
  commentCount: 0,
  playerCount: 0,
  createdAt: 0,
  ...more,
});

const stats = {
  buildCount: 128,
  authorCount: 41,
  userCount: 60,
  tagCounts: { Malenia: 31, Mohg: 22, Godrick: 9, 'Not A Tag': 99 },
  weaponCounts: { [MOONVEIL]: 4 },
  searchIndex: [
    entry('A', 'Bleed', { weapons: [MOONVEIL] }),
    entry('B', 'Level 100 Dark Moon Greatsword Build', { likeCount: 1 }),
    entry('C', 'Faith'),
  ],
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getGameStats.mockResolvedValue(stats);
  firebase.listBuilds.mockResolvedValue(page([builds.A, builds.B, builds.C]));
  firebase.searchBuilds.mockResolvedValue(page([]));
  firebase.getBuildsByIds.mockImplementation(async (ids: string[]) =>
    ids.map((id) => builds[id as keyof typeof builds]),
  );
});

describe('BuildsPage (T74)', () => {
  it('lists the most liked builds, with the count', async () => {
    renderWithProviders(<BuildsPage />, { route: '/builds' });
    expect(await screen.findByText('Bleed')).toBeInTheDocument();
    expect(firebase.listBuilds).toHaveBeenCalledWith(expect.objectContaining({ sort: 'top' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Elden Ring builds' }),
    ).toBeInTheDocument();
    expect(screen.getByText('3 builds')).toBeInTheDocument();
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://soulsbuilds.com/builds',
    );
  });

  it('applies tag and level filters from the URL together, as removable chips', async () => {
    const { user } = renderWithProviders(<BuildsPage />, {
      route: '/builds?tag=Malenia&min=100',
    });
    expect(await screen.findByText('Bleed')).toBeInTheDocument();
    expect(screen.queryByText('Faith')).not.toBeInTheDocument();
    expect(screen.queryByText(/Dark Moon/)).not.toBeInTheDocument();
    expect(firebase.listBuilds).toHaveBeenCalledWith(expect.objectContaining({ tag: 'Malenia' }));
    await user.click(screen.getByRole('button', { name: /Level 100\+ \(remove\)/ }));
    expect(await screen.findByText(/Dark Moon/)).toBeInTheDocument();
  });

  it('sends a weapon to Firestore instead of the tag', async () => {
    renderWithProviders(<BuildsPage />, { route: '/builds?weapon=moonveil&tag=Malenia' });
    expect(await screen.findByText('Bleed')).toBeInTheDocument();
    expect(firebase.listBuilds).toHaveBeenCalledWith(
      expect.objectContaining({ weaponId: MOONVEIL, tag: undefined }),
    );
    expect(screen.getByRole('button', { name: /Moonveil \(remove\)/ })).toBeInTheDocument();
  });

  it('a level preset from the Level popover filters the list', async () => {
    const { user } = renderWithProviders(<BuildsPage />, { route: '/builds' });
    await screen.findByText('Bleed');
    await user.click(screen.getByRole('button', { name: /^Level Any/ }));
    await user.click(screen.getByRole('button', { name: /125–150/ }));
    expect(firebase.listBuilds).toHaveBeenCalledWith(
      expect.objectContaining({ minLevel: 125, maxLevel: 150 }),
    );
    expect(screen.getByRole('button', { name: /Level 125–150 \(remove\)/ })).toBeInTheDocument();
  });

  it('searches words anywhere over the index, keeping the sort, and offers the pages it names', async () => {
    const { user } = renderWithProviders(<BuildsPage />, { route: '/builds' });
    await screen.findByText('Bleed');
    await user.type(
      screen.getByRole('searchbox', { name: 'Search builds, weapons and tags' }),
      'dark moon{Enter}',
    );
    expect(await screen.findByText('Level 100 Dark Moon Greatsword Build')).toBeInTheDocument();
    expect(firebase.getBuildsByIds).toHaveBeenCalledWith(['B']);
    // Builds newer than the index: the old prefix query, on the first page.
    expect(firebase.searchBuilds).toHaveBeenCalledWith('dark moon', expect.anything());
    expect(screen.getByText('1 build')).toBeInTheDocument();
  });

  it('a search names weapon pages', async () => {
    renderWithProviders(<BuildsPage />, { route: '/builds?q=moonveil' });
    expect(await screen.findByText('Bleed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Moonveil 4 builds/ })).toHaveAttribute(
      'href',
      '/weapons/moonveil',
    );
  });

  it('without an index: the prefix search alone', async () => {
    firebase.getGameStats.mockResolvedValue(null);
    firebase.searchBuilds.mockResolvedValue(page([builds.C]));
    renderWithProviders(<BuildsPage />, { route: '/builds?q=fa' });
    expect(await screen.findByText('Faith')).toBeInTheDocument();
    expect(firebase.getBuildsByIds).toHaveBeenCalledWith([]);
  });

  it('says when nothing matches, and clears the filters', async () => {
    firebase.listBuilds.mockResolvedValue(page([]));
    const { user } = renderWithProviders(<BuildsPage />, { route: '/builds?tag=Malenia' });
    expect(await screen.findByText('No builds match these filters')).toBeInTheDocument();
    firebase.listBuilds.mockResolvedValue(page([builds.C]));
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('Faith')).toBeInTheDocument();
  });

  it('shows the top tags with counts in the Tags popover', async () => {
    const { user } = renderWithProviders(<BuildsPage />, { route: '/builds' });
    await screen.findByText('Bleed');
    await user.click(screen.getByRole('button', { name: /^Tags Any/ }));
    const malenia = screen.getByRole('button', { name: 'Malenia 31 builds' });
    expect(malenia).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('button', { name: /Not A Tag/ })).not.toBeInTheDocument();
    await user.click(malenia);
    expect(firebase.listBuilds).toHaveBeenCalledWith(expect.objectContaining({ tag: 'Malenia' }));
  });
});
