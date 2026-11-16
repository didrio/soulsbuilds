// "How to get this build" (T15) on a seeded build: its own tab (T28), opened from the Loadout tab's
// card; the route shows numbered stops with their items and why each is needed (T35). Tracking the
// build (signed in, T41): progress along the route, the Next stop card on the Loadout tab, and marking
// stops without gear done (T44). `npm run e2e`.
import { expect, test } from '@playwright/test';
import { completeSignUp } from './helpers';

test('a build shows how to get it', async ({ page }) => {
  await page.goto('/build/SEEDBLEED001');
  await page.getByRole('link', { name: /See the route/ }).click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/route$/);
  // Exact: for a moment the Loadout's "How to get this build" card is still there too.
  await expect(page.getByRole('link', { name: 'How to get', exact: true })).toHaveAttribute(
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
  await page.getByRole('button', { name: 'Sign up' }).click();
  await completeSignUp(page, 'route');
  // A new account tracks no build yet: the intro first.
  await page.getByRole('button', { name: 'Track this build' }).click();
  await page.getByRole('button', { name: 'Start tracking' }).click();

  // Nothing collected: the first stop is next.
  const card = page.locator('section', { hasText: 'Next stop' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('Gatefront');

  // Collect the Uchigatana: its stop is done, but not the ones before it (players go out of order).
  const uchigatana = page.getByRole('button', { name: /^Uchigatana/ });
  await uchigatana.click();
  await expect(uchigatana).toHaveAttribute('aria-pressed', 'true');
  await expect(card).toContainText('Gatefront');

  // Gatefront has none of the build's gear: mark it done (T44), and the card moves on.
  await card.getByRole('button', { name: 'Mark done' }).click();
  await expect(card).not.toContainText('Gatefront');

  await card.getByRole('link', { name: 'See the whole route' }).click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/route$/);
  const guide = page.getByRole('region', { name: 'How to get this build' });
  await expect(guide.getByText(/^2 of \d+ stops done\.$/)).toBeVisible();
  // Finished stops are folded away until asked for.
  await expect(guide.getByText('Uchigatana')).toHaveCount(0);
  await guide.getByRole('button', { name: 'Show the 2 finished stops' }).click();
  await expect(guide.getByText('Uchigatana')).toBeVisible();
  await expect(guide.getByText('Next stop')).toBeVisible();

  // Undo the mark: back to one stop done. The marks are saved with the player's progress.
  const gatefront = guide.getByRole('listitem').filter({ hasText: 'Gatefront' }).first();
  await gatefront.getByRole('button', { name: 'Mark done', pressed: true }).click();
  await expect(guide.getByText(/^1 of \d+ stops done\.$/)).toBeVisible();
  await gatefront.getByRole('button', { name: 'Mark done', pressed: false }).click();
  await expect(guide.getByText(/^2 of \d+ stops done\.$/)).toBeVisible();
  await page.waitForTimeout(1000); // the debounced save
  await page.reload();
  await expect(guide.getByText(/^2 of \d+ stops done\.$/)).toBeVisible();
});
