import { FirebaseError } from 'firebase/app';
import { describe, expect, it, vi } from 'vitest';
import { errorField, errorMessage, hasPassword, sendPasswordReset } from './auth';

vi.mock('./app', () => ({ auth: {} }));
const sendPasswordResetEmail = vi.hoisted(() => vi.fn());
vi.mock('firebase/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/auth')>()),
  sendPasswordResetEmail,
}));

const authError = (code: string) => new FirebaseError(code, code);

describe('errorMessage', () => {
  it('asks for 8 characters on a too-short password, from either check (T30)', () => {
    expect(errorMessage(authError('auth/weak-password'))).toBe(
      'Choose a password of at least 8 characters.',
    );
    expect(errorMessage(authError('auth/password-does-not-meet-requirements'))).toBe(
      'Choose a password of at least 8 characters.',
    );
  });

  it('never says whether the email or the password was wrong', () => {
    for (const code of ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found']) {
      expect(errorMessage(authError(code))).toBe('Wrong email or password.');
    }
  });

  it('explains Google sign-in problems', () => {
    expect(errorMessage(authError('auth/popup-blocked'))).toMatch(/Allow pop-ups/);
    expect(errorMessage(authError('auth/account-exists-with-different-credential'))).toMatch(
      /Log in with your email and password/,
    );
  });

  it('falls back to a generic message', () => {
    expect(errorMessage(new Error('boom'))).toBe('Something went wrong. Please try again.');
  });
});

describe('errorField', () => {
  it('puts each error next to the field it is about', () => {
    expect(errorField(authError('auth/invalid-email'))).toBe('email');
    expect(errorField(authError('auth/email-already-in-use'))).toBe('email');
    expect(errorField(authError('auth/password-does-not-meet-requirements'))).toBe('password');
    expect(errorField(authError('auth/invalid-credential'))).toBeNull();
    expect(errorField(new Error('boom'))).toBeNull();
  });
});

describe('hasPassword', () => {
  it('is true only with the password provider', () => {
    const user = (...ids: string[]) => ({
      providerData: ids.map((providerId) => ({ providerId })),
    });
    expect(hasPassword(user('password') as never)).toBe(true);
    expect(hasPassword(user('google.com', 'password') as never)).toBe(true);
    expect(hasPassword(user('google.com') as never)).toBe(false);
  });
});

describe('sendPasswordReset', () => {
  it('answers the same for an email without an account', async () => {
    sendPasswordResetEmail.mockRejectedValueOnce(authError('auth/user-not-found'));
    await expect(sendPasswordReset(' nobody@example.test ')).resolves.toBeUndefined();
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({}, 'nobody@example.test');
  });

  it('still reports other errors', async () => {
    sendPasswordResetEmail.mockRejectedValueOnce(authError('auth/invalid-email'));
    await expect(sendPasswordReset('nope')).rejects.toThrow('auth/invalid-email');
  });
});
