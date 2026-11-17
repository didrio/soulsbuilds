// Community touches on the seed data (T20, T74): the home shelves, top tags filter the builds page, and the discussion tab shows the
// comment count, the author's write-up and the comments (T28, T63), or asks for one. Read-only. `npm run e2e`.
import { expect, test } from '@playwright/test';

test('home shelves, a tag filter on the builds page, and the discussion tab', async ({ page }) => {
  // The home page (T74, T79): Trending, and the way to the full list; the count is on the builds page.
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Trending' })).toBeVisible();
  await page.getByRole('link', { name: 'View all builds →' }).click();
  await expect(page).toHaveURL(/\/builds$/);
  await expect(page.getByText(/\d+ builds? by \d+ players?/)).toBeVisible();

  // A top tag from the Tags popover filters the list (T20, T74). The first one, whichever it is: the
  // seeded builds (`node scripts/seed-builds.mjs --write`) may be loaded locally too (T79).
  await page.getByRole('button', { name: /^Tags Any/ }).click();
  const top = page.getByRole('group', { name: 'Most used tags' }).getByRole('button').first();
  const tag = (await top.textContent())!.replace(/\d+ builds?$/, '').trim();
  await top.click();
  await expect(top).toHaveAttribute('aria-pressed', 'true');
  await expect(page).toHaveURL(/[?&]tag=/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: `${tag} (remove)` })).toBeVisible();

  // Mohg (one seed build) leaves Carian Moon Knight out.
  await page.goto('/builds?tag=Mohg');
  await expect(page.getByRole('button', { name: /Mohg \(remove\)/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Bloodhound Samurai/ })).toBeVisible();
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
