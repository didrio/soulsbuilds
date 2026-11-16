// Community touches on the seed data (T20): top tags filter the landing, the comment count jumps to
// the comments, and "More by" opens the author's other build at the top. Read-only. `npm run e2e`.
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

  await page.getByRole('link', { name: '1 Comment' }).click();
  await expect(page).toHaveURL(/#comments-title$/);
  await expect(page.getByRole('heading', { name: 'Comments · 1' })).toBeInViewport();

  await page.getByRole('heading', { name: 'More by Tarnished' }).scrollIntoViewIfNeeded();
  await page.getByRole('link', { name: /Wretch Speedrun/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Wretch Speedrun' })).toBeInViewport();
  await expect(
    page.getByText('No comments yet. Tried it? Tell Tarnished how it went.'),
  ).toBeVisible();
});
