import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthDialogContext, type OpenAuthDialog } from '@/app/authDialog';
import { makeComment, makeProfile } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import CommentsSection from './CommentsSection';

const firebase = vi.hoisted(() => ({
  getUserProfile: vi.fn(),
  listComments: vi.fn(),
  listCommentLikes: vi.fn(),
  likeComment: vi.fn(),
  unlikeComment: vi.fn(),
  addComment: vi.fn(),
  deleteComment: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({ ...firebase, errorMessage: () => 'error' }));

const day = (d: number) => new Date(Date.UTC(2026, 10, d));

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getUserProfile.mockImplementation((id: string) =>
    Promise.resolve(makeProfile({ id, displayName: id === 'seed-ranni' ? 'Ranni Fan' : id })),
  );
  firebase.listComments.mockResolvedValue([]);
  firebase.listCommentLikes.mockResolvedValue(new Set());
  firebase.likeComment.mockResolvedValue(undefined);
  firebase.unlikeComment.mockResolvedValue(undefined);
});

const render = (uid: string | null = 'alice', openAuthDialog: OpenAuthDialog = vi.fn()) =>
  renderWithProviders(
    <AuthDialogContext value={openAuthDialog}>
      <CommentsSection buildId="B1" ownerId="seed-ranni" />
    </AuthDialogContext>,
    { uid },
  );

/** The comment texts, top to bottom (each list item's own comment). */
const texts = () =>
  screen
    .getAllByRole('listitem')
    .flatMap((item) => [...item.querySelectorAll(':scope > div > p')].map((p) => p.textContent));

