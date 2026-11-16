// The main user journey on the emulators: sign up → create a build → like → comment → edit →
// profile → delete → logout. `npm run e2e`.
import { expect, test, type Page } from '@playwright/test';

const unique = Date.now().toString(36);
const email = `e2e-${unique}@example.test`;
const password = 'e2e-password-123';
const displayName = `E2E ${unique}`;
const buildName = `E2E Build ${unique}`;

async function register(page: Page) {
  await page.getByRole('button', { name: 'Sign up' }).click();
  const form = page.getByRole('form', { name: 'Sign up' });
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password').fill(password);
  await form.getByLabel('Display name').fill(displayName);
  await form.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
}

test('sign up, create, like, comment, edit, delete, log out', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: /Bloodhound Samurai/ })).toBeVisible();

  await register(page);

  // Create a build: name, weapons from the picker (with an Ash of War and affinity), a great rune,
  // a stat.
  await page.getByRole('link', { name: 'New build' }).click();
  await page.getByLabel('Build name').fill(buildName);
  await page.getByRole('button', { name: 'Choose weapon' }).first().click();
  await page.getByLabel('Search items').fill('Moonveil');
  await page.getByRole('button', { name: /^Moonveil/ }).click();
  // A unique weapon: nothing to choose, so the picker closes; reopened, it shows the fixed skill.
  // (Its name ends with what it needs: all stats are 10.)
  await page
    .getByRole('button', { name: /^Change Moonveil \(Transient Moonlight skill, Needs / })
    .click();
  await expect(page.getByText("Transient Moonlight (can't be changed)")).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Ash of War' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Change weapon' }).click();

  // Change weapon: back to the list (filtered to katanas), then its Ash of War and affinity step.
  await page.getByRole('combobox', { name: 'Weapon type' }).selectOption({ label: 'Katana' });
  await page.getByLabel('Search items').fill('Uchigatana');
  await page.getByRole('button', { name: /^Uchigatana/ }).click();
  await page.getByRole('combobox', { name: 'Ash of War' }).selectOption({ label: 'Seppuku' });
  await page.getByRole('combobox', { name: 'Affinity' }).selectOption({ label: 'Blood' });
  await page.getByRole('button', { name: 'Done' }).click();
  // All stats are 10: the Uchigatana (Str 11, Dex 15) says what it needs.
  await expect(
    page.getByRole('button', {
      name: 'Change Uchigatana (Blood affinity, Seppuku skill, Needs 11 Str, 15 Dex)',
    }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Choose great rune' }).click();
  await page.getByRole('button', { name: /^Radahn's Great Rune/ }).click();

  // Samurai raises the stats to its base (level 14 here), which meets the Uchigatana's needs, and
  // keeps them there.
  await page
    .getByRole('combobox', { name: 'Starting class' })
    .selectOption({ label: 'Samurai · level 9' });
  const attributes = page.getByRole('region', { name: 'Attributes' });
  await expect(attributes).toContainText('14Rune level');
  await expect(
    page.getByRole('button', { name: 'Change Uchigatana (Blood affinity, Seppuku skill)' }),
  ).toBeVisible();
  const dexterity = page.getByLabel('Dexterity');
  await dexterity.fill('9');
  await dexterity.blur();
  await expect(dexterity).toHaveValue('15');

  const vigor = page.getByLabel('Vigor');
  await vigor.fill('40');
  await vigor.blur();
  await expect(attributes).toContainText('42Rune level');
  await expect(page.getByRole('region', { name: 'Character' })).toContainText('HP1450');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(page).toHaveURL(/\/build\/[0-9A-Z]{12}$/);
  await expect(page.getByRole('heading', { name: buildName })).toBeVisible();
  // Saved by ID and shown in view mode: the weapon's affinity and Ash of War, the great rune.
  await expect(page.getByText('Blood · Seppuku')).toBeVisible();
  await expect(page.getByText("Radahn's Great Rune")).toBeVisible();
  await expect(page.getByText('Starting class: Samurai')).toBeVisible();
  await expect(page.getByRole('link', { name: displayName })).toBeVisible();

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
  await page.getByLabel('Build name').fill(`${buildName} v2`);
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
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
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
  await page.getByRole('button', { name: 'Log in' }).click();
  const form = page.getByRole('form', { name: 'Log in' });
  await form.getByLabel('Email').fill('tarnished@example.test');
  await form.getByLabel('Password').fill('not-the-password');
  await form.getByRole('button', { name: 'Log in' }).click();
  await expect(form.getByRole('alert')).toHaveText('Wrong email or password.');
});

test('report a build once; the login dialog closes with Escape', async ({ page }) => {
  await page.goto('/');
  const login = page.getByRole('button', { name: 'Log in' });
  await login.click();
  await expect(page.getByRole('form', { name: 'Log in' }).getByLabel('Email')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(login).toBeFocused();
  await expect(login).toHaveAttribute('aria-expanded', 'false');

  await page.getByRole('button', { name: 'Sign up' }).click();
  const form = page.getByRole('form', { name: 'Sign up' });
  await form.getByLabel('Email').fill(`report-${unique}@example.test`);
  await form.getByLabel('Password').fill(password);
  await form.getByLabel('Display name').fill(`Reporter ${unique}`);
  await form.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

  await page.goto('/build/SEEDBLEED001');
  await page.getByRole('button', { name: 'Report this build' }).click();
  await page.getByRole('combobox', { name: 'Reason' }).selectOption('Spam or advertising');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.getByText('Thanks, an admin will take a look.')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Report this build' }).click();
  await page.getByRole('combobox', { name: 'Reason' }).selectOption('Something else');
  await page.getByRole('button', { name: 'Send report' }).click();
  await expect(page.getByText('You already reported this build.')).toBeVisible();
});

test('rename, password reset, verification notice and consumables', async ({ page }) => {
  const resetEmail = `t6-${unique}@example.test`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  const form = page.getByRole('form', { name: 'Sign up' });
  await form.getByLabel('Email').fill(resetEmail);
  await form.getByLabel('Password').fill(password);
  await form.getByLabel('Display name').fill(`T6 ${unique}`);
  await form.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

  // Profile: unverified notice with resend, and rename.
  await page.getByRole('link', { name: 'Profile' }).click();
  await expect(page.getByText(/Verify your email/)).toBeVisible();
  await page.getByRole('button', { name: 'Resend email' }).click();
  await expect(page.getByText('Verification email sent. Check your inbox.')).toBeVisible();
  await page.getByRole('button', { name: 'Change name' }).click();
  await page.getByRole('textbox', { name: 'Display name' }).fill(`Renamed ${unique}`);
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: `Renamed ${unique}` })).toBeVisible();

  // Consumables: pick one, save, and see it in view mode.
  await page.getByRole('link', { name: 'Create a build' }).click();
  await page.getByLabel('Build name').fill(`T6 Build ${unique}`);
  await page.getByRole('button', { name: 'Choose item' }).first().click();
  await page.getByLabel('Search items').fill('Acid Spraymist');
  await page.getByRole('button', { name: /^Acid Spraymist/ }).click();
  await expect(page.getByRole('button', { name: 'Change Acid Spraymist' })).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/build\/[0-9A-Z]{12}$/);
  await page.reload();
  await expect(page.getByText('Consumables')).toBeVisible();

  // Password reset from the login dialog.
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.getByRole('button', { name: 'Log in' }).click();
  const login = page.getByRole('form', { name: 'Log in' });
  await login.getByLabel('Email').fill(resetEmail);
  await login.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByText(/a reset link is on its way/)).toBeVisible();
});
