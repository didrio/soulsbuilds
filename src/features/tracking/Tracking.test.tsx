// Tracking a build (T34) on the build page, with the data layer mocked. Tracking needs an account
// (T41): signed out, and signed in before the first tracked build, "Track this build" opens the intro.
// It lives in the Guide tab (T46, renamed in T48): the progress bar, Your stats and the route's checkboxes.
import { act, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BuildEditorPage from '@/features/editor/BuildEditorPage';
import type { TrackingState } from '@/lib/tracking';
import {
  GODRICKS_GREAT_RUNE,
  makeBuild,
  makeProfile,
  MOONVEIL,
  WHITE_MASK,
  emptyEquipment,
} from '@/test/fixtures';
import { AuthDialogContext, type OpenAuthDialog } from '@/app/authDialog';
import { renderWithProviders } from '@/test/render';
import { flushSaves } from './saveQueue';

const firebase = vi.hoisted(() => ({
  getBuild: vi.fn(),
  getUserProfile: vi.fn(),
  hasLiked: vi.fn(),
  listComments: vi.fn(),
  getTracking: vi.fn(),
  saveTracking: vi.fn(),
  deleteTracking: vi.fn(),
  tracksAnyBuild: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  errorMessage: (error: unknown) => (error instanceof Error ? error.message : 'error'),
}));

// Moonveil, White Mask and Godrick's Great Rune; no starting class, so stats start at 10 (Faith 7
// and Arcane 9, the build's own, where it's below 10).
const build = makeBuild({
  equipment: {
    ...emptyEquipment(),
    weapons: [MOONVEIL, null, null, null, null, null],
    helm: WHITE_MASK,
    greatRune: GODRICKS_GREAT_RUNE,
  },
});
const ITEMS = [`weapon1:${MOONVEIL}`, `helm:${WHITE_MASK}`, `greatRune:${GODRICKS_GREAT_RUNE}`];
const BASELINE = { vigor: 10, mind: 10, end: 10, str: 10, dex: 10, int: 10, fai: 7, arc: 9 };

const tracking = (overrides: Partial<TrackingState> = {}): TrackingState => ({
  collected: [],
  seen: ITEMS,
  marked: [],
  stats: BASELINE,
  startedAt: new Date('2026-11-04T12:00:00Z'),
  completedAt: null,
  ...overrides,
});

const openAuthDialog = vi.fn<OpenAuthDialog>();

const renderPage = (uid: string | null = null, route = '/build/SEEDMOON0001') =>
  renderWithProviders(
    <AuthDialogContext value={openAuthDialog}>
      <BuildEditorPage />
    </AuthDialogContext>,
    { route, path: '/build/:buildId/*', uid },
  );

const GUIDE = '/build/SEEDMOON0001/carian-moon-knight/guide';
/** A build item's checkbox on the route (loaded lazily with its data). */
const item = (name: string) =>
  screen.findByRole('checkbox', { name: new RegExp(`^${name}`) }, { timeout: 5000 });
const progress = () => screen.getByRole('region', { name: 'Your progress' });

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getBuild.mockResolvedValue(build);
  firebase.getUserProfile.mockResolvedValue(makeProfile());
  firebase.hasLiked.mockResolvedValue(false);
  firebase.listComments.mockResolvedValue([]);
  firebase.getTracking.mockResolvedValue(null);
  firebase.saveTracking.mockResolvedValue(undefined);
  firebase.deleteTracking.mockResolvedValue(undefined);
  firebase.tracksAnyBuild.mockResolvedValue(true);
});

afterEach(() => act(() => flushSaves()));

