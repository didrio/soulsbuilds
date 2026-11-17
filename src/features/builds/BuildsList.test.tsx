import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeBuild } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import BuildsList from './BuildsList';

const author = { id: 'seed-ranni', displayName: 'Ranni Fan', createdAt: new Date(0) };
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 3600 * 1000);

describe('BuildsList', () => {
  it('shows each build as one link with its name, level, likes and tags', () => {
    renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    const row = screen.getByRole('link', { name: /Carian Moon Knight/ });
    expect(row).toHaveTextContent('Level 132');
    expect(row).not.toHaveTextContent('No likes yet');
    expect(row).toHaveTextContent('1 like');
    expect(row).toHaveTextContent('Rennala');
  });

  it('shows the author when profiles are given', () => {
    renderWithProviders(<BuildsList builds={[makeBuild()]} authors={{ [author.id]: author }} />);
    expect(screen.getByRole('link', { name: /by Ranni Fan/ })).toBeInTheDocument();
  });

  it('shows the comment count and how long ago the build was posted', () => {
    renderWithProviders(
      <BuildsList
        builds={[makeBuild({ commentCount: 1, createdAt: daysAgo(3) })]}
        authors={{ [author.id]: author }}
      />,
    );
    const row = screen.getByRole('link', { name: /Carian Moon Knight/ });
    expect(row).toHaveTextContent('1 comment');
    expect(row).toHaveTextContent(/by Ranni Fan·3 days ago/);
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
    const portrait = container.querySelector('li a')?.children[1];
    expect(portrait).toHaveAttribute('title', 'Moonveil');
    expect(portrait?.querySelector('img')).not.toBeNull();
  });

  it('leaves the portrait empty for a build without weapons', () => {
    const empty = makeBuild();
    empty.equipment = { ...empty.equipment, weapons: [null, null, null, null, null, null] };
    const { container } = renderWithProviders(<BuildsList builds={[empty]} />);
    expect(container.querySelector('li a')?.children[1]?.querySelector('img')).toBeNull();
  });

  it('shows builds that share a name (rows are keyed by id)', () => {
    renderWithProviders(
      <BuildsList builds={[makeBuild({ id: 'A' }), makeBuild({ id: 'B', likeCount: 2 })]} />,
    );
    expect(screen.getAllByText('Carian Moon Knight')).toHaveLength(2);
    expect(screen.getByRole('link', { name: /2 likes/ })).toBeInTheDocument();
  });

  it('shows builds without tags', () => {
    renderWithProviders(<BuildsList builds={[makeBuild({ tags: [] })]} />);
    expect(screen.queryByText('Rennala')).not.toBeInTheDocument();
  });

  describe('tags on one line', () => {
    afterEach(() => vi.restoreAllMocks());

    it('shows the tags that fit, then "+N"; the rest stay in the accessible name', () => {
      // A 100 px line and 40 px chips: one chip plus the "+N" chip fit.
      vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100);
      vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(40);
      renderWithProviders(
        <BuildsList builds={[makeBuild({ tags: ['Rennala', 'PvE', 'Moon'] })]} />,
      );
      expect(screen.getByText('+2')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Rennala PvE Moon/ })).toBeInTheDocument();
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
      const row = screen.getByRole('link', { name: /Carian Moon Knight/ });
      expect(row).toHaveTextContent('No likes yet');
      expect(row).not.toHaveTextContent(/\b0\b/);
      expect(row).not.toHaveTextContent('comment');
      expect(row).not.toHaveTextContent('playing');
    });

    it('shows comments and players when there are some', () => {
      renderWithProviders(<BuildsList builds={[makeBuild({ commentCount: 2, playerCount: 3 })]} />);
      const row = screen.getByRole('link', { name: /Carian Moon Knight/ });
      expect(row).toHaveTextContent('2 comments');
      expect(row).toHaveTextContent('3 playing');
    });

    it('compact rows (home shelves) leave out the tags and the item strip', () => {
      const { container } = renderWithProviders(<BuildsList builds={[makeBuild()]} compact />);
      expect(container.querySelector('[data-testid="slots"]')).toBeNull();
      expect(screen.queryByText('Rennala')).not.toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Lv 132/ })).toBeInTheDocument();
    });
  });

  it('each row links to its build page', async () => {
    const { user } = renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    const link = screen.getByRole('link', { name: /Carian Moon Knight/ });
    expect(link).toHaveAttribute('href', '/build/SEEDMOON0001/carian-moon-knight');
    await user.click(link);
    expect(screen.getByText('build page')).toBeInTheDocument();
  });
});