describe('CommentsSection', () => {
  it('with no comments, asks visitors to tell the author how it went', async () => {
    renderWithProviders(<CommentsSection buildId="B1" ownerId="seed-ranni" />, { uid: 'alice' });
    expect(await screen.findByText(/Tried it\? Tell/)).toHaveTextContent(
      'No comments yet. Tried it? Tell Ranni Fan how it went.',
    );
  });

  it('the build’s owner just sees "No comments yet."', async () => {
    renderWithProviders(<CommentsSection buildId="B1" ownerId="seed-ranni" />, {
      uid: 'seed-ranni',
    });
    expect(await screen.findByText('No comments yet.')).toBeInTheDocument();
    expect(screen.queryByText(/Tried it/)).not.toBeInTheDocument();
  });

  it('lists comments with their count in the heading', async () => {
    firebase.listComments.mockResolvedValue([makeComment()]);
    renderWithProviders(<CommentsSection buildId="B1" ownerId="seed-ranni" />);
    expect(await screen.findByText('Nice build!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Comments · 1' })).toBeInTheDocument();
    expect(screen.queryByText(/No comments yet/)).not.toBeInTheDocument();
    // One thread: nothing to sort.
    expect(screen.queryByRole('group', { name: 'Sort comments' })).not.toBeInTheDocument();
  });

  it('Top first, Newest on request; replies under their comment; "Author" on the owner’s', async () => {
    firebase.listComments.mockResolvedValue([
      makeComment({ id: 'new', text: 'Newer', createdAt: day(5) }),
      makeComment({ id: 'liked', text: 'Liked', likeCount: 2, createdAt: day(1) }),
      makeComment({
        id: 'r1',
        text: 'Reply',
        authorId: 'seed-ranni',
        parentId: 'liked',
        createdAt: day(6),
      }),
    ]);
    const { user } = render();
    await screen.findByText('Liked');
    expect(texts()).toEqual(['Liked', 'Reply', 'Newer']);
    await user.click(screen.getByRole('button', { name: 'Newest' }));
    expect(texts()).toEqual(['Newer', 'Liked', 'Reply']);
    expect(screen.getByRole('heading', { name: 'Comments · 3' })).toBeInTheDocument();
    const reply = screen.getByText('Reply', { selector: 'p' }).closest('div')!;
    expect(await within(reply).findByText('Author')).toBeInTheDocument();
  });

  it('likes and unlikes a comment at once', async () => {
    // A tiny server: the list and the user's likes refetch after each toggle.
    let likeCount = 1;
    const likes = new Set<string>();
    firebase.listComments.mockImplementation(() => Promise.resolve([makeComment({ likeCount })]));
    firebase.listCommentLikes.mockImplementation(() => Promise.resolve(new Set(likes)));
    firebase.likeComment.mockImplementation((_b: string, id: string) => {
      likeCount += 1;
      likes.add(id);
      return Promise.resolve();
    });
    firebase.unlikeComment.mockImplementation((_b: string, id: string) => {
      likeCount -= 1;
      likes.delete(id);
      return Promise.resolve();
    });
    const { user } = render('alice');
    const like = await screen.findByRole('button', { name: /^Like .*comment, 1 like$/ });
    await waitFor(() => expect(like).toBeEnabled());
    expect(like).toHaveAttribute('aria-pressed', 'false');
    await user.click(like);
    expect(firebase.likeComment).toHaveBeenCalledWith('B1', 'c1', 'alice');
    const liked = await screen.findByRole('button', { name: /comment, 2 likes$/ });
    expect(liked).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(liked).toBeEnabled());
    await user.click(liked);
    expect(firebase.unlikeComment).toHaveBeenCalledWith('B1', 'c1', 'alice');
    expect(await screen.findByRole('button', { name: /comment, 1 like$/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('a failed like rolls back', async () => {
    firebase.listComments.mockResolvedValue([makeComment()]);
    firebase.likeComment.mockRejectedValue(new Error('denied'));
    const { user } = render('alice');
    const like = await screen.findByRole('button', { name: /comment, 0 likes$/ });
    await waitFor(() => expect(like).toBeEnabled());
    await user.click(like);
    expect(await screen.findByText('error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /comment, 0 likes$/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('signed out, Like and Reply open the log-in dialog', async () => {
    firebase.listComments.mockResolvedValue([makeComment()]);
    const openAuthDialog = vi.fn();
    const { user } = render(null, openAuthDialog);
    await user.click(await screen.findByRole('button', { name: /^Like / }));
    await user.click(screen.getByRole('button', { name: /^Reply to / }));
    expect(openAuthDialog).toHaveBeenCalledTimes(2);
    expect(openAuthDialog).toHaveBeenCalledWith('login');
    expect(firebase.likeComment).not.toHaveBeenCalled();
  });

  it('replies under the top-level comment; a reply to a reply names who it answers', async () => {
    const stored = [
      makeComment({ id: 'top', text: 'Top' }),
      makeComment({ id: 'r1', text: 'First reply', authorId: 'bob', parentId: 'top' }),
    ];
    firebase.listComments.mockImplementation(() => Promise.resolve([...stored]));
    firebase.addComment.mockImplementation(
      (_build: string, authorId: string, text: string, parentId: string | null) => {
        const reply = makeComment({ id: 'r2', authorId, text, parentId, createdAt: day(9) });
        stored.push(reply);
        return Promise.resolve(reply);
      },
    );
    const { user } = render('alice');
    await user.click(await screen.findByRole('button', { name: 'Reply to bob' }));
    const box = screen.getByRole('textbox', { name: /^Reply to / });
    expect(box).toHaveValue('@bob ');
    expect(box).toHaveFocus();
    await user.type(box, 'thanks');
    await user.click(screen.getByRole('button', { name: 'Reply' }));
    expect(firebase.addComment).toHaveBeenCalledWith('B1', 'alice', '@bob thanks', 'top');
    expect(await screen.findByText('@bob thanks')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /^Reply to / })).not.toBeInTheDocument();
  });

  it('past three replies, the first two and "Show N more replies"', async () => {
    firebase.listComments.mockResolvedValue([
      makeComment({ id: 'top', text: 'Top' }),
      ...[1, 2, 3, 4].map((n) =>
        makeComment({ id: `r${n}`, text: `Reply ${n}`, parentId: 'top', createdAt: day(n + 1) }),
      ),
    ]);
    const { user } = render();
    await screen.findByText('Reply 1');
    expect(screen.queryByText('Reply 3')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show 2 more replies' }));
    expect(screen.getByText('Reply 4')).toBeInTheDocument();
  });

  it('replies of a deleted comment stay under "Comment deleted", with no Reply', async () => {
    firebase.listComments.mockResolvedValue([
      makeComment({ id: 'r1', text: 'Orphan', parentId: 'gone' }),
    ]);
    render();
    expect(await screen.findByText('Comment deleted')).toBeInTheDocument();
    expect(screen.getByText('Orphan')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Reply to / })).not.toBeInTheDocument();
  });
});
