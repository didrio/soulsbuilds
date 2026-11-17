import { act, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthDialogContext } from '@/app/authDialog';
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
  renderWithProviders(<BuildEditorPage />, { route, path: '/build/:buildId/*', uid });

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

  describe('build image (T40)', () => {
    const equipment = { ...makeBuild().equipment, talismans: [2160] }; // + Lord of Blood's Exultation

    it("chooses one of the build's items and saves it", async () => {
      firebase.getBuild.mockResolvedValue(makeBuild({ equipment }));
      firebase.updateBuild.mockResolvedValue(undefined);
      const { user } = renderPage('/build/SEEDMOON0001', 'seed-ranni');
      await user.click(await screen.findByRole('button', { name: 'Edit' }));
      expect(screen.getByText('Main weapon (default)')).toBeInTheDocument();

      // Cancel keeps the default.
      await user.click(screen.getByRole('button', { name: 'Change image' }));
      const dialog = screen.getByRole('dialog', { name: 'Build image' });
      expect(within(dialog).getByRole('radio', { name: /^Default/ })).toBeChecked();
      await user.click(within(dialog).getByRole('radio', { name: /Lord of Blood/ }));
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      expect(screen.getByText('Main weapon (default)')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Change image' }));
      await user.click(screen.getByRole('radio', { name: /Lord of Blood/ }));
      await user.click(screen.getByRole('button', { name: 'Use image' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('Talisman')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(firebase.updateBuild).toHaveBeenCalledWith(
        'SEEDMOON0001',
        expect.objectContaining({ image: { kind: 'talisman', id: 2160 } }),
      );
    });

    it('saves a pick that is no longer on the build as the default', async () => {
      const image = { kind: 'talisman', id: 1040 } as const; // not on the build
      firebase.getBuild.mockResolvedValue(makeBuild({ equipment, image }));
      firebase.updateBuild.mockResolvedValue(undefined);
      const { user } = renderPage('/build/SEEDMOON0001', 'seed-ranni');
      await user.click(await screen.findByRole('button', { name: 'Edit' }));
      expect(screen.getByText('Main weapon (default)')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(firebase.updateBuild).toHaveBeenCalledWith(
        'SEEDMOON0001',
        expect.objectContaining({ image: null }),
      );
    });
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

  it('opens the planner signed out; Save asks for an account, then saves as the new user (T68)', async () => {
    let onSignedIn: ((uid: string) => void) | undefined;
    const openAuthDialog = vi.fn((_kind: string, next?: (uid: string) => void) => {
      onSignedIn = next;
    });
    firebase.createBuild.mockResolvedValue('NEWBUILD0001');
    firebase.getBuild.mockResolvedValue(makeBuild({ id: 'NEWBUILD0001', name: 'My first build' }));
    const { user } = renderWithProviders(
      <AuthDialogContext value={openAuthDialog}>
        <BuildEditorPage />
      </AuthDialogContext>,
      { route: '/build/new', path: '/build/:buildId/*' },
    );
    expect(await screen.findByRole('heading', { name: 'New build' })).toBeInTheDocument();
    expect(screen.getByText(/Free account needed to save/)).toBeInTheDocument();
    await user.type(screen.getByLabelText('Build name'), 'My first build');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(openAuthDialog).toHaveBeenCalledWith('signup', expect.any(Function));
    expect(firebase.createBuild).not.toHaveBeenCalled();

    act(() => onSignedIn?.('new-user'));
    await waitFor(() =>
      expect(firebase.createBuild).toHaveBeenCalledWith(
        'new-user',
        expect.objectContaining({ name: 'My first build' }),
      ),
    );
    expect(await screen.findByRole('heading', { name: 'My first build' })).toBeInTheDocument();
  });

  it('starts /build/new from an empty editor', async () => {
    renderPage('/build/new', 'alice');
    expect(await screen.findByLabelText('Build name')).toHaveValue('');
    expect(screen.getByRole('heading', { name: 'New build' })).toBeInTheDocument();
    expect(shownLevel()).toBe('1');
  });

  describe('tabs', () => {
    const tabNames = () =>
      within(screen.getByRole('navigation', { name: 'Build sections' }))
        .getAllByRole('link')
        .map((link) => link.textContent);

    it('opens on Equipment: the stats beside the equipment, every tab, the comment count', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild({ commentCount: 2 }));
      renderPage('/build/SEEDMOON0001');
      expect(await screen.findByRole('link', { name: 'Equipment' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(tabNames()).toEqual(['Equipment', 'Guide', 'Discussion 2']);
      const sidebar = screen.getByRole('complementary', { name: 'Stats' });
      expect(within(sidebar).queryByRole('button')).not.toBeInTheDocument();
      const panel = screen.getByRole('region', { name: 'Equipment' });
      expect(within(panel).getByRole('button', { name: /^Moonveil/ })).toBeInTheDocument();
      // The write-up isn't on this tab (T63), and nothing is generated in its place.
      expect(screen.queryByText('Moonveil and full-moon sorceries.')).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /^More by/ })).not.toBeInTheDocument();
    });

    it('shows the stats and the equipment in the sidebar on Guide and Discussion', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      const { user } = renderPage('/build/SEEDMOON0001/discussion');
      expect(await screen.findByRole('heading', { name: 'Comments' })).toBeInTheDocument();
      const sidebar = () => screen.getByRole('complementary', { name: 'Stats and equipment' });
      expect(within(sidebar()).getByRole('button', { name: /^Moonveil/ })).toBeInTheDocument();
      await user.click(screen.getByRole('link', { name: 'Guide' }));
      expect(
        await screen.findByRole('heading', { name: 'How to get this build' }),
      ).toBeInTheDocument();
      expect(within(sidebar()).getByRole('button', { name: /^Moonveil/ })).toBeInTheDocument();
    });

    it("heads Discussion with the author's write-up; the count is the comments only", async () => {
      firebase.getBuild.mockResolvedValue(makeBuild({ commentCount: 0 }));
      renderPage('/build/SEEDMOON0001/discussion');
      expect(await screen.findByRole('heading', { name: 'Description' })).toBeInTheDocument();
      expect(screen.getByText('Moonveil and full-moon sorceries.')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Comments' })).toBeInTheDocument();
      expect(tabNames()).toEqual(['Equipment', 'Guide', 'Discussion 0']);
    });

    it('leaves the write-up out of Discussion when the author wrote none', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild({ description: '' }));
      renderPage('/build/SEEDMOON0001/discussion');
      expect(await screen.findByRole('heading', { name: 'Comments' })).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Description' })).not.toBeInTheDocument();
    });

    it('switches tabs without losing the page', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      const { user } = renderPage('/build/SEEDMOON0001/discussion');
      await user.click(await screen.findByRole('link', { name: 'Equipment' }));
      expect(screen.getByRole('link', { name: 'Equipment' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(firebase.getBuild).toHaveBeenCalledTimes(1);
    });

    it('opens older links on their new tab', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      renderPage('/build/SEEDMOON0001/route');
      expect(await screen.findByRole('link', { name: 'Guide' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('opens the old Description and Comments links on Discussion (T63)', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      renderPage('/build/SEEDMOON0001/carian-moon-knight/comments');
      expect(await screen.findByRole('link', { name: /^Discussion/ })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('links the tabs with the name slug and opens any slug on the right tab (T56)', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      renderPage('/build/SEEDMOON0001/some-old-name/guide');
      const guide = await screen.findByRole('link', { name: 'Guide' });
      expect(guide).toHaveAttribute('aria-current', 'page');
      expect(guide).toHaveAttribute('href', '/build/SEEDMOON0001/carian-moon-knight/guide');
      expect(screen.getByRole('link', { name: 'Equipment' })).toHaveAttribute(
        'href',
        '/build/SEEDMOON0001/carian-moon-knight',
      );
    });

    it('shows Equipment for an unknown tab', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      renderPage('/build/SEEDMOON0001/loadout');
      expect(await screen.findByRole('link', { name: 'Equipment' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('edits the stats, every slot and the write-up on Equipment, the only tab', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      const { user } = renderPage('/build/SEEDMOON0001/guide', 'seed-ranni');
      await user.click(await screen.findByRole('button', { name: 'Edit' }));
      expect(await screen.findByText(/Markdown works/)).toBeInTheDocument();
      expect(tabNames()).toEqual(['Equipment']);
      const sidebar = screen.getByRole('complementary', { name: 'Stats' });
      expect(within(sidebar).getByLabelText('Intelligence')).toHaveValue('80');
      const panel = screen.getByRole('region', { name: 'Equipment' });
      expect(within(panel).getByRole('button', { name: 'Choose helm' })).toBeInTheDocument();
      expect(within(panel).getByRole('button', { name: /^Change Moonveil/ })).toBeInTheDocument();
      expect(screen.getByLabelText('Build name')).toHaveValue('Carian Moon Knight');
    });
  });
});
