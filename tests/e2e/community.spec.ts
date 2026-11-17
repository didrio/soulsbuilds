// Community touches on the seed data (T20): top tags filter the landing, and the Comments tab shows its
// count and the comments (T28), or asks for one. Read-only. `npm run e2e`.
import { expect, test } from '@playwright/test';

test('top tags, community line and the Comments tab', async ({ page }) => {
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

  // A build nobody commented on asks for one.
  await page.goto('/build/SEEDNAKED001');
  await expect(page.getByRole('heading', { level: 1, name: 'Wretch Speedrun' })).toBeVisible();
  await page.getByRole('link', { name: 'Comments 0' }).click();
  await expect(
    page.getByText('No comments yet. Tried it? Tell Tarnished how it went.'),
  ).toBeVisible();
});
