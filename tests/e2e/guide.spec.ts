// "How to get this build" (T15) on a seeded build: its own tab (T28), opened from the Loadout tab's
// card; the route shows at once as numbered areas with their stops and items. `npm run e2e`.
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
  await expect(guide.getByRole('heading', { name: 'Limgrave', level: 3 }).first()).toBeVisible();
  await expect(guide.getByText('Defeat Margit, the Fell Omen')).toBeVisible();
  await expect(guide.getByText('Rivers of Blood')).toBeVisible();
  await expect(guide.getByText('Whetstone Knife')).toBeVisible();
  await expect(guide.getByText('Boss').first()).toBeVisible();
});
