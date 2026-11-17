import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBuild } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import BuildsList from './BuildsList';

const firebase = vi.hoisted(() => ({
  listLikedBuildIds: vi.fn(),
  likeBuild: vi.fn(),
  unlikeBuild: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({ ...firebase, errorMessage: () => 'error' }));

/** What the server holds: the builds alice likes. */
let likes = new Set<string>();

beforeEach(() => {
  vi.resetAllMocks();
  likes = new Set();
  firebase.listLikedBuildIds.mockImplementation(async () => [...likes]);
  firebase.likeBuild.mockImplementation(async (id: string) => void likes.add(id));
  firebase.unlikeBuild.mockImplementation(async (id: string) => void likes.delete(id));
});

/** The row (list item) of the build with this name: the name is its link, stretched over it (T79). */
const row = (name: RegExp | string = /Carian Moon Knight/) =>
  screen.getByRole('link', { name }).closest('li')!;

const author = { id: 'seed-ranni', displayName: 'Ranni Fan', createdAt: new Date(0) };
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 3600 * 1000);

describe('BuildsList', () => {
  it('shows each build as a row: its name as the link, level, likes and tags', () => {
    renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    expect(screen.getByRole('link', { name: 'Carian Moon Knight' })).toBeInTheDocument();
    expect(row()).toHaveTextContent('Level 132');
    expect(row()).not.toHaveTextContent('No likes yet');
    expect(row()).toHaveTextContent('1 like');
    expect(row()).toHaveTextContent('Rennala');
  });

  it('colors the level by its band and names the band (T79)', () => {
    renderWithProviders(<BuildsList builds={[makeBuild({ level: 140 })]} />);
    expect(row()).toHaveTextContent('Level 140 (PvP meta)');
    expect(row().querySelector('[data-band="pvp"]')).not.toBeNull();
  });

  it('shows the author when profiles are given', () => {
    renderWithProviders(<BuildsList builds={[makeBuild()]} authors={{ [author.id]: author }} />);
    expect(row()).toHaveTextContent('by Ranni Fan');
  });

  it('shows the comment count and how long ago the build was posted', () => {
    renderWithProviders(
      <BuildsList
        builds={[makeBuild({ commentCount: 1, createdAt: daysAgo(3) })]}
        authors={{ [author.id]: author }}
      />,
    );
    expect(row()).toHaveTextContent('1 comment');
    expect(row()).toHaveTextContent(/by Ranni Fan·3 days ago/);
    expect(screen.getByText('3 days ago').tagName).toBe('TIME');
  });

  it('shows only the age when no authors are given (a profile)', () => {
    renderWithProviders(<BuildsList builds={[makeBuild({ createdAt: daysAgo(1) })]} />);
    expect(screen.getByText('yesterday')).toBeInTheDocument();
    expect(screen.queryByText(/^by/)).not.toBeInTheDocument();
  });

  it('shows the item icons, named in a tooltip, and empty slots', () => {
    const { container } = renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    expect(container.querySelector('[title="Moonveil"] img')).toHaveAttribute('alt', '');
    // 4 weapon + 4 armor cells per row (plus the divider), whatever is equipped; left hand first.
    const strip = container.querySelector('[data-testid="slots"]');
    expect(strip?.children).toHaveLength(9);
    // The fixture has Moonveil in slot 1 only: it is the one icon in the strip.
    expect(strip?.querySelectorAll('img')).toHaveLength(1);
  });

  it('shows the main weapon as the portrait', () => {
    const { container } = renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    // After the likes rail (T74).
    const portrait = container.querySelector('li')?.children[1];
    expect(portrait).toHaveAttribute('title', 'Moonveil');
    expect(portrait?.querySelector('img')).not.toBeNull();
  });

  it('leaves the portrait empty for a build without weapons', () => {
    const empty = makeBuild();
    empty.equipment = { ...empty.equipment, weapons: [null, null, null, null, null, null] };
    const { container } = renderWithProviders(<BuildsList builds={[empty]} />);
    expect(container.querySelector('li')?.children[1]?.querySelector('img')).toBeNull();
  });

  it('shows builds that share a name (rows are keyed by id)', () => {
    renderWithProviders(
      <BuildsList builds={[makeBuild({ id: 'A' }), makeBuild({ id: 'B', likeCount: 2 })]} />,
    );
    expect(screen.getAllByText('Carian Moon Knight')).toHaveLength(2);
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('2 likes');
  });

  it('shows builds without tags with a "No tags" chip (T79)', () => {
    renderWithProviders(<BuildsList builds={[makeBuild({ tags: [] })]} />);
    expect(screen.queryByText('Rennala')).not.toBeInTheDocument();
    expect(within(row()).getByText('No tags')).toBeInTheDocument();
  });

  describe('tags on one line', () => {
    afterEach(() => vi.restoreAllMocks());

    it('shows the tags that fit, then "+N"; the rest stay readable to screen readers', () => {
      // A 100 px line and 40 px chips: one chip plus the "+N" chip fit.
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(40);
      renderWithProviders(
        <BuildsList builds={[makeBuild({ tags: ['Rennala', 'PvE', 'Moon'] })]} />,
      );
      expect(screen.getByText('+2')).toBeInTheDocument();
      expect(row()).toHaveTextContent(/Rennala\s*PvE\s*Moon/);
    });

    it('shows no "+N" when they all fit', () => {
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500);
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(40);
      renderWithProviders(
        <BuildsList builds={[makeBuild({ tags: ['Rennala', 'PvE', 'Moon'] })]} />,
      );
      expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
    });
  });

  describe('the ranked feed (T74)', () => {
    it('zero is quiet: no number without likes, no zero counts in the meta line', () => {
      renderWithProviders(<BuildsList builds={[makeBuild({ likeCount: 0, commentCount: 0 })]} />);
      expect(row()).toHaveTextContent('No likes yet');
      expect(row()).not.toHaveTextContent(/\b0\b/);
      expect(row()).not.toHaveTextContent('comment');
      expect(row()).not.toHaveTextContent('playing');
    });

    it('shows comments and players when there are some', () => {
      renderWithProviders(<BuildsList builds={[makeBuild({ commentCount: 2, playerCount: 3 })]} />);
      expect(row()).toHaveTextContent('2 comments');
      expect(row()).toHaveTextContent('3 playing');
    });

    it('compact rows (home shelves) leave out the tags and the item strip', () => {
      const { container } = renderWithProviders(<BuildsList builds={[makeBuild()]} compact />);
      expect(container.querySelector('[data-testid="slots"]')).toBeNull();
      expect(screen.queryByText('Rennala')).not.toBeInTheDocument();
      expect(row()).toHaveTextContent('Lv 132');
    });
  });

  it('each row links to its build page', async () => {
    const { user } = renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    const link = screen.getByRole('link', { name: /Carian Moon Knight/ });
    expect(link).toHaveAttribute('href', '/build/SEEDMOON0001/carian-moon-knight');
    await user.click(link);
    expect(screen.getByText('build page')).toBeInTheDocument();
  });

  describe('the heart (T79)', () => {
    it('is filled once a build has any likes, outlined with none, signed in or out', () => {
      renderWithProviders(
        <BuildsList
          builds={[makeBuild({ id: 'A', likeCount: 3 }), makeBuild({ id: 'B', likeCount: 0 })]}
        />,
      );
      const [liked, quiet] = screen.getAllByRole('listitem');
      expect(liked!.querySelector('svg')).toHaveAttribute('fill', 'currentColor');
      expect(quiet!.querySelector('svg')).toHaveAttribute('fill', 'none');
    });

    it('signed out: shown, not a button', () => {
      renderWithProviders(<BuildsList builds={[makeBuild()]} />);
      expect(screen.queryByRole('button', { name: /Like/ })).not.toBeInTheDocument();
      expect(firebase.listLikedBuildIds).not.toHaveBeenCalled();
    });

    it('signed in: likes the build, with the count moving at once', async () => {
      const { user } = renderWithProviders(<BuildsList builds={[makeBuild({ likeCount: 1 })]} />, {
        uid: 'alice',
      });
      const heart = await screen.findByRole('button', { name: 'Like Carian Moon Knight, 1 like' });
      expect(heart).toHaveAttribute('aria-pressed', 'false');
      await user.click(heart);
      expect(firebase.likeBuild).toHaveBeenCalledWith('SEEDMOON0001', 'alice');
      const liked = await screen.findByRole('button', { name: 'Like Carian Moon Knight, 2 likes' });
      expect(liked).toHaveAttribute('aria-pressed', 'true');
    });

    it('signed in: a build you like shows filled, and a click unlikes it', async () => {
      likes.add('SEEDMOON0001');
      const { user } = renderWithProviders(<BuildsList builds={[makeBuild({ likeCount: 1 })]} />, {
        uid: 'alice',
      });
      const heart = screen.getByRole('button', { name: /Like Carian Moon Knight/ });
      await vi.waitFor(() => expect(heart).toHaveAttribute('aria-pressed', 'true'));
      await user.click(heart);
      expect(firebase.unlikeBuild).toHaveBeenCalledWith('SEEDMOON0001', 'alice');
      expect(
        await screen.findByRole('button', { name: 'Like Carian Moon Knight' }),
      ).toHaveAttribute('aria-pressed', 'false');
    });
  });
});
