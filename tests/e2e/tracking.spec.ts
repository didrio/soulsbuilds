// Tracking a build (T34) needs an account (T41): signed out, "Track this build" opens the intro;
// creating an account from it starts tracking on the new account. Collect two items, the progress is
// still there after a reload (Firestore), then stop. A second build starts at once (no intro once the
// player tracks a build). `npm run e2e`.
import { expect, test } from '@playwright/test';
import { completeSignUp } from './helpers';

const SEED_BUILD = '/build/SEEDBLEED001';

test('track a build: sign up from the intro, collect, reload, stop', async ({ page }) => {
  await page.goto(SEED_BUILD);
  await page.getByRole('button', { name: 'Track this build' }).click();
  const intro = page.getByRole('dialog', { name: 'Track this build' });
  await expect(intro).toContainText('Tracking needs a free account.');
  await intro.getByRole('button', { name: 'Create account' }).click();
  await expect(intro).toHaveCount(0);
  await completeSignUp(page, 'track');

  // Signed up: tracking started on the new account.
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

  // Saved to the account: a reload reads it from Firestore.
  await page.waitForTimeout(1000); // the save waits for a pause (500 ms)
  await page.reload();
  const kept = page.getByRole('region', { name: 'Your progress', exact: true });
  await expect(kept).toContainText('Gear2 of 14');
  await expect(kept).toContainText('Level10 of 131');
  await expect(page.getByRole('button', { name: /^White Mask/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  // Another build: no intro now, tracking starts at once.
  await page.goto('/build/SEEDMOON0001');
  await page.getByRole('button', { name: 'Track this build' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Your progress', exact: true })).toContainText(
    '0%',
  );

  // Stop tracking asks first, then the build is untracked.
  await page.goto(SEED_BUILD);
  await page.getByRole('button', { name: 'Stop tracking' }).click();
  await page.getByRole('button', { name: 'Yes, stop' }).click();
  await expect(page.getByRole('button', { name: 'Track this build' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Track this build' })).toBeVisible();
});
