import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import ActionPage from './ActionPage';

const firebase = vi.hoisted(() => ({
  checkPasswordResetCode: vi.fn(),
  confirmNewPassword: vi.fn(),
  applyEmailLink: vi.fn(),
  resendVerificationEmail: vi.fn(),
  sendPasswordReset: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  isDeadLink: (error: Error & { dead?: boolean }) => error.dead === true,
  errorMessage: (error: Error) => error.message,
  errorField: (error: Error & { field?: string }) => error.field ?? null,
}));

const dead = () => Object.assign(new Error('This link has expired.'), { dead: true });

const setup = (query: string, options: Parameters<typeof renderWithProviders>[1] = {}) =>
  renderWithProviders(<ActionPage />, { route: `/auth/action${query}`, ...options });

beforeEach(() => vi.resetAllMocks());

describe('ActionPage: reset password', () => {
  const link = '?mode=resetPassword&oobCode=abc';

  it('shows the account and sets the new password, then offers to log in', async () => {
    firebase.checkPasswordResetCode.mockResolvedValue('me@example.test');
    firebase.confirmNewPassword.mockResolvedValue(undefined);
    const { user } = setup(link);
    expect(await screen.findByText('For me@example.test.')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toHaveAttribute('autocomplete', 'new-password');

    await user.type(screen.getByLabelText('New password'), 'a-better-one{Enter}');
    expect(firebase.confirmNewPassword).toHaveBeenCalledWith('abc', 'a-better-one');
    expect(await screen.findByRole('heading', { name: 'Password changed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('says what is wrong with a short password, next to the field, without calling Auth', async () => {
    firebase.checkPasswordResetCode.mockResolvedValue('me@example.test');
    const { user } = setup(link);
    await user.type(await screen.findByLabelText('New password'), 'short{Enter}');
    expect(screen.getByLabelText('New password')).toHaveFocus();
    expect(screen.getByLabelText('New password')).toHaveAccessibleDescription(
      'Choose a password of at least 8 characters.',
    );
    expect(firebase.confirmNewPassword).not.toHaveBeenCalled();
  });

  it('shows an expired link as such and lets you ask again', async () => {
    firebase.checkPasswordResetCode.mockRejectedValue(dead());
    firebase.sendPasswordReset.mockResolvedValue(undefined);
    const { user } = setup(link);
    expect(await screen.findByRole('heading', { name: 'This link has expired' })).toBeVisible();
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Email'), 'me@example.test');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));
    expect(firebase.sendPasswordReset).toHaveBeenCalledWith('me@example.test');
    expect(await screen.findByRole('status')).toHaveTextContent('a reset link is on its way');
  });

  it('turns into the expired view when the link dies while the form is open', async () => {
    firebase.checkPasswordResetCode.mockResolvedValue('me@example.test');
    firebase.confirmNewPassword.mockRejectedValue(dead());
    const { user } = setup(link);
    await user.type(await screen.findByLabelText('New password'), 'a-better-one{Enter}');
    expect(await screen.findByRole('heading', { name: 'This link has expired' })).toBeVisible();
  });

  it('shows a password error from Auth next to the field', async () => {
    firebase.checkPasswordResetCode.mockResolvedValue('me@example.test');
    firebase.confirmNewPassword.mockRejectedValue(
      Object.assign(new Error('Too weak.'), { field: 'password' }),
    );
    const { user } = setup(link);
    await user.type(await screen.findByLabelText('New password'), 'a-better-one{Enter}');
    expect(await screen.findByText('Too weak.')).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toHaveAttribute('aria-invalid', 'true');
  });

  it('offers a retry when the link could not be checked at all', async () => {
    firebase.checkPasswordResetCode.mockRejectedValue(new Error('Network error.'));
    setup(link);
    expect(await screen.findByText('Network error.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});

describe('ActionPage: verify email', () => {
  it('applies the link once and confirms', async () => {
    firebase.applyEmailLink.mockResolvedValue(undefined);
    setup('?mode=verifyEmail&oobCode=xyz', { uid: 'alice' });
    expect(await screen.findByRole('heading', { name: 'Email verified' })).toBeInTheDocument();
    expect(firebase.applyEmailLink).toHaveBeenCalledTimes(1);
    expect(firebase.applyEmailLink).toHaveBeenCalledWith('xyz');
    expect(screen.getByRole('link', { name: 'Go to your account' })).toHaveAttribute(
      'href',
      '/account',
    );
  });

  it('offers to log in when signed out', async () => {
    firebase.applyEmailLink.mockResolvedValue(undefined);
    setup('?mode=verifyEmail&oobCode=xyz');
    expect(await screen.findByRole('heading', { name: 'Email verified' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('says an email change went through, and asks to log in with the new address', async () => {
    firebase.applyEmailLink.mockResolvedValue(undefined);
    setup('?mode=verifyAndChangeEmail&oobCode=xyz', { uid: 'alice' });
    expect(await screen.findByRole('heading', { name: 'Email changed' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('lets a signed-in user send a new link when it expired', async () => {
    firebase.applyEmailLink.mockRejectedValue(dead());
    firebase.resendVerificationEmail.mockResolvedValue(undefined);
    const { user } = setup('?mode=verifyEmail&oobCode=xyz', { uid: 'alice' });
    expect(await screen.findByRole('heading', { name: 'This link has expired' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Send a new link' }));
    expect(firebase.resendVerificationEmail).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('status')).toHaveTextContent('A new link is on its way.');
  });

  it('points a signed-out visitor with an expired link to Log in, then Resend', async () => {
    firebase.applyEmailLink.mockRejectedValue(dead());
    setup('?mode=verifyEmail&oobCode=xyz');
    expect(await screen.findByRole('heading', { name: 'This link has expired' })).toBeVisible();
    expect(screen.getByText(/choose Resend on your account page/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeInTheDocument();
  });

  it('sends an expired email change back to the account page', async () => {
    firebase.applyEmailLink.mockRejectedValue(dead());
    setup('?mode=verifyAndChangeEmail&oobCode=xyz', { uid: 'alice' });
    expect(await screen.findByRole('link', { name: 'Go to your account' })).toBeVisible();
  });
});

describe('ActionPage: other links', () => {
  it.each(['', '?mode=resetPassword', '?oobCode=abc', '?mode=recoverEmail&oobCode=abc'])(
    'says %j can’t be used',
    (query) => {
      setup(query);
      expect(screen.getByRole('heading', { name: 'This link can’t be used' })).toBeInTheDocument();
      expect(firebase.checkPasswordResetCode).not.toHaveBeenCalled();
      expect(firebase.applyEmailLink).not.toHaveBeenCalled();
    },
  );
});
