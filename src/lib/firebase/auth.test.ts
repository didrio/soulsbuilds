import { FirebaseError } from 'firebase/app';
import { describe, expect, it, vi } from 'vitest';
import {
  errorField,
  errorMessage,
  hasPassword,
  isWrongPassword,
  onAuthChange,
  sendPasswordReset,
} from './auth';

vi.mock('./app', () => ({ auth: {}, USE_EMULATORS: false }));
const sendPasswordResetEmail = vi.hoisted(() => vi.fn());
const onAuthStateChanged = vi.hoisted(() => vi.fn());
const signOut = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('firebase/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/auth')>()),
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
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

  it('asks to confirm again after an old sign-in (T31)', () => {
    expect(errorMessage(authError('auth/requires-recent-login'))).toMatch(/confirm it’s you again/);
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
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({}, 'nobody@example.test', {
      url: 'https://soulsbuilds.com',
    });
  });

  it('links back to the site from the default action page', async () => {
    sendPasswordResetEmail.mockResolvedValueOnce(undefined);
    await sendPasswordReset('me@example.test');
    expect(sendPasswordResetEmail).toHaveBeenLastCalledWith({}, 'me@example.test', {
      url: 'https://soulsbuilds.com',
    });
  });

  it('still reports other errors', async () => {
    sendPasswordResetEmail.mockRejectedValueOnce(authError('auth/invalid-email'));
    await expect(sendPasswordReset('nope')).rejects.toThrow('auth/invalid-email');
  });
});

describe('isWrongPassword (T31)', () => {
  it('is true for both wrong-password codes only', () => {
    expect(isWrongPassword(authError('auth/invalid-credential'))).toBe(true);
    expect(isWrongPassword(authError('auth/wrong-password'))).toBe(true);
    expect(isWrongPassword(authError('auth/weak-password'))).toBe(false);
    expect(isWrongPassword(new Error('auth/wrong-password'))).toBe(false);
  });
});

describe('onAuthChange', () => {
  // Calls the listener onAuthChange registered with a user whose token renewal fails with `error`.
  const onDeadSession = vi.fn();
  const restore = async (error: Error | null) => {
    const callback = vi.fn();
    onAuthChange(callback, onDeadSession);
    const listener = onAuthStateChanged.mock.lastCall?.[1] as (user: unknown) => void;
    const user = {
      uid: 'alice',
      getIdToken: () => (error ? Promise.reject(error) : Promise.resolve('token')),
    };
    listener(user);
    await new Promise((resolve) => setTimeout(resolve, 0));
    return callback;
  };

  it('signs out a saved session that can never renew (e.g. the emulator was re-seeded)', async () => {
    signOut.mockClear();
    onDeadSession.mockClear();
    const callback = await restore(authError('auth/invalid-refresh-token'));
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ uid: 'alice' }));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(onDeadSession).toHaveBeenCalledTimes(1);
  });

  it('keeps the session on a network error or a working token', async () => {
    signOut.mockClear();
    onDeadSession.mockClear();
    await restore(authError('auth/network-request-failed'));
    await restore(null);
    expect(signOut).not.toHaveBeenCalled();
    expect(onDeadSession).not.toHaveBeenCalled();
  });
});
