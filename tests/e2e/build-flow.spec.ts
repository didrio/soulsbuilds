// The main user journey on the emulators: sign up → create a build → like → comment → edit →
// profile → delete → logout. `npm run e2e`.
import { expect, test, type Page } from '@playwright/test';

const unique = Date.now().toString(36);
const email = `e2e-${unique}@example.test`;
const password = 'e2e-password-123';
const displayName = `E2E ${unique}`;
const buildName = `E2E Build ${unique}`;

async function register(page: Page) {
  await page.getByRole('button', { name: 'Register' }).click();
  const form = page.getByRole('form', { name: 'Register' });
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password').fill(password);
  await form.getByLabel('Display name').fill(displayName);
  await form.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
}

test('sign up, create, like, comment, edit, delete, log out', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Bloodhound Samurai/ })).toBeVisible();

  await register(page);

  // Create a build: name, a weapon from the picker, a stat.
  await page.getByRole('link', { name: 'New build' }).click();
  await page.getByLabel('Build Name').fill(buildName);
  await page.getByRole('button', { name: 'Choose weapon' }).first().click();
  await page.getByLabel('Search items').fill('Moonveil');
  await page.getByRole('button', { name: /^Moonveil/ }).click();
  await expect(page.getByRole('button', { name: 'Change Moonveil' })).toBeVisible();
  const vigor = page.getByLabel('Vigor');
  await vigor.fill('40');
  await vigor.blur();
  await expect(page.getByText('Level 31')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL(/\/build\/[0-9A-Z]{12}$/);
  await expect(page.getByRole('heading', { name: buildName })).toBeVisible();
  await expect(page.getByText(`Created by${displayName}`)).toBeVisible();

  // Like (optimistic, then confirmed).
  await page.getByRole('button', { name: /0 Likes/ }).click();
  await expect(page.getByRole('button', { name: /1 Like/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Comment.
  await page.getByLabel('Post a comment').fill('My own build, my own comment.');
  await page.getByRole('button', { name: 'Post' }).click();
  await expect(page.getByText('My own build, my own comment.')).toBeVisible();
  await expect(page.getByLabel('Post a comment')).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Delete your comment' })).toBeVisible();

  // Edit keeps likes and comments (2022 bug: saving reset them).
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Build Name').fill(`${buildName} v2`);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: `${buildName} v2` })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /1 Like/ })).toBeVisible();
  await expect(page.getByText('My own build, my own comment.')).toBeVisible();

  // Profile: own builds and liked builds.
  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page.getByRole('heading', { name: displayName })).toBeVisible();
  await expect(page.getByRole('link', { name: new RegExp(`${buildName} v2`) })).toBeVisible();
  await page.getByRole('tab', { name: 'Liked' }).click();
  await expect(page.getByRole('link', { name: new RegExp(`${buildName} v2`) })).toBeVisible();

  // Search finds it by name prefix (case-insensitive), and the query stays in the URL.
  await page.getByRole('link', { name: 'Souls Builds' }).click();
  await page.getByRole('searchbox', { name: 'Search builds by name' }).fill(`e2e build ${unique}`);
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(/\?q=e2e/);
  await expect(page.getByRole('link', { name: new RegExp(`${buildName} v2`) })).toBeVisible();
  await expect(page.getByRole('link', { name: /Bloodhound Samurai/ })).toHaveCount(0);

  // Delete.
  await page.getByRole('link', { name: new RegExp(`${buildName} v2`) }).click();
  await page.getByRole('button', { name: 'Delete build' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(page).toHaveURL(/\/user\//);
  await expect(page.getByText('You haven’t made any builds yet.')).toBeVisible();

  // Log out.
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
});

test('missing builds, users and pages show a not-found page', async ({ page }) => {
  await page.goto('/build/DOESNOTEXIST');
  await expect(page.getByRole('heading', { name: 'Build not found' })).toBeVisible();
  await page.goto('/user/nobody-here');
  await expect(page.getByRole('heading', { name: 'User not found' })).toBeVisible();
  await page.goto('/no/such/page');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});

test('logging in with a wrong password shows an error', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Login' }).click();
  const form = page.getByRole('form', { name: 'Log in' });
  await form.getByLabel('Email').fill('tarnished@example.test');
  await form.getByLabel('Password').fill('not-the-password');
  await form.getByRole('button', { name: 'Login' }).click();
  await expect(form.getByRole('alert')).toHaveText('Wrong email or password.');
});
