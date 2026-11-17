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
  renderWithProviders(<BuildEditorPage />, { route, path: '/build/:buildId/:tab?', uid });

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

  describe('tabs', () => {
    const tabNames = () =>
      within(screen.getByRole('navigation', { name: 'Build sections' }))
        .getAllByRole('link')
        .map((link) => link.textContent);

    it('opens on Description, with every tab, the comment count and the sidebar', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild({ commentCount: 2 }));
      renderPage('/build/SEEDMOON0001');
      expect(await screen.findByRole('link', { name: 'Description' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(tabNames()).toEqual(['Description', 'Guide', 'Comments 2']);
      expect(screen.getByRole('heading', { name: 'About this build' })).toBeInTheDocument();
      expect(screen.getByRole('complementary', { name: 'Stats and gear' })).toBeInTheDocument();
      // T48: no cards leading to other tabs, no "More by".
      expect(screen.queryByRole('link', { name: /Read the description/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: /^More by/ })).not.toBeInTheDocument();
    });

    it('shows the same sidebar on every tab', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      const { user } = renderPage('/build/SEEDMOON0001/comments');
      expect(await screen.findByRole('heading', { name: 'Comments' })).toBeInTheDocument();
      const sidebar = () => screen.getByRole('complementary', { name: 'Stats and gear' });
      expect(within(sidebar()).getByRole('button', { name: /^Moonveil/ })).toBeInTheDocument();
      await user.click(screen.getByRole('link', { name: 'Guide' }));
      expect(
        await screen.findByRole('heading', { name: 'How to get this build' }),
      ).toBeInTheDocument();
      expect(within(sidebar()).getByRole('button', { name: /^Moonveil/ })).toBeInTheDocument();
    });

    it('switches tabs without losing the page', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      const { user } = renderPage('/build/SEEDMOON0001/comments');
      await user.click(await screen.findByRole('link', { name: 'Description' }));
      expect(await screen.findByRole('heading', { name: 'About this build' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Description' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(firebase.getBuild).toHaveBeenCalledTimes(1);
    });

    it('opens the links used before T48 on their new tab', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      renderPage('/build/SEEDMOON0001/route');
      expect(await screen.findByRole('link', { name: 'Guide' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('shows Description for an unknown tab', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      renderPage('/build/SEEDMOON0001/loadout');
      expect(await screen.findByRole('heading', { name: 'About this build' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Description' })).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    it('generates a description from the build when the author wrote none (T47)', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild({ description: '' }));
      renderPage('/build/SEEDMOON0001');
      expect(await screen.findByText(/^A level \d+ .*build/)).toBeInTheDocument();
      expect(screen.getByText('This description was automatically generated.')).toBeInTheDocument();
      expect(tabNames()).toEqual(['Description', 'Guide', 'Comments 0']);
    });

    it("shows the author's write-up without the generated note", async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      renderPage('/build/SEEDMOON0001');
      expect(await screen.findByRole('heading', { name: 'About this build' })).toBeInTheDocument();
      expect(screen.queryByText(/automatically generated/)).not.toBeInTheDocument();
    });

    it('edits the build in the sidebar and the write-up on Description, the only tab', async () => {
      firebase.getBuild.mockResolvedValue(makeBuild());
      const { user } = renderPage('/build/SEEDMOON0001/guide', 'seed-ranni');
      await user.click(await screen.findByRole('button', { name: 'Edit' }));
      expect(await screen.findByText(/Markdown works/)).toBeInTheDocument();
      expect(tabNames()).toEqual(['Description']);
      const sidebar = screen.getByRole('complementary', { name: 'Stats and gear' });
      expect(within(sidebar).getByLabelText('Intelligence')).toHaveValue('80');
      expect(within(sidebar).getByRole('button', { name: 'Choose helm' })).toBeInTheDocument();
      expect(within(sidebar).getByRole('button', { name: /^Change Moonveil/ })).toBeInTheDocument();
      expect(screen.getByLabelText('Build name')).toHaveValue('Carian Moon Knight');
    });
  });
});
