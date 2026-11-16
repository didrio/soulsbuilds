import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBuild, makeProfile } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import MoreByAuthor from './MoreByAuthor';

const firebase = vi.hoisted(() => ({ getUserProfile: vi.fn(), listUserBuilds: vi.fn() }));
vi.mock('@/lib/firebase', () => firebase);

const build = (id: string, likeCount: number) => makeBuild({ id, name: `Build ${id}`, likeCount });

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getUserProfile.mockResolvedValue(makeProfile());
});

describe('MoreByAuthor', () => {
  it('shows up to three of the author’s other builds, most liked first', async () => {
    firebase.listUserBuilds.mockResolvedValue([
      build('THIS', 50),
      build('A', 1),
      build('B', 7),
      build('C', 3),
      build('D', 0),
    ]);
    renderWithProviders(<MoreByAuthor buildId="THIS" ownerId="seed-ranni" />);
    expect(await screen.findByRole('heading', { name: 'More by Ranni Fan' })).toBeInTheDocument();
    const cards = screen.getAllByRole('link', { name: /^Build / });
    expect(cards.map((card) => card.getAttribute('href'))).toEqual([
      '/build/B',
      '/build/C',
      '/build/A',
    ]);
    expect(screen.getByRole('link', { name: 'All builds by Ranni Fan →' })).toHaveAttribute(
      'href',
      '/user/seed-ranni',
    );
  });

  it('has no "All builds" link when every other build is shown', async () => {
    firebase.listUserBuilds.mockResolvedValue([build('THIS', 0), build('A', 1)]);
    renderWithProviders(<MoreByAuthor buildId="THIS" ownerId="seed-ranni" />);
    expect(await screen.findByRole('link', { name: /Build A/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /All builds/ })).not.toBeInTheDocument();
  });

  it('shows nothing when the author has no other builds', async () => {
    firebase.listUserBuilds.mockResolvedValue([build('THIS', 0)]);
    const { container } = renderWithProviders(<MoreByAuthor buildId="THIS" ownerId="seed-ranni" />);
    await vi.waitFor(() => expect(firebase.listUserBuilds).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(container).toBeEmptyDOMElement();
  });
});
