import { screen, within } from '@testing-library/react';
import { Link, useLocation } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBuild, makeComment, makeProfile } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import BuildEditorPage from '../BuildEditorPage';

// The build page on phones (T49, T63): collapsible sections instead of the tab bar and the sidebar.
const firebase = vi.hoisted(() => ({
  getBuild: vi.fn(),
  getUserProfile: vi.fn(),
  hasLiked: vi.fn(),
  listComments: vi.fn(),
  fetchLatestComment: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  errorMessage: (error: unknown) => (error instanceof Error ? error.message : 'error'),
}));

function Where() {
  return <output aria-label="Location">{useLocation().pathname}</output>;
}

const renderPage = (route: string, uid: string | null = null) => {
  setViewportWidth(390);
  return renderWithProviders(
    <>
      <BuildEditorPage />
      <Where />
      <Link to="/build/SEEDMOON0001/carian-moon-knight/guide">Elsewhere to the Guide</Link>
    </>,
    { route, path: '/build/:buildId/*', uid },
  );
};

/** A section's header button, by the section's title. */
const header = (title: string) =>
  within(screen.getByRole('region', { name: title })).getAllByRole('button')[0]!;
/** The sections' titles, in order. */
const titles = () =>
  screen
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.querySelector('[id]')?.textContent);
const location = () => screen.getByRole('status', { name: 'Location' }).textContent;

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getUserProfile.mockResolvedValue(makeProfile());
  firebase.hasLiked.mockResolvedValue(false);
  firebase.listComments.mockResolvedValue([]);
  firebase.fetchLatestComment.mockResolvedValue(null);
});

