// Tracking a build (T34) on the build page: signed out (local storage) and signed in (the data
// layer, mocked).
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
import { renderWithProviders } from '@/test/render';
import { readLocal } from './localTracking';
import { flushSaves } from './saveQueue';

const firebase = vi.hoisted(() => ({
  getBuild: vi.fn(),
  getUserProfile: vi.fn(),
  hasLiked: vi.fn(),
  listComments: vi.fn(),
  getTracking: vi.fn(),
  saveTracking: vi.fn(),
  deleteTracking: vi.fn(),
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
  stats: BASELINE,
  startedAt: new Date('2026-11-04T12:00:00Z'),
  completedAt: null,
  ...overrides,
});

const renderPage = (uid: string | null = null, route = '/build/SEEDMOON0001') =>
  renderWithProviders(<BuildEditorPage />, { route, path: '/build/:buildId/:tab?', uid });

const item = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getBuild.mockResolvedValue(build);
  firebase.getUserProfile.mockResolvedValue(makeProfile());
  firebase.hasLiked.mockResolvedValue(false);
  firebase.listComments.mockResolvedValue([]);
  firebase.getTracking.mockResolvedValue(null);
  firebase.saveTracking.mockResolvedValue(undefined);
  firebase.deleteTracking.mockResolvedValue(undefined);
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('tracking signed out', () => {
  it('starts tracking, marks items collected in this browser, and offers an account', async () => {
    const { user } = renderPage();
    // The first render in this file loads the full game data: slow in a full parallel run.
    const track = await screen.findByRole(
      'button',
      { name: 'Track this build' },
      { timeout: 5000 },
    );
    await user.click(track);

    const progress = screen.getByRole('region', { name: 'Your progress' });
    expect(progress).toHaveTextContent('0% complete');
    expect(progress).toHaveTextContent('Gear0 of 3');
    expect(screen.queryByRole('button', { name: 'Track this build' })).not.toBeInTheDocument();

    // Items are toggles; empty slots (placeholders) aren't buttons and don't count.
    const mask = item('White Mask');
    expect(mask).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('region', { name: 'Keep your progress' })).not.toBeInTheDocument();
    await user.click(mask);
    expect(item('White Mask')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Armor' }).parentElement).toHaveTextContent(
      'Armor1/1 collected',
    );
    expect(within(screen.getByRole('list', { name: 'Armor' })).getAllByRole('button')).toHaveLength(
      1,
    );
    expect(progress).toHaveTextContent('Gear1 of 3');
    expect(readLocal('SEEDMOON0001')?.collected).toEqual([`helm:${WHITE_MASK}`]);
    expect(firebase.saveTracking).not.toHaveBeenCalled();

    // Once there's progress: keep it with an account, or later (for this session).
    const card = screen.getByRole('region', { name: 'Keep your progress' });
    expect(card).toHaveTextContent('Your progress is saved in this browser.');
    await user.click(within(card).getByRole('button', { name: 'Later' }));
    expect(screen.queryByRole('region', { name: 'Keep your progress' })).not.toBeInTheDocument();
  });

  it('picks up where the player left off', async () => {
    localStorage.setItem(
      'soulsbuilds.tracking.v1',
      JSON.stringify({
        SEEDMOON0001: {
          ...tracking({ collected: [`weapon1:${MOONVEIL}`] }),
          startedAt: '2026-11-04T12:00:00.000Z',
        },
      }),
    );
    renderPage();
    expect(await screen.findByRole('region', { name: 'Your progress' })).toHaveTextContent(
      'Gear1 of 3',
    );
    expect(item('Moonveil')).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('tracking signed in', () => {
  it('saves changes to the account once the player pauses', async () => {
    firebase.getTracking.mockResolvedValue(tracking());
    const { user } = renderPage('alice');
    expect(await screen.findByRole('region', { name: 'Your progress' })).toBeInTheDocument();
    expect(firebase.getTracking).toHaveBeenCalledWith('alice', 'SEEDMOON0001');

    await user.click(item('Moonveil'));
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
    );
    expect(localStorage.getItem('soulsbuilds.tracking.v1')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Keep your progress' })).not.toBeInTheDocument();
  });

  it('steps stats between the starting point and 99, ticking reached targets', async () => {
    firebase.getTracking.mockResolvedValue(tracking({ stats: { ...BASELINE, int: 79 } }));
    const { user } = renderPage('alice');
    const lower = await screen.findByRole('button', { name: 'Lower Vigor' });
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
    const { user } = renderPage('alice');
    await user.click(await screen.findByRole('button', { name: 'Stop tracking' }));
    expect(screen.getByText(/Your progress on this build is deleted/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep tracking' }));
    expect(firebase.deleteTracking).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Stop tracking' }));
    await user.click(screen.getByRole('button', { name: 'Yes, stop' }));
    expect(firebase.deleteTracking).toHaveBeenCalledWith('alice', 'SEEDMOON0001');
    expect(screen.getByRole('button', { name: 'Track this build' })).toBeInTheDocument();
    // Back to the plain Loadout: items are text again.
    expect(screen.queryByRole('button', { name: /^Moonveil/ })).not.toBeInTheDocument();
    expect(screen.getByText('Moonveil')).toBeInTheDocument();
  });

  it('celebrates a complete build', async () => {
    firebase.getTracking.mockResolvedValue(
      tracking({
        collected: ITEMS,
        stats: build.stats,
        completedAt: new Date('2026-11-16T12:00:00Z'),
      }),
    );
    renderPage('alice');
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
    const { user } = renderPage('alice');
    expect(await screen.findByRole('status')).toHaveTextContent('1 new item since you started.');
    await user.click(screen.getByRole('button', { name: 'Got it' }));
    expect(screen.queryByText(/new item since you started/)).not.toBeInTheDocument();
    act(() => flushSaves());
    expect(firebase.saveTracking).toHaveBeenCalledWith(
      'alice',
      'SEEDMOON0001',
      expect.objectContaining({ seen: ITEMS }),
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