describe('tracking signed out', () => {
  it('opens the intro, which continues into tracking after sign-up', async () => {
    const { user } = renderPage();
    // The first render in this file loads the full game data: slow in a full parallel run.
    const track = await screen.findByRole(
      'button',
      { name: 'Track this build' },
      { timeout: 5000 },
    );
    await user.click(track);

    const intro = screen.getByRole('dialog', { name: 'Track this build' });
    expect(intro).toHaveTextContent('Check off gear as you find it');
    expect(intro).toHaveTextContent('Tracking needs a free account.');
    expect(within(intro).queryByRole('button', { name: 'Start tracking' })).not.toBeInTheDocument();
    expect(firebase.getTracking).not.toHaveBeenCalled();

    await user.click(within(intro).getByRole('button', { name: 'Create account' }));
    expect(screen.queryByRole('dialog', { name: 'Track this build' })).not.toBeInTheDocument();
    expect(openAuthDialog).toHaveBeenCalledWith('signup', expect.any(Function));
    expect(firebase.saveTracking).not.toHaveBeenCalled();

    // Signed up as alice: tracking starts on her account.
    const onSignedIn = openAuthDialog.mock.calls[0]?.[1];
    if (!onSignedIn) throw new Error('no sign-in callback');
    act(() => onSignedIn('alice'));
    await waitFor(() =>
      expect(firebase.saveTracking).toHaveBeenCalledWith(
        'alice',
        'SEEDMOON0001',
        expect.objectContaining({ collected: [], seen: ITEMS, stats: BASELINE }),
        'none',
      ),
    );
    // The hero counts the new player at once (T36), and the Guide tab opens (T46).
    expect(screen.getByRole('region', { name: build.name })).toHaveTextContent('1 playing');
    expect(
      await screen.findByRole('heading', { name: 'How to get this build' }),
    ).toBeInTheDocument();
  });

  it('keeps the progress of an account that already tracks the build', async () => {
    const { user } = renderPage();
    await user.click(await screen.findByRole('button', { name: 'Track this build' }));
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(openAuthDialog).toHaveBeenCalledWith('login', expect.any(Function));

    firebase.getTracking.mockResolvedValue(tracking({ collected: [`weapon1:${MOONVEIL}`] }));
    const onSignedIn = openAuthDialog.mock.calls[0]?.[1];
    if (!onSignedIn) throw new Error('no sign-in callback');
    await act(async () => onSignedIn('alice'));
    expect(firebase.getTracking).toHaveBeenCalledWith('alice', 'SEEDMOON0001');
    act(() => flushSaves());
    expect(firebase.saveTracking).not.toHaveBeenCalled();
  });
});