describe('BuildSections (phones)', () => {
  it('lists the sections in order, Weapons open (Equipment), each closed one with its glance', async () => {
    firebase.getBuild.mockResolvedValue(makeBuild());
    renderPage('/build/SEEDMOON0001');
    await screen.findByRole('region', { name: 'Stats' });
    expect(screen.queryByRole('navigation', { name: 'Build sections' })).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(titles()).toEqual([
      'Stats',
      'Weapons',
      'Armor',
      'Talismans',
      'Tears, rune and ash',
      'Guide',
      'Discussion',
    ]);
    expect(header('Weapons')).toHaveAttribute('aria-expanded', 'true');
    expect(header('Stats')).toHaveAttribute('aria-expanded', 'false');
    expect(header('Stats')).toHaveTextContent('RL 132 · Int 80 · Vig 40 · Mnd 30');
    expect(header('Guide')).toHaveTextContent('1 item to find');
    expect(header('Discussion')).toHaveTextContent('No comments yet');
    // Nothing to open: a heading that says so, not a button.
    const armor = screen.getByRole('region', { name: 'Armor' });
    expect(within(armor).queryByRole('button')).not.toBeInTheDocument();
    expect(armor).toHaveTextContent('None');
    // No comments: no read for the newest one.
    expect(firebase.fetchLatestComment).not.toHaveBeenCalled();
  });

  it('opens and closes a gear section, its items by name', async () => {
    firebase.getBuild.mockResolvedValue(makeBuild());
    const { user } = renderPage('/build/SEEDMOON0001');
    const weapons = await screen.findByRole('region', { name: 'Weapons' });
    expect(within(weapons).getByText('Moonveil')).toBeVisible();
    await user.click(header('Weapons'));
    expect(header('Weapons')).toHaveAttribute('aria-expanded', 'false');
    expect(header('Weapons')).toHaveAccessibleName('Weapons Moonveil');
    expect(within(weapons).queryByRole('listitem')).not.toBeInTheDocument();
    await user.click(header('Weapons'));
    expect(within(weapons).getByText('Moonveil')).toBeVisible();
  });

  it('shows the start of the newest comment; opening Discussion loads them and takes its URL', async () => {
    firebase.getBuild.mockResolvedValue(makeBuild({ commentCount: 2 }));
    firebase.fetchLatestComment.mockResolvedValue(makeComment({ text: 'Moonveil all day' }));
    firebase.listComments.mockResolvedValue([makeComment({ text: 'Moonveil all day' })]);
    const { user } = renderPage('/build/SEEDMOON0001');
    expect(await screen.findByText('2 comments · “Moonveil all day”')).toBeInTheDocument();
    expect(firebase.fetchLatestComment).toHaveBeenCalledTimes(1);
    expect(firebase.listComments).not.toHaveBeenCalled();

    await user.click(header('Discussion'));
    expect(location()).toBe('/build/SEEDMOON0001/carian-moon-knight/discussion');
    const discussion = screen.getByRole('region', { name: 'Discussion' });
    expect(await within(discussion).findByText('Moonveil all day')).toBeInTheDocument();
    // The author's write-up first, then the comments under their own label.
    expect(within(discussion).getByRole('heading', { name: 'Comments' })).toBeInTheDocument();
    // Several can be open: Weapons stayed open.
    expect(header('Weapons')).toHaveAttribute('aria-expanded', 'true');
  });

  it('leaves the write-up out of Discussion when the author wrote none', async () => {
    firebase.getBuild.mockResolvedValue(makeBuild({ description: '' }));
    renderPage('/build/SEEDMOON0001/carian-moon-knight/discussion');
    const discussion = await screen.findByRole('region', { name: 'Discussion' });
    expect(await within(discussion).findByText(/No comments yet/)).toBeInTheDocument();
    expect(within(discussion).queryByRole('heading', { name: 'Comments' })).not.toBeInTheDocument();
  });

  it('opens the section the URL names, and one a link elsewhere goes to', async () => {
    firebase.getBuild.mockResolvedValue(makeBuild());
    const { user } = renderPage('/build/SEEDMOON0001/carian-moon-knight/discussion');
    await screen.findByRole('region', { name: 'Discussion' });
    expect(header('Discussion')).toHaveAttribute('aria-expanded', 'true');
    expect(header('Weapons')).toHaveAttribute('aria-expanded', 'false');
    expect(header('Guide')).toHaveAttribute('aria-expanded', 'false');

    // jsdom has no scrolling: watch for the call.
    const scrolled = vi.fn<(this: Element) => void>(function (this: Element) {});
    Element.prototype.scrollIntoView = scrolled;
    await user.click(screen.getByRole('link', { name: 'Elsewhere to the Guide' }));
    expect(header('Guide')).toHaveAttribute('aria-expanded', 'true');
    expect(scrolled.mock.contexts).toEqual([document.getElementById('section-guide')]);

    // A tap opens a section where it is: no scrolling.
    await user.click(header('Discussion'));
    await user.click(header('Discussion'));
    expect(location()).toBe('/build/SEEDMOON0001/carian-moon-knight/discussion');
    expect(scrolled).toHaveBeenCalledTimes(1);
    delete (Element.prototype as Partial<Element>).scrollIntoView;
  });

  it('edits the build in the sections: every gear section, slots as picker buttons', async () => {
    firebase.getBuild.mockResolvedValue(makeBuild());
    const { user } = renderPage('/build/SEEDMOON0001', 'seed-ranni');
    await user.click(await screen.findByRole('button', { name: 'Edit' }));
    expect(titles()).toEqual([
      'Stats',
      'Weapons',
      'Armor',
      'Talismans',
      'Spells',
      'Tears, rune and ash',
      'Items',
      'Description',
    ]);
    expect(header('Armor')).toHaveTextContent('Nothing chosen');
    expect(header('Description')).toHaveTextContent(/^Description/);
    const weapons = screen.getByRole('region', { name: 'Weapons' });
    expect(within(weapons).getByRole('list', { name: 'Right hand' })).toBeInTheDocument();
    expect(within(weapons).getByRole('button', { name: /^Change Moonveil/ })).toBeInTheDocument();
    await user.click(header('Stats'));
    expect(screen.getByRole('textbox', { name: 'Vigor' })).toHaveValue('40');
  });
});
