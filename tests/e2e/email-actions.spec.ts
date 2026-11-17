// The pages behind the links in Firebase's emails (T43): reset a password and log in with the new one,
// verify an email (and see it on the Account page), and a link used twice. The Auth emulator keeps the
// emails' codes (its out-of-band codes); each test builds `/auth/action?...` from them. `npm run e2e`.
import { expect, test, type APIRequestContext } from '@playwright/test';
import { accountMenu, E2E_PASSWORD, headerLogIn, signUpWithEmail, uniqueId } from './helpers';

const OOB_CODES = 'http://127.0.0.1:9099/emulator/v1/projects/demo-soulsbuilds/oobCodes';

/** The newest link the emulator "sent" to `email`, as a path on the site (not the emulator's own page). */
async function emailLink(
  request: APIRequestContext,
  email: string,
  requestType: 'PASSWORD_RESET' | 'VERIFY_EMAIL',
) {
  const { oobCodes } = (await (await request.get(OOB_CODES)).json()) as {
    oobCodes: { email: string; requestType: string; oobLink: string }[];
  };
  const sent = oobCodes.filter((code) => code.email === email && code.requestType === requestType);
  expect(sent, `an email of type ${requestType} for ${email}`).not.toHaveLength(0);
  const { searchParams } = new URL(sent[sent.length - 1]!.oobLink);
  return `/auth/action?mode=${searchParams.get('mode')}&oobCode=${searchParams.get('oobCode')}`;
}

test('reset a password from the email link, then log in with it', async ({ page, request }) => {
  const unique = uniqueId();
  const email = `reset-${unique}@example.test`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await signUpWithEmail(page, email, `Forgetful ${unique}`);
  await accountMenu(page, 'Log out');

  // Ask for the link in the log-in dialog.
  await headerLogIn(page).click();
  await page.getByRole('dialog').getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByRole('status')).toContainText('a reset link is on its way');

  // The link opens the site's own page, for that account.
  const link = await emailLink(request, email, 'PASSWORD_RESET');
  await page.goto(link);
  await expect(page.getByRole('heading', { name: 'Choose a new password' })).toBeVisible();
  await expect(page.getByText(`For ${email}.`)).toBeVisible();

  const newPassword = 'a-different-password-1';
  await page.getByLabel('New password').fill('short');
  await page.getByRole('button', { name: 'Save password' }).click();
  await expect(page.getByLabel('New password')).toBeFocused();
  await expect(page.getByText('Choose a password of at least 8 characters.')).toBeVisible();
  await page.getByLabel('New password').fill(newPassword);
  await page.getByRole('button', { name: 'Save password' }).click();
  await expect(page.getByRole('heading', { name: 'Password changed' })).toBeVisible();

  // The old password no longer works, the new one does.
  await page.getByRole('main').getByRole('button', { name: 'Log in' }).click();
  const login = page.getByRole('form', { name: 'Log in' });
  await login.getByLabel('Email').fill(email);
  await login.getByLabel('Password').fill(E2E_PASSWORD);
  await login.getByRole('button', { name: 'Log in' }).click();
  await expect(login.getByRole('alert')).toHaveText('Wrong email or password.');
  await login.getByLabel('Password').fill(newPassword);
  await login.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL('/');

  // The link was used up: a second visit says so and offers a new one.
  await page.goto(link);
  await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeVisible();
  await expect(page.getByLabel('New password')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
});

test('verify an email from the link; the second time it says the link is used', async ({
  page,
  request,
}) => {
  const unique = uniqueId();
  const email = `verify-${unique}@example.test`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await signUpWithEmail(page, email, `Verifier ${unique}`);

  const link = await emailLink(request, email, 'VERIFY_EMAIL');
  await page.goto(link);
  await expect(page.getByRole('heading', { name: 'Email verified' })).toBeVisible();
  await page.getByRole('link', { name: 'Go to your account' }).click();
  await expect(page).toHaveURL('/account');
  await expect(page.getByText('Verified', { exact: true })).toBeVisible();

  // Opened again (a mail scanner may have, or a double click): no error page, a way forward.
  await page.goto(link);
  await expect(page.getByRole('heading', { name: 'This link has expired' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send a new link' })).toBeVisible();
});

test('a link with nothing in it says so', async ({ page }) => {
  await page.goto('/auth/action');
  await expect(page.getByRole('heading', { name: 'This link can’t be used' })).toBeVisible();
});
