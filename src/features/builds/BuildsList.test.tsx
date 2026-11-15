import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { makeBuild } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import BuildsList from './BuildsList';

describe('BuildsList', () => {
  it('shows each build with its likes, level and tags', () => {
    renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    expect(screen.getByText('Carian Moon Knight')).toBeInTheDocument();
    expect(screen.getByText('1 Like')).toBeInTheDocument();
    expect(screen.getByText('Level 132')).toBeInTheDocument();
    expect(screen.getByText('Rennala')).toBeInTheDocument();
  });

  it('shows builds that share a name (cards are keyed by id)', () => {
    renderWithProviders(
      <BuildsList builds={[makeBuild({ id: 'A' }), makeBuild({ id: 'B', likeCount: 2 })]} />,
    );
    expect(screen.getAllByText('Carian Moon Knight')).toHaveLength(2);
    expect(screen.getByText('2 Likes')).toBeInTheDocument();
  });

  it('shows builds without tags', () => {
    renderWithProviders(<BuildsList builds={[makeBuild({ tags: [] })]} />);
    expect(screen.queryByText('Rennala')).not.toBeInTheDocument();
  });

  it('each card links to its build page', async () => {
    const { user } = renderWithProviders(<BuildsList builds={[makeBuild()]} />);
    const link = screen.getByRole('link', { name: /Carian Moon Knight/ });
    expect(link).toHaveAttribute('href', '/build/SEEDMOON0001');
    await user.click(link);
    expect(screen.getByText('build page')).toBeInTheDocument();
  });
});
