// The builds page (T74) on the seed data: search finds words anywhere (over the daily index the seed
// writes), filters combine as removable chips, and phones get one Filters sheet. Read-only. `npm run e2e`.
import { expect, test } from '@playwright/test';

test('search words anywhere, a level preset, remove a chip', async ({ page }) => {
  await page.goto('/builds');
  const search = page.getByRole('searchbox', { name: 'Search builds, weapons and tags' });
  // "samurai" is the second word of "Bloodhound Samurai": the old prefix search missed it.
  await search.fill('samurai');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/builds\?q=samurai/);
  await expect(page.getByRole('link', { name: /Bloodhound Samurai/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Carian Moon Knight/ })).toHaveCount(0);

  // A level preset that leaves it out (level 131), then removing the chip brings it back.
  await page.getByRole('button', { name: /^Level Any/ }).click();
  await page.getByRole('button', { name: /^51–100/ }).click();
  await expect(page).toHaveURL(/min=51&max=100/);
  await expect(page.getByRole('link', { name: /Bloodhound Samurai/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Level 51–100 \(remove\)/ }).click();
  await expect(page.getByRole('link', { name: /Bloodhound Samurai/ })).toBeVisible();
});

test.describe('phones', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('one Filters button opens a sheet with the same choices', async ({ page }) => {
    await page.goto('/builds');
    await page.getByRole('button', { name: 'Filters' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await sheet.getByRole('button', { name: /^125–150/ }).click();
    await expect(page).toHaveURL(/min=125&max=150/);
    await sheet.getByRole('button', { name: /^Show / }).click();
    await expect(sheet).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Filters 1 on/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Level 125–150 \(remove\)/ })).toBeVisible();
  });
});
