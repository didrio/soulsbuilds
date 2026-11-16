import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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

  it('each row links to its build page', async () => {
    const { user } = renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    const link = screen.getByRole('link', { name: /Carian Moon Knight/ });
    expect(link).toHaveAttribute('href', '/build/SEEDMOON0001');
    await user.click(link);
    expect(screen.getByText('build page')).toBeInTheDocument();
  });
});
