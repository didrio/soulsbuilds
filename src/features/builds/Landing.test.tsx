import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBuild } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import Landing from './Landing';

const firebase = vi.hoisted(() => ({ listBuilds: vi.fn(), searchBuilds: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ ...firebase, errorMessage: () => 'error' }));

const page = (builds: ReturnType<typeof makeBuild>[]) => ({ builds, nextCursor: null });

beforeEach(() => {
  vi.resetAllMocks();
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
    renderWithProviders(<Landing />);
    expect(await screen.findByText('Bleed')).toBeInTheDocument();
    expect(firebase.listBuilds).toHaveBeenCalledWith(expect.objectContaining({ sort: 'top' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Elden Ring Builds' }),
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
});
