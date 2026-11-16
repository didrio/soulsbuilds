import { useState } from 'react';
import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import SignUp from './SignUp';

const firebase = vi.hoisted(() => ({ signUp: vi.fn(), signInWithGoogle: vi.fn() }));
vi.mock('@/lib/firebase', () => ({
  ...firebase,
  errorMessage: (error: Error) => error.message,
  errorField: (error: Error & { field?: string }) => error.field ?? null,
}));

function Form({ onDone }: { onDone: (uid: string) => Promise<void> }) {
  const [email, setEmail] = useState('');
  return <SignUp email={email} onEmail={setEmail} onDone={onDone} onSwitch={() => {}} />;
}

const setup = () => {
  const onDone = vi.fn(() => Promise.resolve());
  return { onDone, ...renderWithProviders(<Form onDone={onDone} />) };
};

beforeEach(() => vi.resetAllMocks());

describe('SignUp', () => {
  it('asks only for an email and a password, with the length as a hint', () => {
    setup();
    expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password');
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('At least 8 characters.');
    expect(screen.queryByLabelText('Display name')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
  });

  it('checks the fields before creating anything, and focuses the first problem', async () => {
    const { user } = setup();
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByLabelText('Email')).toHaveFocus();
    expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter your email address.');
    await user.type(screen.getByLabelText('Email'), 'new@example.test');
    await user.type(screen.getByLabelText('Password'), 'short{Enter}');
    const password = screen.getByLabelText('Password');
    expect(password).toHaveFocus();
    expect(password).toHaveAttribute('aria-invalid', 'true');
    expect(password).toHaveAccessibleDescription('Choose a password of at least 8 characters.');
    expect(firebase.signUp).not.toHaveBeenCalled();
    // Editing the field drops its now out-of-date error.
    await user.type(password, '-and-longer');
    expect(password).not.toHaveAttribute('aria-invalid');
    expect(password).toHaveAccessibleDescription('At least 8 characters.');
  });

  it('shows a Firebase error next to the field it is about', async () => {
    firebase.signUp.mockRejectedValue(
      Object.assign(new Error('An account with that email already exists.'), { field: 'email' }),
    );
    const { user, onDone } = setup();
    await user.type(screen.getByLabelText('Email'), 'taken@example.test');
    await user.type(screen.getByLabelText('Password'), 'secret-123{Enter}');
    const email = screen.getByLabelText('Email');
    await vi.waitFor(() => expect(email).toHaveFocus());
    expect(email).toHaveAccessibleDescription('An account with that email already exists.');
    expect(firebase.signUp).toHaveBeenCalledWith('taken@example.test', 'secret-123');
    expect(onDone).not.toHaveBeenCalled();
  });

  it('continues with the new account', async () => {
    firebase.signUp.mockResolvedValue('u1');
    const { user, onDone } = setup();
    await user.type(screen.getByLabelText('Email'), 'new@example.test');
    await user.type(screen.getByLabelText('Password'), 'secret-123{Enter}');
    await vi.waitFor(() => expect(onDone).toHaveBeenCalledWith('u1'));
  });

  it('links the Terms and the Privacy policy (no checkbox)', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveAttribute(
      'href',
      '/privacy',
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
