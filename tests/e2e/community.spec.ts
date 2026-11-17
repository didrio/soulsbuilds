// Community touches on the seed data (T20): top tags filter the landing, and the discussion tab shows the
// comment count, the author's write-up and the comments (T28, T63), or asks for one. Read-only. `npm run e2e`.
import { expect, test } from '@playwright/test';

test('top tags, community line and the discussion tab', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/\d+ builds? by \d+ players?/)).toBeVisible();
  const mohg = page.getByRole('group', { name: 'Top tags' }).getByRole('button', { name: /^Mohg/ });
  await mohg.click();
  await expect(mohg).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/[?&]tag=Mohg/);
  await expect(page.getByRole('link', { name: /Carian Moon Knight/ })).toHaveCount(0);
  await page.getByRole('link', { name: /Bloodhound Samurai/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Bloodhound Samurai' })).toBeVisible();

  // The tab names the write-up (T71) and counts the comments only: the write-up on top, then the
  // comments (T63).
  await page.getByRole('link', { name: 'Write-up & comments 1' }).click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai\/discussion$/);
  await expect(page.getByRole('heading', { name: 'Write-up', exact: true })).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Comments · 1' })).toBeVisible();

  // A build nobody commented on asks for one.
  await page.goto('/build/SEEDNAKED001');
  await expect(page.getByRole('heading', { level: 1, name: 'Wretch Speedrun' })).toBeVisible();
  await page.getByRole('link', { name: 'Comments 0', exact: true }).click();
  // No write-up: the comments alone.
  await expect(page.getByRole('heading', { name: 'Write-up', exact: true })).toHaveCount(0);
  await expect(
    page.getByText('No comments yet. Tried it? Tell Tarnished how it went.'),
  ).toBeVisible();
});