describe('tracking signed in, the first time', () => {
  it('shows the intro with Start tracking until the player tracks a build', async () => {
    firebase.tracksAnyBuild.mockResolvedValue(false);
    const { user } = renderPage('alice');
    await user.click(await screen.findByRole('button', { name: 'Track this build' }));
    expect(firebase.tracksAnyBuild).toHaveBeenCalledWith('alice');

    // Not now: nothing changes.
    const intro = screen.getByRole('dialog', { name: 'Track this build' });
    expect(intro).not.toHaveTextContent('Tracking needs a free account.');
    await user.click(within(intro).getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(firebase.saveTracking).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Track this build' }));
    await user.click(screen.getByRole('button', { name: 'Start tracking' }));
    expect(progress()).toHaveTextContent('Your progress0%');
    expect(screen.getByRole('heading', { name: 'How to get this build' })).toBeInTheDocument();
    await waitFor(() => expect(firebase.saveTracking).toHaveBeenCalledTimes(1));
  });

  it('starts at once once the player tracks another build, in the Guide', async () => {
    const { user } = renderPage('alice');
    await user.click(await screen.findByRole('button', { name: 'Track this build' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(progress()).toHaveTextContent('0 of 3 items · Level');
    // The hero's button becomes a quiet link back to the tab, with no percentage.
    expect(screen.queryByRole('button', { name: 'Track this build' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tracking' })).toHaveAttribute('href', GUIDE);

    // The build's items are checkboxes on the route. The White Mask is alone at its stop: checked
    // off, the stop is done and folds away.
    const mask = await item('White Mask');
    expect(mask).not.toBeChecked();
    await user.click(mask);
    expect(progress()).toHaveTextContent('1 of 3 items');
    expect(screen.getByText(/stops done/)).toHaveTextContent(/^1 of \d+ stops done/);
    await user.click(screen.getByRole('button', { name: 'Show the 1 finished stop' }));
    expect(await item('White Mask')).toBeChecked();
  });
});

describe('tracking signed in', () => {
  it('leaves the rest of the page as a visitor sees it', async () => {
    firebase.getTracking.mockResolvedValue(tracking({ seen: ITEMS.slice(0, 2) }));
    renderPage('alice');
    expect(await screen.findByRole('link', { name: 'Tracking' })).toBeInTheDocument();
    // The Description tab and the sidebar: no progress, no checkboxes or toggles, no stats to step,
    // no notice; the gear as any visitor sees it.
    expect(screen.queryByRole('region', { name: 'Your progress' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Moonveil/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Raise Vigor' })).not.toBeInTheDocument();
    expect(screen.queryByText(/yours \/ target/)).not.toBeInTheDocument();
    expect(screen.queryByText(/new item since you started/)).not.toBeInTheDocument();
    expect(screen.queryByText('Next stop')).not.toBeInTheDocument();
  });

  it('saves changes to the account once the player pauses', async () => {
    firebase.getTracking.mockResolvedValue(tracking());
    const { user } = renderPage('alice', GUIDE);
    expect(await screen.findByRole('region', { name: 'Your progress' })).toBeInTheDocument();
    expect(firebase.getTracking).toHaveBeenCalledWith('alice', 'SEEDMOON0001');

    await user.click(await item('Moonveil'));
    // Your stats opens the attributes in place, under the bar.
    const yourStats = screen.getByRole('button', { name: 'Your stats' });
    expect(yourStats).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Raise Vigor' })).not.toBeInTheDocument();
    await user.click(yourStats);
    expect(yourStats).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'Raise Vigor' }));
    await user.click(screen.getByRole('button', { name: 'Raise Vigor' }));
    await waitFor(() => expect(firebase.saveTracking).toHaveBeenCalledTimes(1));
    expect(firebase.saveTracking).toHaveBeenCalledWith(
      'alice',
      'SEEDMOON0001',
      expect.objectContaining({
        collected: [`weapon1:${MOONVEIL}`],
        stats: { ...BASELINE, vigor: 12 },
      }),
      'playing',
    );
  });

  it('steps stats between the starting point and 99, ticking reached targets', async () => {
    firebase.getTracking.mockResolvedValue(tracking({ stats: { ...BASELINE, int: 79 } }));
    const { user } = renderPage('alice', GUIDE);
    await user.click(await screen.findByRole('button', { name: 'Your stats' }));
    const lower = screen.getByRole('button', { name: 'Lower Vigor' });
    expect(lower).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Lower Faith' })).toBeDisabled();
    // Faith (7) and Arcane (9) start at their targets.
    expect(screen.getAllByText('target reached')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Raise Intelligence' }));
    expect(screen.getAllByText('target reached')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Lower Intelligence' })).toBeEnabled();
    act(() => flushSaves());
  });

  it('asks before it stops tracking, then deletes the progress', async () => {
    firebase.getTracking.mockResolvedValue(tracking());
    firebase.getBuild.mockResolvedValue({ ...build, playerCount: 3, finishedCount: 1 });
    const { user } = renderPage('alice', GUIDE);
    await item('Moonveil');
    await user.click(await screen.findByRole('button', { name: 'Stop tracking' }));
    expect(screen.getByText(/Your progress on this build is deleted/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep tracking' }));
    expect(firebase.deleteTracking).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Stop tracking' }));
    await user.click(screen.getByRole('button', { name: 'Yes, stop' }));
    await waitFor(() =>
      expect(firebase.deleteTracking).toHaveBeenCalledWith('alice', 'SEEDMOON0001', 'playing'),
    );
    expect(screen.getByRole('button', { name: 'Track this build' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: build.name })).toHaveTextContent(
      '1 playing · 1 finished',
    );
    // Back to the plain route: no bar, items are text again.
    expect(screen.queryByRole('region', { name: 'Your progress' })).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    // (the title section's "with Moonveil" is a link to the weapon's page, T55)
    expect(screen.getByText('Moonveil', { selector: ':not(a)' })).toBeInTheDocument();
  });

  it('celebrates a complete build', async () => {
    firebase.getTracking.mockResolvedValue(
      tracking({
        collected: ITEMS,
        stats: build.stats,
        completedAt: new Date('2026-11-16T12:00:00Z'),
      }),
    );
    renderPage('alice', GUIDE);
    const complete = await screen.findByRole('region', { name: 'Build complete' });
    expect(complete).toHaveTextContent('Tracked since 4 November: 12 days.');
    expect(within(complete).getByRole('button', { name: 'Share your finish' })).toBeEnabled();
    expect(within(complete).getByRole('link', { name: 'Find your next build' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('flags items the author added since the player started', async () => {
    firebase.getTracking.mockResolvedValue(tracking({ seen: ITEMS.slice(0, 2) }));
    const { user } = renderPage('alice', GUIDE);
    expect(await screen.findByRole('status')).toHaveTextContent('1 new item since you started.');
    await user.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByText(/new item since you started/)).not.toBeInTheDocument();
    act(() => flushSaves());
    expect(firebase.saveTracking).toHaveBeenCalledWith(
      'alice',
      'SEEDMOON0001',
      expect.objectContaining({ seen: ITEMS }),
      'playing',
    );
  });

  it('is off while the owner edits', async () => {
    firebase.getTracking.mockResolvedValue(tracking());
    const { user } = renderPage('seed-ranni');
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(screen.queryByRole('region', { name: 'Your progress' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Raise Vigor' })).not.toBeInTheDocument();
  });
});
