import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { emptyEquipment, makeBuild, makeProfile } from '@/test/fixtures';
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
  it('says how old the build is, with no comment count (it moved to the Comments tab)', async () => {
    const createdAt = new Date(Date.now() - 3 * 24 * 3600 * 1000);
    renderWithProviders(<BuildHeader build={makeBuild({ commentCount: 2, createdAt })} />);
    expect(await screen.findByText('3 days ago')).toHaveAttribute(
      'dateTime',
      createdAt.toISOString(),
    );
    expect(screen.queryByText(/Comments?$/)).not.toBeInTheDocument();
  });

  it('says how many play and finished the build, leaving out zeros (T36)', () => {
    const { container, unmount } = renderWithProviders(
      <BuildHeader build={makeBuild({ playerCount: 49, finishedCount: 12 })} />,
    );
    expect(container).toHaveTextContent('37 playing · 12 finished');
    unmount();
    const { container: started } = renderWithProviders(
      <BuildHeader build={makeBuild({ playerCount: 1, finishedCount: 0 })} />,
    );
    expect(started).toHaveTextContent('1 playing');
    expect(started).not.toHaveTextContent('finished');
  });

  it('says nothing about players when nobody tracks the build', () => {
    const { container } = renderWithProviders(<BuildHeader build={makeBuild()} />);
    expect(container).not.toHaveTextContent(/playing|finished/);
  });

  it('shows the main weapon as the portrait, or none without weapons', () => {
    const { container, unmount } = renderWithProviders(<BuildHeader build={makeBuild()} />);
    expect(container.querySelector('[title="Moonveil"] img')).not.toBeNull();
    unmount();
    const { container: bare } = renderWithProviders(
      <BuildHeader build={makeBuild({ equipment: emptyEquipment() })} />,
    );
    expect(bare.querySelector('img')).toBeNull();
  });

  it("shows the author's image pick while it's on the build, else the main weapon (T40)", () => {
    const equipment = { ...makeBuild().equipment, talismans: [2160] };
    const image = { kind: 'talisman', id: 2160 } as const;
    const { container, unmount } = renderWithProviders(
      <BuildHeader build={makeBuild({ equipment, image })} />,
    );
    expect(container.querySelector('[title="Lord of Blood\'s Exultation"] img')).not.toBeNull();
    unmount();
    const { container: removed } = renderWithProviders(
      <BuildHeader build={makeBuild({ image })} />,
    );
    expect(removed.querySelector('[title="Moonveil"] img')).not.toBeNull();
  });

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

  it('titles the tab like the share card, with the build page as its canonical (T51)', async () => {
    renderWithProviders(
      <BuildHeader build={makeBuild({ id: 'ABC123', name: 'Bleed Samurai', level: 150 })} />,
    );
    await screen.findByRole('heading', { name: 'Bleed Samurai' });
    expect(document.title).toBe('Bleed Samurai · Level 150 Elden Ring build | Souls Builds');
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://soulsbuilds.com/build/ABC123',
    );
    expect(
      document.head.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toMatch(/^Level 150 Elden Ring build by /);
  });
});
