// "How to get this build" (T15) on a seeded build: the route renders with its regions and items, and
// a region collapses. `npm run e2e`.
import { expect, test } from '@playwright/test';

test('a build shows how to get it', async ({ page }) => {
  await page.goto('/build/SEEDBLEED001');
  const guide = page.getByRole('region', { name: 'How to get this build' });
  await expect(guide).toBeVisible();
  await expect(guide.getByRole('heading', { name: 'Limgrave', level: 3 }).first()).toBeVisible();
  await expect(guide.getByText('Defeat Margit, the Fell Omen')).toBeVisible();
  await expect(guide.getByText('Rivers of Blood')).toBeVisible();

  // Each region is a disclosure: collapsing it hides its steps.
  const firstStep = guide.getByText('Whetstone Knife');
  await expect(firstStep).toBeVisible();
  await guide.getByRole('heading', { name: 'Limgrave', level: 3 }).first().click();
  await expect(firstStep).toBeHidden();
});
