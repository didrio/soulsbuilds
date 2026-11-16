import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeComment, makeProfile } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import CommentsSection from './CommentsSection';

const firebase = vi.hoisted(() => ({ getUserProfile: vi.fn(), listComments: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ ...firebase, errorMessage: () => 'error' }));

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getUserProfile.mockImplementation((id: string) =>
    Promise.resolve(makeProfile({ id, displayName: id === 'seed-ranni' ? 'Ranni Fan' : id })),
  );
  firebase.listComments.mockResolvedValue([]);
});

describe('CommentsSection', () => {
  it('with no comments, asks visitors to tell the author how it went', async () => {
    renderWithProviders(<CommentsSection buildId="B1" ownerId="seed-ranni" />, { uid: 'alice' });
    expect(await screen.findByText(/Tried it\? Tell/)).toHaveTextContent(
      'No comments yet. Tried it? Tell Ranni Fan how it went.',
    );
  });

  it('the build’s owner just sees "No comments yet."', async () => {
    renderWithProviders(<CommentsSection buildId="B1" ownerId="seed-ranni" />, {
      uid: 'seed-ranni',
    });
    expect(await screen.findByText('No comments yet.')).toBeInTheDocument();
    expect(screen.queryByText(/Tried it/)).not.toBeInTheDocument();
  });

  it('lists comments with their count in the heading', async () => {
    firebase.listComments.mockResolvedValue([makeComment()]);
    renderWithProviders(<CommentsSection buildId="B1" ownerId="seed-ranni" />);
    expect(await screen.findByText('Nice build!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comments · 1' })).toBeInTheDocument();
    expect(screen.queryByText(/No comments yet/)).not.toBeInTheDocument();
  });
});
