// Tracking a build (T34) needs an account (T41): signed out, "Track this build" opens the intro;
// creating an account from it starts tracking on the new account and opens How to get, where tracking
// lives (T46). Check two items off on the route, the progress is still there after a reload
// (Firestore), the rest of the page looks as it does for anyone, then stop. A second build starts at once
// (no intro once the player tracks a build). `npm run e2e`.
import { expect, test } from '@playwright/test';
import { completeSignUp } from './helpers';

const SEED_BUILD = '/build/SEEDBLEED001';

test('track a build: sign up from the intro, check items off, reload, stop', async ({ page }) => {
  await page.goto(SEED_BUILD);
  await page.getByRole('button', { name: 'Track this build' }).click();
  const intro = page.getByRole('dialog', { name: 'Track this build' });
  await expect(intro).toContainText('Tracking needs a free account.');
  await intro.getByRole('button', { name: 'Create account' }).click();
  await expect(intro).toHaveCount(0);
  await completeSignUp(page, 'track');

  // Signed up: tracking started on the new account, in the Guide tab.
  await expect(page).toHaveURL(new RegExp(`${SEED_BUILD}/bloodhound-samurai/guide$`));
  const progress = page.getByRole('region', { name: 'Your progress', exact: true });
  await expect(progress).toContainText('0%');

  // Check two items off on the route; Vigor up by one under Your stats.
  for (const name of ['White Mask', "Lord of Blood's Exultation"]) {
    await page.getByRole('checkbox', { name: new RegExp(`^${name}`) }).click();
  }
  await page.getByRole('button', { name: 'Your stats' }).click();
  await page.getByRole('button', { name: 'Raise Vigor' }).click();
  await expect(progress).toContainText('2 of 14 items');
  await expect(progress).toContainText('Level 10 of 131');

  // Saved to the account: a reload reads it from Firestore.
  await page.waitForTimeout(1000); // the save waits for a pause (500 ms)
  await page.reload();
  const kept = page.getByRole('region', { name: 'Your progress', exact: true });
  await expect(kept).toContainText('2 of 14 items');
  await expect(kept).toContainText('Level 10 of 131');
  await page.getByRole('button', { name: /^Show the \d+ finished stops?$/ }).click();
  await expect(page.getByRole('checkbox', { name: /^White Mask/ })).toBeChecked();

  // The Equipment tab is what any visitor sees; the hero's "Tracking" leads back.
  await page.goto(SEED_BUILD);
  await expect(page.getByRole('region', { name: 'Equipment' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Your progress', exact: true })).toHaveCount(0);
  await expect(page.getByRole('checkbox')).toHaveCount(0);
  await page.getByRole('link', { name: 'Tracking', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${SEED_BUILD}/bloodhound-samurai/guide$`));

  // Another build: no intro now, tracking starts at once.
  await page.goto('/build/SEEDMOON0001');
  await page.getByRole('button', { name: 'Track this build' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/\/build\/SEEDMOON0001\/carian-moon-knight\/guide$/);
  await expect(page.getByRole('region', { name: 'Your progress', exact: true })).toContainText(
    '0%',
  );

  // Stop tracking asks first, then the build is untracked.
  await page.goto(`${SEED_BUILD}/guide`);
  await page.getByRole('button', { name: 'Stop tracking' }).click();
  await page.getByRole('button', { name: 'Yes, stop' }).click();
  await expect(page.getByRole('button', { name: 'Track this build' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Track this build' })).toBeVisible();
});
