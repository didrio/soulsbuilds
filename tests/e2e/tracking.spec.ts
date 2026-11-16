// Tracking a build (T34): signed out, track a build and collect two items (saved in this browser),
// then sign up from "Keep my progress": the progress moves into the new account and is still there
// after a reload, on the account. Then stop tracking. `npm run e2e`.
import { expect, test } from '@playwright/test';

const unique = Date.now().toString(36);
const SEED_BUILD = '/build/SEEDBLEED001';

test('track a build signed out, then keep the progress by signing up', async ({ page }) => {
  await page.goto(SEED_BUILD);
  await page.getByRole('button', { name: 'Track this build' }).click();
  const progress = page.getByRole('region', { name: 'Your progress', exact: true });
  await expect(progress).toContainText('0%');

  // Collect two items; Vigor up by one.
  for (const name of ['White Mask', "Lord of Blood's Exultation"]) {
    const item = page.getByRole('button', { name: new RegExp(`^${name}`) });
    await item.click();
    await expect(item).toHaveAttribute('aria-pressed', 'true');
  }
  await page.getByRole('button', { name: 'Raise Vigor' }).click();
  await expect(progress).toContainText('Gear2 of 14');
  await expect(progress).toContainText('Level10 of 131');

  // Saved in this browser: a reload keeps it.
  await page.reload();
  await expect(page.getByRole('region', { name: 'Your progress', exact: true })).toContainText(
    'Gear2 of 14',
  );

  // Keep it: sign up from the card.
  const card = page.getByRole('region', { name: 'Keep your progress' });
  await card.getByRole('button', { name: 'Keep my progress' }).click();
  const form = page.getByRole('form', { name: 'Sign up' });
  await form.getByLabel('Email').fill(`track-${unique}@example.test`);
  await form.getByLabel('Password').fill('e2e-password-123');
  await form.getByLabel('Display name').fill(`Tracker ${unique}`);
  await form.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
  await expect(card).toHaveCount(0);

  // Now in the account: local storage is empty, and a reload reads it from Firestore.
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('soulsbuilds.tracking.v1')))
    .toBeNull();
  await page.reload();
  const kept = page.getByRole('region', { name: 'Your progress', exact: true });
  await expect(kept).toContainText('Gear2 of 14');
  await expect(kept).toContainText('Level10 of 131');
  await expect(page.getByRole('button', { name: /^White Mask/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // A change while signed in is saved to the account too.
  await page.getByRole('button', { name: /^Shard of Alexander/ }).click();
  await expect(kept).toContainText('Gear3 of 14');
  await page.waitForTimeout(1000); // the save waits for a pause (500 ms)
  await page.reload();
  await expect(page.getByRole('region', { name: 'Your progress', exact: true })).toContainText(
    'Gear3 of 14',
  );

  // Stop tracking asks first, then the build is untracked.
  await page.getByRole('button', { name: 'Stop tracking' }).click();
  await page.getByRole('button', { name: 'Yes, stop' }).click();
  await expect(page.getByRole('button', { name: 'Track this build' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Track this build' })).toBeVisible();
});
