import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBuild, makeProfile } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import Profile from './Profile';

const firebase = vi.hoisted(() => ({ getUserProfile: vi.fn(), listUserBuilds: vi.fn() }));
vi.mock('@/lib/firebase', () => ({ ...firebase, errorMessage: () => 'error' }));

const renderProfile = () =>
  renderWithProviders(<Profile />, { route: '/user/seed-ranni', path: '/user/:userId' });

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getUserProfile.mockResolvedValue(makeProfile());
});

describe('Profile header (T20)', () => {
  it('sums the builds and the likes they received', async () => {
    firebase.listUserBuilds.mockResolvedValue([
      makeBuild({ id: 'A', likeCount: 12 }),
      makeBuild({ id: 'B', likeCount: 5 }),
    ]);
    renderProfile();
    expect(await screen.findByText(/likes received/)).toHaveTextContent(
      'Joined September 2026 · 2 builds · 17 likes received',
    );
  });

  it('says "1 build" and leaves out zero likes', async () => {
    firebase.listUserBuilds.mockResolvedValue([makeBuild({ likeCount: 0 })]);
    renderProfile();
    const tagline = await screen.findByText(/Joined/);
    await vi.waitFor(() => expect(tagline).toHaveTextContent(/^Joined September 2026 · 1 build$/));
    expect(screen.queryByText(/received/)).not.toBeInTheDocument();
  });
});
