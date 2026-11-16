import { useState } from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import Login from './Login';

const firebase = vi.hoisted(() => ({ signIn: vi.fn(), signInWithGoogle: vi.fn() }));
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  errorMessage: (error: Error) => error.message,
  errorField: (error: Error & { field?: string }) => error.field ?? null,
}));

function Form({ onDone }: { onDone: (uid: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  return (
    <Login
      email={email}
      onEmail={setEmail}
      onDone={onDone}
      onForgot={() => {}}
      onSwitch={() => {}}
    />
  );
}

const setup = () => {
  const onDone = vi.fn(() => Promise.resolve());
  return { onDone, ...renderWithProviders(<Form onDone={onDone} />) };
};

beforeEach(() => vi.resetAllMocks());

describe('Login', () => {
  it('fills from password managers', () => {
    setup();
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'username');
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'current-password');
  });

  it('says which field is missing', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Email'), 'me@example.test{Enter}');
    expect(screen.getByLabelText('Password')).toHaveFocus();
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Enter your password.');
    expect(firebase.signIn).not.toHaveBeenCalled();
  });

  it('shows wrong credentials for the form as a whole', async () => {
    firebase.signIn.mockRejectedValue(new Error('Wrong email or password.'));
    const { user, onDone } = setup();
    await user.type(screen.getByLabelText('Email'), 'me@example.test');
    await user.type(screen.getByLabelText('Password'), 'nope-nope{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.');
    expect(screen.getByLabelText('Email')).not.toHaveAttribute('aria-invalid');
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('shows a Google error, and nothing when the popup was closed', async () => {
    firebase.signInWithGoogle.mockResolvedValueOnce(null);
    const { user, onDone } = setup();
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();

    firebase.signInWithGoogle.mockRejectedValueOnce(new Error('Allow pop-ups and try again.'));
    await user.click(screen.getByRole('button', { name: 'Continue with Google' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Allow pop-ups');
  });
});
