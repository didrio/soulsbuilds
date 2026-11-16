// The build image (T40): the author picks one of the build's items in edit mode's title block; the
// hero shows it, and falls back to the main weapon once that item leaves the build. `npm run e2e`.
import { expect, test, type Page } from '@playwright/test';
import { completeSignUp } from './helpers';

const TALISMAN = "Lord of Blood's Exultation";

/** The hero's portrait shows `name` (the tile's tooltip is the item name). */
async function expectPortrait(page: Page, buildName: string, name: string) {
  const hero = page.getByRole('region', { name: buildName });
  await expect(hero.locator(`[title="${name}"] img`)).toBeVisible();
}

test('choose a talisman as the build image, then fall back to the weapon', async ({ page }) => {
  const buildName = `Image ${Date.now().toString(36)}`;
  await page.goto('/');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await completeSignUp(page, 'image');

  // A build with a weapon and a talisman; the talisman as its image.
  await page.getByRole('link', { name: 'New build' }).click();
  await page.getByLabel('Build name').fill(buildName);
  await page.getByRole('list', { name: 'Right hand' }).getByRole('button').first().click();
  await page.getByLabel('Search items').fill('Moonveil');
  await page.getByRole('button', { name: /^Moonveil/ }).click();
  await page.getByRole('button', { name: 'Choose talisman' }).first().click();
  await page.getByLabel('Search items').fill(TALISMAN);
  await page.getByRole('button', { name: new RegExp(`^${TALISMAN}`) }).click();
  await expect(page.getByText('Main weapon (default)')).toBeVisible();

  await page.getByRole('button', { name: 'Change image' }).click();
  const dialog = page.getByRole('dialog', { name: 'Build image' });
  await dialog.getByRole('radio', { name: new RegExp(TALISMAN) }).check();
  await dialog.getByRole('button', { name: 'Use image' }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole('button', { name: 'Save' }).click();
  await expectPortrait(page, buildName, TALISMAN);

  // Remove the talisman: the hero goes back to the main weapon.
  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByRole('button', { name: new RegExp(`^Change ${TALISMAN}`) }).click();
  await page.getByRole('button', { name: `Remove ${TALISMAN}` }).click();
  await expect(page.getByText('Main weapon (default)')).toBeVisible();
  await page.getByRole('button', { name: 'Save' }).click();
  await expectPortrait(page, buildName, 'Moonveil');

  await page.getByRole('button', { name: 'Delete build' }).click();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(page).toHaveURL(/\/user\//);
});
