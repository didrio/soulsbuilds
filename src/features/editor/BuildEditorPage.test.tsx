import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBuild, makeProfile } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import BuildEditorPage from './BuildEditorPage';

// The data layer, mocked: each test sets what Firestore "returns".
const firebase = vi.hoisted(() => ({
  getBuild: vi.fn(),
  getUserProfile: vi.fn(),
  hasLiked: vi.fn(),
  listComments: vi.fn(),
  updateBuild: vi.fn(),
  createBuild: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  errorMessage: (error: unknown) => (error instanceof Error ? error.message : 'error'),
}));

/** The rune level the Stats card shows. */
const shownLevel = () =>
  within(screen.getByRole('region', { name: 'Stats' })).getByText('Rune level').nextSibling
    ?.textContent;

const renderPage = (route: string, uid: string | null = null) =>
  renderWithProviders(<BuildEditorPage />, { route, path: '/build/:buildId', uid });

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getUserProfile.mockResolvedValue(makeProfile());
  firebase.hasLiked.mockResolvedValue(false);
  firebase.listComments.mockResolvedValue([]);
});

describe('BuildEditorPage', () => {
  it('shows a not-found page for a build that does not exist', async () => {
    firebase.getBuild.mockResolvedValue(null);
    renderPage('/build/NOPE');
    expect(await screen.findByRole('heading', { name: 'Build not found' })).toBeInTheDocument();
  });

  it('shows an error with a retry when loading fails', async () => {
    firebase.getBuild.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(makeBuild());
    const { user } = renderPage('/build/SEEDMOON0001');
    expect(await screen.findByRole('alert')).toHaveTextContent('offline');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Carian Moon Knight' })).toBeInTheDocument();
  });

  it('shows the build with its owner; only the owner gets Edit', async () => {
    firebase.getBuild.mockResolvedValue(makeBuild());
    renderPage('/build/SEEDMOON0001', 'someone-else');
    expect(await screen.findByRole('heading', { name: 'Carian Moon Knight' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Ranni Fan' })).toHaveAttribute(
      'href',
      '/user/seed-ranni',
    );
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('keeps the editor open with an error when saving fails', async () => {
    firebase.getBuild.mockResolvedValue(makeBuild());
    firebase.updateBuild.mockRejectedValue(new Error('You are not allowed to do that.'));
    const { user } = renderPage('/build/SEEDMOON0001', 'seed-ranni');
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('You are not allowed to do that.');
    expect(screen.getByLabelText('Build name')).toHaveValue('Carian Moon Knight');
  });

  it('does not save a build without a name', async () => {
    firebase.getBuild.mockResolvedValue(makeBuild());
    const { user } = renderPage('/build/SEEDMOON0001', 'seed-ranni');
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Build name'));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Give your build a name.');
    expect(firebase.updateBuild).not.toHaveBeenCalled();
  });

  it('cancelling an edit restores the saved build', async () => {
    firebase.getBuild.mockResolvedValue(makeBuild());
    const { user } = renderPage('/build/SEEDMOON0001', 'seed-ranni');
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Vigor'));
    await user.type(screen.getByLabelText('Vigor'), '99');
    expect(shownLevel()).toBe('191');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(shownLevel()).toBe('132');
    expect(screen.getByRole('heading', { name: 'Carian Moon Knight' })).toBeInTheDocument();
  });

  it('asks signed-out visitors to log in before creating a build', async () => {
    renderPage('/build/new');
    expect(
      await screen.findByRole('heading', { name: 'Log in to create a build' }),
    ).toBeInTheDocument();
  });

  it('starts /build/new from an empty editor', async () => {
    renderPage('/build/new', 'alice');
    expect(await screen.findByLabelText('Build name')).toHaveValue('');
    expect(screen.getByRole('heading', { name: 'New build' })).toBeInTheDocument();
    expect(shownLevel()).toBe('1');
  });
});
