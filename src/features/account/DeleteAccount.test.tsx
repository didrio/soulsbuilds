import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import AccountPage from './AccountPage';

const firebase = vi.hoisted(() => ({
  deleteAccount: vi.fn(),
  getUserProfile: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  errorMessage: () => 'Wrong email or password.',
}));

const alice = { id: 'alice', displayName: 'Alice', createdAt: new Date('2026-01-01') };
let providers = ['password'];
// The Account page (T31; T18 had it at the bottom of the profile).
const asProfile = (uid: string) =>
  renderWithProviders(<AccountPage />, { route: '/account', path: '/account', uid, providers });

beforeEach(() => {
  firebase.getUserProfile.mockResolvedValue(alice);
  firebase.deleteAccount.mockReset();
  providers = ['password'];
});

describe('Delete account', () => {
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
    firebase.deleteAccount.mockResolvedValue(true);
    const { user } = asProfile('alice');
    await user.click(await screen.findByRole('button', { name: 'Delete account' }));
    await user.type(screen.getByLabelText('Your password'), 'secret-123');
    await user.click(screen.getByRole('button', { name: 'Delete my account' }));
    expect(await screen.findByText('other page')).toBeInTheDocument();
  });

  it('a Google-only account confirms with Google instead of a password (T30)', async () => {
    providers = ['google.com'];
    firebase.deleteAccount.mockResolvedValue(true);
    const { user } = asProfile('alice');
    await user.click(await screen.findByRole('button', { name: 'Delete account' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete your account?' });
    expect(within(dialog).queryByLabelText('Your password')).not.toBeInTheDocument();
    await user.click(
      within(dialog).getByRole('button', { name: 'Confirm with Google and delete' }),
    );
    expect(firebase.deleteAccount).toHaveBeenCalledWith(null, expect.any(Function));
    expect(await screen.findByText('other page')).toBeInTheDocument();
  });

  it('closing the Google window deletes nothing and keeps the dialog', async () => {
    providers = ['google.com'];
    firebase.deleteAccount.mockResolvedValue(false);
    const { user } = asProfile('alice');
    await user.click(await screen.findByRole('button', { name: 'Delete account' }));
    await user.click(screen.getByRole('button', { name: 'Confirm with Google and delete' }));
    expect(
      await screen.findByRole('button', { name: 'Confirm with Google and delete' }),
    ).toBeEnabled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByText('other page')).not.toBeInTheDocument();
  });

  it('offers to finish once the profile doc is gone', async () => {
    firebase.getUserProfile.mockResolvedValue(null);
    asProfile('alice');
    expect(
      await screen.findByRole('button', { name: 'Finish deleting your account' }),
    ).toBeInTheDocument();
  });
});
