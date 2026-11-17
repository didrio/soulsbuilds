import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBuild } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import Landing from './Landing';

const firebase = vi.hoisted(() => ({
  getGameStats: vi.fn(),
  listBuilds: vi.fn(),
  searchBuilds: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({ ...firebase, errorMessage: () => 'error' }));

const page = (builds: ReturnType<typeof makeBuild>[]) => ({ builds, nextCursor: null });

const stats = {
  buildCount: 128,
  authorCount: 41,
  userCount: 60,
  tagCounts: { Malenia: 31, Mohg: 22, Godrick: 9, 'Not A Tag': 99 },
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getGameStats.mockResolvedValue(null);
  firebase.listBuilds.mockResolvedValue(
    page([
      makeBuild({ id: 'A', name: 'Bleed', level: 150, tags: ['Malenia', 'Mohg'] }),
      makeBuild({ id: 'B', name: 'Moon', level: 50, tags: ['Malenia'] }),
      makeBuild({ id: 'C', name: 'Faith', level: 150, tags: ['Godrick'] }),
    ]),
  );
});

describe('Landing', () => {
  it('lists the most liked builds', async () => {
    renderWithProviders(<Landing />, { uid: 'alice' });
    expect(await screen.findByText('Bleed')).toBeInTheDocument();
    expect(firebase.listBuilds).toHaveBeenCalledWith(expect.objectContaining({ sort: 'top' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Elden Ring builds' }),
    ).toBeInTheDocument();
  });

  it('applies tag and level filters from the URL together', async () => {
    renderWithProviders(<Landing />, { route: '/?tag=Malenia&min=100' });
    expect(await screen.findByText('Bleed')).toBeInTheDocument();
    expect(screen.queryByText('Moon')).not.toBeInTheDocument();
    expect(screen.queryByText('Faith')).not.toBeInTheDocument();
    expect(firebase.listBuilds).toHaveBeenCalledWith(expect.objectContaining({ tag: 'Malenia' }));
  });

  it('searches by name', async () => {
    firebase.searchBuilds.mockResolvedValue(page([makeBuild({ id: 'B', name: 'Moon' })]));
    const { user } = renderWithProviders(<Landing />);
    await user.type(screen.getByRole('searchbox', { name: 'Search builds by name' }), 'moo{Enter}');
    expect(await screen.findByText('By name while searching')).toBeInTheDocument();
    expect(firebase.searchBuilds).toHaveBeenCalledWith('moo', expect.anything());
    expect(await screen.findByText('Moon')).toBeInTheDocument();
  });

  it('says when nothing matches, and clears the filters', async () => {
    const { user } = renderWithProviders(<Landing />, { route: '/?tag=Rennala' });
    await user.click(await screen.findByRole('button', { name: 'Clear filters' }));
    expect(await screen.findByText('Faith')).toBeInTheDocument();
  });

  it('says when there are no builds at all', async () => {
    firebase.listBuilds.mockResolvedValue(page([]));
    renderWithProviders(<Landing />);
    expect(await screen.findByRole('heading', { name: 'No builds yet' })).toBeInTheDocument();
  });

  describe('community stats (T20)', () => {
    it('shows the top tags with counts and "N builds by M players"', async () => {
      firebase.getGameStats.mockResolvedValue(stats);
      renderWithProviders(<Landing />);
      const top = await screen.findByRole('group', { name: 'Top tags' });
      expect([...top.querySelectorAll('button')].map((button) => button.textContent)).toEqual([
        'Malenia31 builds',
        'Mohg22 builds',
        'Godrick9 builds',
      ]);
      expect(screen.getByText(/builds by/)).toHaveTextContent('128 builds by 41 players');
      expect(screen.getByRole('button', { name: /More tags/ })).toBeInTheDocument();
    });

    it('a top tag toggles the tag filter', async () => {
      firebase.getGameStats.mockResolvedValue(stats);
      const { user } = renderWithProviders(<Landing />);
      const mohg = await screen.findByRole('button', { name: 'Mohg 22 builds' });
      expect(mohg).toHaveAttribute('aria-pressed', 'false');
      await user.click(mohg);
      expect(mohg).toHaveAttribute('aria-pressed', 'true');
      await vi.waitFor(() =>
        expect(firebase.listBuilds).toHaveBeenLastCalledWith(
          expect.objectContaining({ tag: 'Mohg' }),
        ),
      );
      expect(await screen.findByText('Bleed')).toBeInTheDocument();
      await vi.waitFor(() => expect(screen.queryByText('Moon')).not.toBeInTheDocument());
      // Picked from the top tags, so not listed again as a removable chip.
      expect(screen.queryByRole('button', { name: 'Remove Mohg' })).not.toBeInTheDocument();
      await user.click(mohg);
      expect(mohg).toHaveAttribute('aria-pressed', 'false');
      expect(await screen.findByText('Moon')).toBeInTheDocument();
    });

    it('a picked tag outside the top tags stays a removable chip', async () => {
      firebase.getGameStats.mockResolvedValue(stats);
      renderWithProviders(<Landing />, { route: '/?tag=Malenia&tag=Rennala' });
      expect(await screen.findByRole('button', { name: /^Malenia/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: 'Remove Rennala' })).toBeInTheDocument();
    });

    it('without the stats doc: no top tags, no community line, "Add tag" as before', async () => {
      renderWithProviders(<Landing />);
      expect(await screen.findByText('Bleed')).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Top tags' })).not.toBeInTheDocument();
      expect(screen.queryByText(/builds by/)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add tag/ })).toBeInTheDocument();
    });
  });
});

describe('Landing intro (T69)', () => {
  it('signed out: the intro holds the h1, with one link or button per thing to do', async () => {
    renderWithProviders(<Landing />);
    expect(await screen.findByText('Bleed')).toBeInTheDocument();
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

  it('"Browse builds" moves focus to the list', async () => {
    Element.prototype.scrollIntoView = vi.fn();
    const { user } = renderWithProviders(<Landing />);
    await user.click(screen.getByRole('button', { name: 'Browse builds' }));
    expect(screen.getByRole('heading', { name: 'Elden Ring builds' })).toHaveFocus();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('signed in: no intro, the list keeps the h1', async () => {
    renderWithProviders(<Landing />, { uid: 'alice' });
    expect(await screen.findByText('Bleed')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Elden Ring builds' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Start planning' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Plan, share and follow/)).not.toBeInTheDocument();
  });
});

describe('Landing head', () => {
  it('titles the page for Elden Ring builds, canonical to the home page whatever the filters', async () => {
    renderWithProviders(<Landing />, { route: '/?tag=Malenia&min=100' });
    expect(await screen.findByText('Bleed')).toBeInTheDocument();
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
