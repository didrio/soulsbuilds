import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import type { Build } from '@/lib/models';
import BuildsList from './BuildsList';

// Partial fixture: only the fields BuildsList reads.
const build = {
  id: 'SEEDMOON0001',
  name: 'Carian Moon Knight',
  level: '132',
  likes: 1,
  tags: ['Rennala'],
  weapons: ['Moonveil', null, null, null, null, null],
  weaponAffinities: [],
  weaponSkills: [],
} as unknown as Build;

describe('BuildsList', () => {
  it('shows each build with its likes, level and tags', () => {
    renderWithProviders(<BuildsList builds={[build]} />);
    expect(screen.getByText('Carian Moon Knight')).toBeInTheDocument();
    expect(screen.getByText('1 Like')).toBeInTheDocument();
    expect(screen.getByText('Level 132')).toBeInTheDocument();
    expect(screen.getByText('Rennala')).toBeInTheDocument();
  });

  it('skips builds without a name', () => {
    renderWithProviders(<BuildsList builds={[build, { ...build, id: 'X', name: '' }]} />);
    expect(screen.getAllByText(/Level/)).toHaveLength(1);
  });

  it('opens the build page when a build is clicked', async () => {
    const { user } = renderWithProviders(<BuildsList builds={[build]} />);
    await user.click(screen.getByText('Carian Moon Knight'));
    expect(screen.getByText('build page')).toBeInTheDocument();
  });
});
