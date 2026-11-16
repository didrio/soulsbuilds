import { useState } from 'react';
import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import AuthDialog, { type AuthDialogState } from './AuthDialog';

const firebase = vi.hoisted(() => ({
  createUserProfile: vi.fn(),
  getUserProfile: vi.fn(),
  sendPasswordReset: vi.fn(),
  signIn: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  signUp: vi.fn(),
}));
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  errorMessage: (error: Error) => error.message,
  errorField: () => null,
}));

const melina = { id: 'u1', displayName: 'Melina', createdAt: new Date('2026-01-01') };

/** The dialog with App's state around it. */
function Shell({ initial }: { initial: AuthDialogState }) {
  const [state, setState] = useState<AuthDialogState | null>(initial);
  return state ? <AuthDialog state={state} uid={null} onChange={setState} /> : <p>closed</p>;
}

const open = (view: AuthDialogState['view']) => {
  const onSignedIn = vi.fn();
  return { onSignedIn, ...renderWithProviders(<Shell initial={{ view, onSignedIn }} />) };
};

beforeEach(() => {
  vi.resetAllMocks();
  firebase.signOut.mockResolvedValue(undefined);
});

describe('AuthDialog', () => {
  it('logging in with a profile continues and closes', async () => {
    firebase.signIn.mockResolvedValue('u1');
    firebase.getUserProfile.mockResolvedValue(melina);
    const { user, onSignedIn } = open('login');
    await user.type(screen.getByLabelText('Email'), 'me@example.test');
    await user.type(screen.getByLabelText('Password'), 'secret-123{Enter}');
    expect(await screen.findByText('closed')).toBeInTheDocument();
    expect(onSignedIn).toHaveBeenCalledWith('u1');
  });

  it('a new account chooses a display name, then continues', async () => {
    firebase.signUp.mockResolvedValue('u1');
    firebase.getUserProfile.mockResolvedValueOnce(null).mockResolvedValue(melina);
    firebase.createUserProfile.mockResolvedValue(undefined);
    const { user, onSignedIn } = open('signup');
    await user.type(screen.getByLabelText('Email'), 'new@example.test');
    await user.type(screen.getByLabelText('Password'), 'secret-123{Enter}');

    const dialog = await screen.findByRole('dialog', { name: 'Choose a display name' });
    expect(within(dialog).getByLabelText('Display name')).toHaveFocus();
    expect(onSignedIn).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Continue' }));
    expect(within(dialog).getByLabelText('Display name')).toHaveAccessibleDescription(
      'Choose a name to show on your builds.',
    );
    await user.type(within(dialog).getByLabelText('Display name'), 'Melina{Enter}');
    expect(await screen.findByText('closed')).toBeInTheDocument();
    expect(firebase.createUserProfile).toHaveBeenCalledWith('u1', 'Melina');
    expect(onSignedIn).toHaveBeenCalledWith('u1');
  });

  it('a new Google account gets the name step too', async () => {
    firebase.signInWithGoogle.mockResolvedValue('g1');
    firebase.getUserProfile.mockResolvedValue(null);
    const { user } = open('login');
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(await screen.findByRole('dialog', { name: 'Choose a display name' })).toBeVisible();
  });

  it('closing the name step logs out', async () => {
    const { user } = renderWithProviders(<Shell initial={{ view: 'name', uid: 'u1' }} />);
    await user.click(screen.getByRole('button', { name: 'Log out' }));
    expect(firebase.signOut).toHaveBeenCalled();
    expect(screen.getByText('closed')).toBeInTheDocument();
  });

  it('“Forgot password?” keeps the email and answers the same either way', async () => {
    firebase.sendPasswordReset.mockResolvedValue(undefined);
    const { user } = open('login');
    await user.type(screen.getByLabelText('Email'), 'me@example.test');
    await user.click(screen.getByRole('button', { name: 'Forgot password?' }));
    const dialog = screen.getByRole('dialog', { name: 'Reset your password' });
    expect(within(dialog).getByLabelText('Email')).toHaveValue('me@example.test');
    await user.click(within(dialog).getByRole('button', { name: 'Send reset link' }));
    expect(await within(dialog).findByRole('status')).toHaveTextContent(
      'If there’s an account for me@example.test, a reset link is on its way.',
    );
    expect(firebase.sendPasswordReset).toHaveBeenCalledWith('me@example.test');
    await user.click(within(dialog).getByRole('button', { name: 'Back to log in' }));
    expect(screen.getByRole('dialog', { name: 'Log in' })).toBeVisible();
  });
});
