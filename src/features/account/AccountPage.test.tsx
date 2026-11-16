import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import AccountPage from './AccountPage';

const firebase = vi.hoisted(() => ({
  getUserProfile: vi.fn(),
  updateDisplayName: vi.fn(),
  resendVerificationEmail: vi.fn(),
  changeEmail: vi.fn(),
  changePassword: vi.fn(),
  setPassword: vi.fn(),
  signOut: vi.fn(),
}));
// Auth errors faked as plain errors: the message is shown, `field` says which field it's about.
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  errorMessage: (error: Error) => error.message,
  errorField: (error: Error & { field?: string }) => error.field ?? null,
  isWrongPassword: (error: Error) => error.message === 'wrong password',
}));

const alice = { id: 'alice', displayName: 'Alice', createdAt: new Date('2026-01-01') };

const renderAccount = (options: Parameters<typeof renderWithProviders>[1] = {}) =>
  renderWithProviders(<AccountPage />, {
    route: '/account',
    path: '/account',
    uid: 'alice',
    ...options,
  });

const section = (name: string) => screen.getByRole('region', { name });

beforeEach(() => {
  vi.resetAllMocks();
  firebase.getUserProfile.mockResolvedValue(alice);
});

describe('Account page (T31)', () => {
  it('signed out: asks to log in', async () => {
    renderAccount({ uid: null });
    expect(screen.getByText('Log in to see your account')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(firebase.getUserProfile).not.toHaveBeenCalled();
  });

  it('reloads the user on open, links the public profile and logs out', async () => {
    const refreshUser = vi.fn(() => Promise.resolve());
    const { user } = renderAccount({ refreshUser });
    expect(await screen.findByRole('heading', { level: 1, name: 'Account' })).toBeVisible();
    expect(refreshUser).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'View your public profile' })).toHaveAttribute(
      'href',
      '/user/alice',
    );
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(firebase.signOut).toHaveBeenCalled();
  });

  it('renames: Save is off until the name changes', async () => {
    firebase.updateDisplayName.mockResolvedValue(undefined);
    const { user } = renderAccount();
    const field = await screen.findByRole('textbox', { name: 'Display name' });
    expect(field).toHaveValue('Alice');
    const save = screen.getByRole('button', { name: 'Save name' });
    expect(save).toBeDisabled();
    await user.clear(field);
    await user.type(field, 'Alice the Bold');
    await user.click(save);
    expect(firebase.updateDisplayName).toHaveBeenCalledWith('alice', 'Alice the Bold');
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
  });

  describe('Email', () => {
    it('shows the address, and Resend until it’s verified', async () => {
      firebase.resendVerificationEmail.mockResolvedValue(undefined);
      const { user } = renderAccount({ emailVerified: false });
      await screen.findByRole('heading', { name: 'Email' });
      const email = section('Email');
      expect(within(email).getByText('alice@example.com')).toBeInTheDocument();
      expect(within(email).queryByText('Verified')).not.toBeInTheDocument();
      await user.click(within(email).getByRole('button', { name: 'Resend email' }));
      expect(await within(email).findByText(/Verification email sent/)).toBeInTheDocument();
    });

    it('changes it with a link to the new address, after the current password', async () => {
      firebase.changeEmail.mockResolvedValue(undefined);
      const { user } = renderAccount();
      await screen.findByRole('heading', { name: 'Email' });
      const email = section('Email');
      expect(within(email).getByText('Verified')).toBeInTheDocument();
      const toggle = within(email).getByRole('button', { name: 'Change email' });
      await user.click(toggle);
      expect(toggle).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByLabelText('New email')).toHaveFocus();

      await user.click(screen.getByRole('button', { name: 'Send link' }));
      expect(screen.getByLabelText('New email')).toHaveAccessibleDescription(
        'Enter your new email address.',
      );
      expect(screen.getByLabelText('Current password')).toHaveAccessibleDescription(
        'Enter your current password.',
      );

      await user.type(screen.getByLabelText('New email'), 'ALICE@example.com');
      await user.type(screen.getByLabelText('Current password'), 'secret-123');
      await user.click(screen.getByRole('button', { name: 'Send link' }));
      expect(screen.getByLabelText('New email')).toHaveAccessibleDescription(
        'That’s already your email.',
      );
      expect(firebase.changeEmail).not.toHaveBeenCalled();

      await user.clear(screen.getByLabelText('New email'));
      await user.type(screen.getByLabelText('New email'), 'new@example.com');
      await user.click(screen.getByRole('button', { name: 'Send link' }));
      expect(firebase.changeEmail).toHaveBeenCalledWith('new@example.com', 'secret-123');
      expect(await screen.findByText(/We sent a link to new@example.com/)).toBeInTheDocument();
      expect(screen.queryByLabelText('New email')).not.toBeInTheDocument();
    });

    it('a wrong password is about the current password, next to it', async () => {
      firebase.changeEmail.mockRejectedValue(new Error('wrong password'));
      const { user } = renderAccount();
      await user.click(await screen.findByRole('button', { name: 'Change email' }));
      await user.type(screen.getByLabelText('New email'), 'new@example.com');
      await user.type(screen.getByLabelText('Current password'), 'wrong');
      await user.click(screen.getByRole('button', { name: 'Send link' }));
      const password = screen.getByLabelText('Current password');
      expect(await screen.findByText('That’s not your current password.')).toBeInTheDocument();
      expect(password).toHaveAccessibleDescription('That’s not your current password.');
      expect(password).toHaveFocus();
    });

    it('a Google account can’t change it here', async () => {
      renderAccount({ providers: ['google.com'] });
      await screen.findByRole('heading', { name: 'Email' });
      expect(screen.getByText(/It comes from your Google account/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Change email' })).not.toBeInTheDocument();
    });
  });

  describe('Sign-in', () => {
    it('changes the password with the current one; 8 characters at least', async () => {
      firebase.changePassword.mockResolvedValue(undefined);
      const { user } = renderAccount();
      await screen.findByRole('heading', { name: 'Sign-in' });
      expect(within(section('Sign-in')).queryByText('Google')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Change password' }));
      const form = screen.getByRole('form', { name: 'Change password' });
      await user.type(within(form).getByLabelText('Current password'), 'old-secret');
      await user.type(within(form).getByLabelText('New password'), 'short');
      await user.click(within(form).getByRole('button', { name: 'Change password' }));
      expect(within(form).getByLabelText('New password')).toHaveAccessibleDescription(
        'At least 8 characters. Choose a password of at least 8 characters.',
      );

      await user.type(within(form).getByLabelText('New password'), '-and-longer');
      await user.click(within(form).getByRole('button', { name: 'Change password' }));
      expect(firebase.changePassword).toHaveBeenCalledWith('old-secret', 'short-and-longer');
      expect(await screen.findByText('Password changed.')).toBeInTheDocument();
      expect(form).not.toBeInTheDocument();
    });

    it('Google only: shows Google and sets a password, confirmed with Google', async () => {
      firebase.setPassword.mockResolvedValue(true);
      const refreshUser = vi.fn(() => Promise.resolve());
      const { user } = renderAccount({ providers: ['google.com'], refreshUser });
      await screen.findByRole('heading', { name: 'Sign-in' });
      const signIn = section('Sign-in');
      expect(within(signIn).getByText('Google')).toBeInTheDocument();
      expect(within(signIn).getByText('Not set')).toBeInTheDocument();
      await user.click(within(signIn).getByRole('button', { name: 'Set a password' }));
      await user.type(screen.getByLabelText('New password'), 'a-new-secret');
      await user.click(
        screen.getByRole('button', { name: 'Confirm with Google and set password' }),
      );
      expect(firebase.setPassword).toHaveBeenCalledWith('a-new-secret');
      expect(await screen.findByText(/Password set/)).toBeInTheDocument();
      expect(refreshUser).toHaveBeenCalledTimes(2); // on open, then after setting it
    });

    it('closing the Google window changes nothing and keeps the form', async () => {
      firebase.setPassword.mockResolvedValue(false);
      const { user } = renderAccount({ providers: ['google.com'] });
      await user.click(await screen.findByRole('button', { name: 'Set a password' }));
      await user.type(screen.getByLabelText('New password'), 'a-new-secret');
      const submit = screen.getByRole('button', { name: 'Confirm with Google and set password' });
      await user.click(submit);
      expect(
        await screen.findByRole('button', { name: 'Confirm with Google and set password' }),
      ).toBeEnabled();
      expect(screen.queryByText(/Password set/)).not.toBeInTheDocument();
    });
  });
});
