import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBuild, makeProfile } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import Profile from './Profile';

const firebase = vi.hoisted(() => ({
  getUserProfile: vi.fn(),
  listUserBuilds: vi.fn(),
  listTracking: vi.fn(),
  getBuild: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({ ...firebase, errorMessage: () => 'error' }));

const renderProfile = (uid: string | null = null) =>
  renderWithProviders(<Profile />, { route: '/user/seed-ranni', path: '/user/:userId', uid });

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

describe('Profile hero (T31)', () => {
  beforeEach(() => firebase.listUserBuilds.mockResolvedValue([]));

  it('shows the name, and no settings to visitors', async () => {
    renderProfile('someone-else');
    expect(await screen.findByRole('heading', { level: 1, name: 'Ranni Fan' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Account settings' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Change name|Delete account/ })).toBeNull();
  });

  it('links the owner to their account settings, which aren’t on the page', async () => {
    renderProfile('seed-ranni');
    expect(await screen.findByRole('link', { name: 'Account settings' })).toHaveAttribute(
      'href',
      '/account',
    );
    expect(screen.queryByRole('button', { name: /Change name|Delete account/ })).toBeNull();
    expect(screen.queryByText(/Verify your email/)).not.toBeInTheDocument();
  });

  it('offers the owner to finish a deletion that stopped halfway', async () => {
    firebase.getUserProfile.mockResolvedValue(null);
    renderProfile('seed-ranni');
    expect(
      await screen.findByRole('button', { name: 'Finish deleting your account' }),
    ).toBeInTheDocument();
  });
});

describe('Playing and Completed (T36)', () => {
  const BASE = { vigor: 10, mind: 10, end: 10, str: 10, dex: 10, int: 10, fai: 10, arc: 10 };
  const playing = makeBuild({ id: 'PLAY', name: 'Moon Knight', ownerId: 'seed-ranni' });
  const done = makeBuild({ id: 'DONE', name: 'Hammer Prince' });
  const state = (overrides = {}) => ({
    collected: [],
    seen: [],
    marked: [],
    stats: BASE,
    startedAt: new Date('2026-11-04T12:00:00Z'),
    completedAt: null,
    ...overrides,
  });

  beforeEach(() => {
    firebase.listUserBuilds.mockResolvedValue([]);
    firebase.listTracking.mockResolvedValue([
      { buildId: 'PLAY', state: state() },
      { buildId: 'DONE', state: state({ completedAt: new Date('2026-10-20T12:00:00Z') }) },
      { buildId: 'GONE', state: state() },
    ]);
    firebase.getBuild.mockImplementation(async (id: string) =>
      id === 'PLAY' ? playing : id === 'DONE' ? done : null,
    );
  });

  it('are the owner’s only: visitors see Builds and Liked, and nothing is read', async () => {
    renderProfile('someone-else');
    expect(await screen.findByRole('tab', { name: 'Builds' })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Playing/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Completed/ })).not.toBeInTheDocument();
    expect(firebase.listTracking).not.toHaveBeenCalled();
  });

  it('Playing: a card per build in progress, then the recently completed', async () => {
    const { user } = renderProfile('seed-ranni');
    const tab = await screen.findByRole('tab', { name: 'Playing 1' });
    expect(screen.getByRole('tab', { name: 'Completed 1' })).toBeInTheDocument();
    expect(await screen.findByText(/builds? finished/)).toHaveTextContent('1 build finished');
    await user.click(tab);
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByText('Only you can see what you’re playing.')).toBeInTheDocument();
    const card = await within(panel).findByRole('link', { name: /Moon Knight/ });
    expect(card).toHaveAttribute('href', '/build/PLAY/guide');
    expect(card).toHaveTextContent('started 4 November');
    expect(card).toHaveTextContent(/\d+%/);
    expect(card).toHaveTextContent('Gear 0 of 1');
    expect(card).toHaveTextContent('Next stop');
    // A deleted build is left out.
    expect(within(panel).getAllByRole('link', { name: /Moon Knight|Hammer Prince/ })).toHaveLength(
      2,
    );

    expect(within(panel).getByRole('heading', { name: 'Recently completed' })).toBeInTheDocument();
    await user.click(within(panel).getByRole('button', { name: 'All 1' }));
    expect(screen.getByRole('tab', { name: 'Completed 1' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('Completed: a trophy per finished build, with the month', async () => {
    const { user } = renderProfile('seed-ranni');
    await user.click(await screen.findByRole('tab', { name: 'Completed 1' }));
    const trophy = await screen.findByRole('link', { name: /Hammer Prince/ });
    expect(trophy).toHaveAttribute('href', '/build/DONE/guide');
    expect(trophy).toHaveTextContent('Oct 2026');
    expect(screen.queryByText('Moon Knight')).not.toBeInTheDocument();
  });

  it('says what to do when nothing is tracked', async () => {
    firebase.listTracking.mockResolvedValue([]);
    const { user } = renderProfile('seed-ranni');
    await user.click(await screen.findByRole('tab', { name: 'Playing' }));
    expect(await screen.findByText(/You’re not tracking a build/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Completed' }));
    expect(screen.getByText(/No finished builds yet/)).toBeInTheDocument();
  });
});

describe('Profile head (T51)', () => {
  it('titles the page with the name and canonicals to the profile', async () => {
    firebase.listUserBuilds.mockResolvedValue([makeBuild()]);
    renderProfile();
    await screen.findByRole('heading', { level: 1, name: 'Ranni Fan' });
    expect(document.title).toBe('Ranni Fan’s Elden Ring builds | Souls Builds');
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://soulsbuilds.com/user/seed-ranni',
    );
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('keeps a profile with no builds out of search', async () => {
    firebase.listUserBuilds.mockResolvedValue([]);
    renderProfile();
    await screen.findByRole('heading', { level: 1, name: 'Ranni Fan' });
    await vi.waitFor(() =>
      expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
        'content',
        'noindex',
      ),
    );
  });
});
