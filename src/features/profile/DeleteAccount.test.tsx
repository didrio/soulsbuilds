import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import Profile from './Profile';

const firebase = vi.hoisted(() => ({
  deleteAccount: vi.fn(),
  getUserProfile: vi.fn(),
  listUserBuilds: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  listLikedBuildIds: () => Promise.resolve([]),
  getBuild: () => Promise.resolve(null),
  updateDisplayName: vi.fn(),
  resendVerificationEmail: vi.fn(),
  errorMessage: () => 'Wrong email or password.',
}));

const alice = { id: 'alice', displayName: 'Alice', createdAt: new Date('2026-01-01') };
const asProfile = (uid: string | null) =>
  renderWithProviders(<Profile />, { route: '/user/alice', path: '/user/:userId', uid });

beforeEach(() => {
  firebase.getUserProfile.mockResolvedValue(alice);
  firebase.listUserBuilds.mockResolvedValue([]);
  firebase.deleteAccount.mockReset();
});

describe('Delete account', () => {
  it('is offered only on your own profile', async () => {
    asProfile('bob');
    expect(await screen.findByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete account' })).not.toBeInTheDocument();
  });

  it('says what goes and needs your password', async () => {
    const { user } = asProfile('alice');
    await user.click(await screen.findByRole('button', { name: 'Delete account' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete your account?' });
    expect(within(dialog).getByText('your builds, with their likes and comments')).toBeVisible();
    expect(within(dialog).getByText('your comments and likes on other builds')).toBeVisible();
    expect(within(dialog).getByText('your reports')).toBeVisible();
    const submit = within(dialog).getByRole('button', { name: 'Delete my account' });
    expect(submit).toBeDisabled();
    await user.type(within(dialog).getByLabelText('Your password'), 'secret-123');
    expect(submit).toBeEnabled();
  });

  it('shows why it failed and keeps the dialog for a retry', async () => {
    firebase.deleteAccount.mockRejectedValue(new Error('auth/invalid-credential'));
    const { user } = asProfile('alice');
    await user.click(await screen.findByRole('button', { name: 'Delete account' }));
    await user.type(screen.getByLabelText('Your password'), 'wrong{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.');
    expect(firebase.deleteAccount).toHaveBeenCalledWith('wrong', expect.any(Function));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('goes home once the account is deleted', async () => {
    firebase.deleteAccount.mockResolvedValue(undefined);
    const { user } = asProfile('alice');
    await user.click(await screen.findByRole('button', { name: 'Delete account' }));
    await user.type(screen.getByLabelText('Your password'), 'secret-123');
    await user.click(screen.getByRole('button', { name: 'Delete my account' }));
    expect(await screen.findByText('other page')).toBeInTheDocument();
  });

  it('offers to finish on your own profile once the profile doc is gone', async () => {
    firebase.getUserProfile.mockResolvedValue(null);
    asProfile('alice');
    expect(
      await screen.findByRole('button', { name: 'Finish deleting your account' }),
    ).toBeInTheDocument();
  });
});
