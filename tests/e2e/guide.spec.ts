// "How to get this build" (T15) on a seeded build: its own tab (T28), opened from the Loadout tab's
// card; the route shows numbered stops with their items and why each is needed (T35). Tracking the
// build: progress along the route, and the Next stop card on the Loadout tab. `npm run e2e`.
import { expect, test } from '@playwright/test';

test('a build shows how to get it', async ({ page }) => {
  await page.goto('/build/SEEDBLEED001');
  await page.getByRole('link', { name: /See the route/ }).click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/route$/);
  await expect(page.getByRole('link', { name: 'How to get' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  const guide = page.getByRole('region', { name: 'How to get this build' });
  await expect(guide.getByText('Limgrave').first()).toBeVisible();
  await expect(guide.getByText('Defeat Margit, the Fell Omen')).toBeVisible();
  await expect(guide.getByText(/^Main-path boss/).first()).toBeVisible();
  await expect(guide.getByText('Rivers of Blood')).toBeVisible();
  await expect(guide.getByText('Whetstone Knife')).toBeVisible();
  await expect(guide.getByText('Lets you put Ashes of War on weapons')).toBeVisible();
  await expect(guide.getByText(/stops done/)).toHaveCount(0);
});

test('tracking a build shows the next stop and progress along the route', async ({ page }) => {
  await page.goto('/build/SEEDBLEED001');
  await page.getByRole('button', { name: 'Track this build' }).click();

  // Nothing collected: the first stop is next.
  const card = page.locator('section', { hasText: 'Next stop' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('Gatefront');

  // Collect the Uchigatana: the stops up to it are done, the card moves on.
  const uchigatana = page.getByRole('button', { name: /^Uchigatana/ });
  await uchigatana.click();
  await expect(uchigatana).toHaveAttribute('aria-pressed', 'true');
  await expect(card).not.toContainText('Gatefront');

  await card.getByRole('link', { name: 'See the whole route' }).click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/route$/);
  const guide = page.getByRole('region', { name: 'How to get this build' });
  await expect(guide.getByText(/^[1-9]\d* of \d+ stops done\.$/)).toBeVisible();
  // Finished stops are folded away until asked for.
  await expect(guide.getByText('Uchigatana')).toHaveCount(0);
  await guide.getByRole('button', { name: /^Show the \d+ finished stops$/ }).click();
  await expect(guide.getByText('Uchigatana')).toBeVisible();
  await expect(guide.getByText('Next stop')).toBeVisible();
});
