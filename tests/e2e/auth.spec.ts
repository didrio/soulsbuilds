// Sign up and log in (T30): email + password with the display-name step, log out and back in where
// you were, "Forgot password?" and Google in the Auth emulator's popup. Signing up from the
// planner's Save (T68) is in build-flow.spec.ts. `npm run e2e`.
import { expect, test } from '@playwright/test';
import {
  accountButton,
  accountMenu,
  chooseName,
  E2E_PASSWORD,
  headerLogIn,
  pickGoogleAccount,
  uniqueId,
} from './helpers';

const SEED_BUILD = '/build/SEEDBLEED001';

test('sign up, choose a name, log out, log in where you were, reset request', async ({ page }) => {
  const unique = uniqueId();
  const email = `auth-${unique}@example.test`;
  const name = `Auth ${unique}`;
  await page.goto(SEED_BUILD);

  await page.getByRole('button', { name: 'Sign up' }).click();
  const signUp = page.getByRole('form', { name: 'Sign up' });
  await expect(signUp.getByLabel('Display name')).toHaveCount(0);
  await signUp.getByLabel('Email').fill(email);
  // Too short: the error sits under the field, which gets focus.
  await signUp.getByLabel('Password').fill('short');
  await signUp.getByRole('button', { name: 'Create account' }).click();
  await expect(signUp.getByLabel('Password')).toBeFocused();
  await expect(signUp.getByText('Choose a password of at least 8 characters.')).toBeVisible();
  // Show / Hide.
  await signUp.getByRole('button', { name: 'Show password' }).click();
  await expect(signUp.getByLabel('Password')).toHaveAttribute('type', 'text');
  await signUp.getByLabel('Password').fill(E2E_PASSWORD);
  await signUp.getByRole('button', { name: 'Create account' }).click();

  // The account exists; the name comes next. Still on the build afterwards.
  await chooseName(page, name);
  await expect(page).toHaveURL(new RegExp(`${SEED_BUILD}/bloodhound-samurai$`));
  await accountMenu(page, 'Profile');
  await expect(page.getByRole('heading', { name })).toBeVisible();

  // Log out, then back in from the build page: no name step this time, same page after.
  await accountMenu(page, 'Log out');
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  await page.goto(SEED_BUILD);
  await page.getByRole('button', { name: 'Log in' }).click();
  const login = page.getByRole('form', { name: 'Log in' });
  await login.getByLabel('Email').fill(email);
  await login.getByLabel('Password').fill('wrong-password');
  await login.getByRole('button', { name: 'Log in' }).click();
  await expect(login.getByRole('alert')).toHaveText('Wrong email or password.');
  await login.getByLabel('Password').fill(E2E_PASSWORD);
  await login.getByRole('button', { name: 'Log in' }).click();
  await expect(accountButton(page)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`${SEED_BUILD}/bloodhound-samurai$`));

  // "Forgot password?": its own view, the email carried over, the same answer for any email.
  await accountMenu(page, 'Log out');
  await page.getByRole('button', { name: 'Log in' }).click();
  await login.getByLabel('Email').fill(email);
  await login.getByRole('button', { name: 'Forgot password?' }).click();
  const reset = page.getByRole('form', { name: 'Reset your password' });
  await expect(reset.getByLabel('Email')).toHaveValue(email);
  await reset.getByRole('button', { name: 'Send reset link' }).click();
  await expect(reset.getByRole('status')).toContainText('a reset link is on its way');
  await reset.getByLabel('Email').fill(`nobody-${unique}@example.test`);
  await reset.getByRole('button', { name: 'Send again' }).click();
  await expect(reset.getByRole('status')).toContainText(`nobody-${unique}@example.test`);
});

test('Continue with Google: the name step once, never the Google name', async ({ page }) => {
  const unique = uniqueId();
  const email = `google-${unique}@example.test`;
  const name = `Tarnished ${unique}`;
  await page.goto('/');

  await page.getByRole('button', { name: 'Log in' }).click();
  await pickGoogleAccount(page, page.getByRole('button', { name: 'Continue with Google' }), email);
  const step = page.getByRole('dialog', { name: 'Choose a display name' });
  await expect(step.getByLabel('Display name', { exact: true })).toHaveValue('');
  await chooseName(page, name);
  await accountMenu(page, 'Profile');
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await expect(page.getByText('Real Person Name')).toHaveCount(0);
  // Google verified the email: no "Not verified" row; Google is the sign-in method (T31).
  await accountMenu(page, 'Account');
  await expect(page.getByText('Not verified')).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Sign-in' }).getByText('Google', { exact: true }),
  ).toBeVisible();

  // The same Google account again: straight in.
  await accountMenu(page, 'Log out');
  await headerLogIn(page).click();
  await pickGoogleAccount(page, page.getByRole('button', { name: 'Continue with Google' }), email, {
    existing: true,
  });
  await expect(accountButton(page)).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('an account without a profile gets the name step; closing it logs out', async ({ page }) => {
  const unique = uniqueId();
  const email = `noprofile-${unique}@example.test`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  const signUp = page.getByRole('form', { name: 'Sign up' });
  await signUp.getByLabel('Email').fill(email);
  await signUp.getByLabel('Password').fill(E2E_PASSWORD);
  await signUp.getByRole('button', { name: 'Create account' }).click();
  const step = page.getByRole('dialog', { name: 'Choose a display name' });
  await expect(step).toBeVisible();

  // Leaving mid-step: the account exists without a profile. Next visit, the step is back.
  await page.reload();
  await expect(step).toBeVisible();
  await step.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  await expect(step).toHaveCount(0);

  // Logging in again: the step, then in.
  await page.getByRole('button', { name: 'Log in' }).click();
  const login = page.getByRole('form', { name: 'Log in' });
  await login.getByLabel('Email').fill(email);
  await login.getByLabel('Password').fill(E2E_PASSWORD);
  await login.getByRole('button', { name: 'Log in' }).click();
  await chooseName(page, `Late ${unique}`);
});
