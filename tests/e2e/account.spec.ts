// Account deletion (T18): sign up → create a build → like and comment on someone else's build →
// delete the account from the profile → the build, the comment and the like are gone. `npm run e2e`.
import { expect, test } from '@playwright/test';

const unique = Date.now().toString(36);
const email = `delete-${unique}@example.test`;
const password = 'e2e-password-123';
const displayName = `Leaving ${unique}`;
const buildName = `Doomed Build ${unique}`;
const comment = `Goodbye from ${unique}`;
const SEED_BUILD = '/build/SEEDBLEED001';

test('delete your account and everything you published', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  const form = page.getByRole('form', { name: 'Sign up' });
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password').fill(password);
  await form.getByLabel('Display name').fill(displayName);
  await form.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

  // A build of their own.
  await page.getByRole('link', { name: 'New build' }).click();
  await page.getByLabel('Build name').fill(buildName);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/build\/[0-9A-Z]{12}$/);
  const ownBuild = new URL(page.url()).pathname;

  // A like and a comment on someone else's build.
  await page.goto(SEED_BUILD);
  const likeButton = page.getByRole('button', { name: /\d+ Likes?/ });
  const likesBefore = Number((await likeButton.textContent())?.match(/\d+/)?.[0]);
  await likeButton.click();
  await expect(likeButton).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Post a comment').fill(comment);
  await page.getByRole('button', { name: 'Post' }).click();
  await expect(page.getByText(comment)).toBeVisible();

  // Delete the account from the profile.
  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page.getByRole('heading', { name: displayName })).toBeVisible();
  const profile = new URL(page.url()).pathname;
  await page.getByRole('button', { name: 'Delete account' }).click();
  const dialog = page.getByRole('dialog', { name: 'Delete your account?' });
  await dialog.getByLabel('Your password').fill('wrong-password');
  await dialog.getByRole('button', { name: 'Delete my account' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Wrong email or password.');
  await dialog.getByLabel('Your password').fill(password);
  await dialog.getByRole('button', { name: 'Delete my account' }).click();

  // Signed out on the landing page; everything they published is gone.
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  await page.goto(ownBuild);
  await expect(page.getByRole('heading', { name: 'Build not found' })).toBeVisible();
  await page.goto(profile);
  await expect(page.getByRole('heading', { name: 'User not found' })).toBeVisible();
  await page.goto(SEED_BUILD);
  // Signed out, the like count is text, not a button.
  const likesLabel = `${likesBefore} Like${likesBefore === 1 ? '' : 's'}`;
  await expect(page.getByText(likesLabel, { exact: true })).toBeVisible();
  await expect(page.getByText(comment)).toHaveCount(0);

  // The account is gone too: logging in fails.
  await page.getByRole('button', { name: 'Log in' }).click();
  const login = page.getByRole('form', { name: 'Log in' });
  await login.getByLabel('Email').fill(email);
  await login.getByLabel('Password').fill(password);
  await login.getByRole('button', { name: 'Log in' }).click();
  await expect(login.getByRole('alert')).toHaveText('Wrong email or password.');
});
