// Weapon and tag pages (T55): from a build, its weapon's page (facts, where to find it, the builds
// using it), then a tag's page, and back to the build. Signed out: hub pages are public. `npm run e2e`.
import { expect, test } from '@playwright/test';

const SEED_BUILD = '/build/SEEDBLEED001';

test('a build leads to its weapon’s page and its tags’ pages', async ({ page }) => {
  await page.goto(SEED_BUILD);
  await expect(page.getByRole('heading', { level: 1, name: 'Bloodhound Samurai' })).toBeVisible();

  // The weapon, from the title section's "with Rivers of Blood and Uchigatana".
  await page.getByRole('link', { name: 'Rivers of Blood', exact: true }).click();
  await expect(page).toHaveURL(/\/weapons\/rivers-of-blood$/);
  await expect(
    page.getByRole('heading', { level: 1, name: 'Rivers of Blood Builds' }),
  ).toBeVisible();
  await expect(page).toHaveTitle('Rivers of Blood Builds (Elden Ring) | Souls Builds');
  await expect(page.getByText('Corpse Piler (17 FP)')).toBeVisible();
  await expect(page.getByText('Pick up Rivers of Blood')).toBeVisible(); // where to find it (lazy)
  const builds = page.getByRole('region', { name: 'Builds with Rivers of Blood' });
  await expect(builds.getByRole('link', { name: /Bloodhound Samurai/ })).toBeVisible();

  // The weapon type's tag page, then back to a build from there.
  await page.getByRole('link', { name: 'Katana', exact: true }).click();
  await expect(page).toHaveURL(/\/tags\/katana$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Katana Builds' })).toBeVisible();

  await page.goto(SEED_BUILD);
  await page.getByRole('list', { name: 'Tags' }).getByRole('link', { name: 'Malenia' }).click();
  await expect(page).toHaveURL(/\/tags\/malenia$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Builds for Malenia' })).toBeVisible();
  await page.getByRole('link', { name: /Bloodhound Samurai/ }).click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\//);
});

test('an unknown weapon or tag is not found', async ({ page }) => {
  await page.goto('/weapons/not-a-weapon');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
  await page.goto('/tags/not-a-tag');
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});
