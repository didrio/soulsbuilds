// Community touches on the seed data (T20): top tags filter the landing, the Comments tab shows its
// count and the comments (T28), and "More by" opens the author's other build at the top. Read-only. `npm run e2e`.
import { expect, test } from '@playwright/test';

test('top tags, community line, comment link and More by', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/\d+ builds? by \d+ players?/)).toBeVisible();
  const mohg = page.getByRole('group', { name: 'Top tags' }).getByRole('button', { name: /^Mohg/ });
  await mohg.click();
  await expect(mohg).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/[?&]tag=Mohg/);
  await expect(page.getByRole('link', { name: /Carian Moon Knight/ })).toHaveCount(0);
  await page.getByRole('link', { name: /Bloodhound Samurai/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Bloodhound Samurai' })).toBeVisible();

  // The Comments tab shows its count and opens the comments (T28).
  await page.getByRole('link', { name: 'Comments 1' }).click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/comments$/);
  await expect(page.getByRole('heading', { name: 'Comments · 1' })).toBeInViewport();

  // "More by" sits at the bottom of the Loadout tab.
  await page.getByRole('link', { name: 'Loadout' }).click();
  await page.getByRole('heading', { name: 'More by Tarnished' }).scrollIntoViewIfNeeded();
  await page.getByRole('link', { name: /Wretch Speedrun/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Wretch Speedrun' })).toBeInViewport();
  await page.getByRole('link', { name: 'Comments 0' }).click();
  await expect(
    page.getByText('No comments yet. Tried it? Tell Tarnished how it went.'),
  ).toBeVisible();
});
