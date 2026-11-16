import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeBuild } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import BuildsList from './BuildsList';

const author = { id: 'seed-ranni', displayName: 'Ranni Fan', createdAt: new Date(0) };

describe('BuildsList', () => {
  it('shows each build as one link with its name, level, likes and tags', () => {
    renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    const row = screen.getByRole('link', { name: /Carian Moon Knight/ });
    expect(row).toHaveTextContent('Level 132');
    expect(row).toHaveTextContent('1 like');
    expect(row).toHaveTextContent('Rennala');
  });

  it('shows the author when profiles are given', () => {
    renderWithProviders(<BuildsList builds={[makeBuild()]} authors={{ [author.id]: author }} />);
    expect(screen.getByRole('link', { name: /by Ranni Fan/ })).toBeInTheDocument();
  });

  it('shows the item icons, named in a tooltip, and empty slots', () => {
    const { container } = renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    expect(container.querySelector('[title="Moonveil"] img')).toHaveAttribute('alt', '');
    // 4 weapon + 4 armor slots per row, whatever is equipped.
    expect(container.querySelectorAll('li a > div:nth-child(2) span')).toHaveLength(8);
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

  it('each row links to its build page', async () => {
    const { user } = renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    const link = screen.getByRole('link', { name: /Carian Moon Knight/ });
    expect(link).toHaveAttribute('href', '/build/SEEDMOON0001');
    await user.click(link);
    expect(screen.getByText('build page')).toBeInTheDocument();
  });
});
