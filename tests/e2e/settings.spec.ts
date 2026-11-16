// T31: the Account page. Rename, the verification notice, change email (the link is only sent, not
// opened), change password, and a Google account setting a password; logging back in proves each.
import { expect, test, type Page } from '@playwright/test';
import {
  accountButton,
  accountMenu,
  chooseName,
  E2E_PASSWORD,
  headerLogIn,
  pickGoogleAccount,
  signUpWithEmail,
  uniqueId,
} from './helpers';

async function logIn(page: Page, email: string, password: string) {
  await headerLogIn(page).click();
  const login = page.getByRole('form', { name: 'Log in' });
  await login.getByLabel('Email').fill(email);
  await login.getByLabel('Password', { exact: true }).fill(password);
  await login.getByRole('button', { name: 'Log in' }).click();
  await expect(accountButton(page)).toBeVisible();
}

test('rename, verification, change email and password, log out and back in', async ({ page }) => {
  const unique = uniqueId();
  const email = `settings-${unique}@example.test`;
  const newPassword = 'a-brand-new-password';
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await signUpWithEmail(page, email, `Settings ${unique}`);

  await accountMenu(page, 'Account');
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Account' })).toBeVisible();

  // Not verified yet (send-only): resend.
  await expect(page.getByText('Not verified')).toBeVisible();
  await page.getByRole('button', { name: 'Resend email' }).click();
  await expect(page.getByText('Verification email sent. Check your inbox.')).toBeVisible();

  // Rename: the header and the public profile show it.
  const nameField = page.getByRole('textbox', { name: 'Display name' });
  await nameField.fill(`Renamed ${unique}`);
  await page.getByRole('button', { name: 'Save name' }).click();
  await expect(page.getByText('Saved.')).toBeVisible();
  await expect(accountButton(page, `Renamed ${unique}`)).toBeVisible();
  await page.getByRole('link', { name: 'View your public profile' }).click();
  await expect(page.getByRole('heading', { level: 1, name: `Renamed ${unique}` })).toBeVisible();
  await page.getByRole('link', { name: 'Account settings' }).click();

  // Change email: a wrong password is caught, then the link goes to the new address.
  await page.getByRole('button', { name: 'Change email' }).click();
  const emailForm = page.getByRole('form', { name: 'Change email' });
  await emailForm.getByLabel('New email').fill(`moved-${unique}@example.test`);
  await emailForm.getByLabel('Current password', { exact: true }).fill('not-my-password');
  await emailForm.getByRole('button', { name: 'Send link' }).click();
  await expect(emailForm.getByText('That’s not your current password.')).toBeVisible();
  await emailForm.getByLabel('Current password', { exact: true }).fill(E2E_PASSWORD);
  await emailForm.getByRole('button', { name: 'Send link' }).click();
  await expect(page.getByText(`We sent a link to moved-${unique}@example.test`)).toBeVisible();

  // Change password.
  await page.getByRole('button', { name: 'Change password' }).click();
  const passwordForm = page.getByRole('form', { name: 'Change password' });
  await passwordForm.getByLabel('Current password', { exact: true }).fill(E2E_PASSWORD);
  await passwordForm.getByLabel('New password', { exact: true }).fill(newPassword);
  await passwordForm.getByRole('button', { name: 'Change password' }).click();
  await expect(page.getByText('Password changed.')).toBeVisible();

  // Log out from the menu; the old password no longer works, the new one does.
  await accountMenu(page, 'Log out');
  await expect(page.getByText('Log in to see your account')).toBeVisible();
  await headerLogIn(page).click();
  const login = page.getByRole('form', { name: 'Log in' });
  await login.getByLabel('Email').fill(email);
  await login.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);
  await login.getByRole('button', { name: 'Log in' }).click();
  await expect(login.getByRole('alert')).toHaveText('Wrong email or password.');
  await login.getByLabel('Password', { exact: true }).fill(newPassword);
  await login.getByRole('button', { name: 'Log in' }).click();
  await expect(accountButton(page, `Renamed ${unique}`)).toBeVisible();
});

test('a Google account sets a password, then logs in with it', async ({ page }) => {
  const unique = uniqueId();
  const email = `google-settings-${unique}@example.test`;
  const password = 'google-users-password';
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await pickGoogleAccount(page, page.getByRole('button', { name: 'Continue with Google' }), email);
  await chooseName(page, `Googler ${unique}`);

  await accountMenu(page, 'Account');
  await expect(page.getByRole('button', { name: 'Change email' })).toHaveCount(0);
  const signIn = page.getByRole('region', { name: 'Sign-in' });
  await expect(signIn.getByText('Not set')).toBeVisible();
  await signIn.getByRole('button', { name: 'Set a password' }).click();
  await page.getByLabel('New password', { exact: true }).fill(password);
  await pickGoogleAccount(
    page,
    page.getByRole('button', { name: 'Confirm with Google and set password' }),
    email,
    { existing: true },
  );
  await expect(page.getByText(/Password set/)).toBeVisible();
  await expect(signIn.getByRole('button', { name: 'Change password' })).toBeVisible();

  await accountMenu(page, 'Log out');
  await logIn(page, email, password);
});
