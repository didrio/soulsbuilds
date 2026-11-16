import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBuild, makeProfile } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import BuildHeader from './BuildHeader';

const firebase = vi.hoisted(() => ({
  getUserProfile: vi.fn(),
  hasLiked: vi.fn(),
  likeBuild: vi.fn(),
  unlikeBuild: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  errorMessage: () => 'Network error. Check your connection and try again.',
}));

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getUserProfile.mockResolvedValue(makeProfile());
  firebase.hasLiked.mockResolvedValue(false);
});

describe('BuildHeader', () => {
  it('signed out: shows the count, not a button', async () => {
    renderWithProviders(<BuildHeader build={makeBuild({ likeCount: 3 })} />);
    expect(await screen.findByText('3 Likes')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('a failed like rolls back, shows why, and the button works again', async () => {
    firebase.likeBuild.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined);
    const { user } = renderWithProviders(<BuildHeader build={makeBuild({ likeCount: 3 })} />, {
      uid: 'alice',
    });
    const button = await screen.findByRole('button', { name: /3 Likes/ });
    await vi.waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    expect(await screen.findByRole('alert')).toHaveTextContent('Network error');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveTextContent('3 Likes');
    await vi.waitFor(() => expect(button).toBeEnabled());
    await user.click(button);
    await vi.waitFor(() => expect(firebase.likeBuild).toHaveBeenCalledTimes(2));
  });

  it('shows the author and level, and links each tag to the builds with it', async () => {
    renderWithProviders(<BuildHeader build={makeBuild({ tags: ['Rennala', 'Comet Azur'] })} />);
    expect(await screen.findByRole('link', { name: 'Ranni Fan' })).toBeInTheDocument();
    expect(screen.getByText('132')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Comet Azur' })).toHaveAttribute(
      'href',
      '/?tag=Comet%20Azur',
    );
  });
});
