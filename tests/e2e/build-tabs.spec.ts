// The build page's tabs (T28) on the seed data: a shared link opens its tab, the Description tab's
// "Jump to" row, tab switches keep the page (and Back goes to the previous tab), and a build without
// a write-up has no Description tab. Read-only. `npm run e2e`.
import { expect, test } from '@playwright/test';

test('tabs: deep link, jump to, switching and Back', async ({ page }) => {
  await page.goto('/build/SEEDBLEED001/description');
  const tabs = page.getByRole('navigation', { name: 'Build sections' });
  await expect(tabs.getByRole('link', { name: 'Description' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('heading', { name: 'About this build' })).toBeVisible();

  // Jump to a section of the write-up: it lands under the sticky tab bar.
  const jump = page.getByRole('navigation', { name: 'Jump to' });
  await jump.getByRole('link', { name: 'Playing it' }).click();
  await expect(page).toHaveURL(/#user-content-playing-it$/);
  await expect(page.getByRole('heading', { name: 'Playing it' })).toBeInViewport();
  await expect(tabs).toBeInViewport();

  // Another tab, then Back to the write-up.
  await tabs.getByRole('link', { name: 'How to get' }).click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/route$/);
  await expect(page.getByRole('heading', { name: 'How to get this build' })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/description/);
  await expect(page.getByRole('heading', { name: 'About this build' })).toBeVisible();

  // The Loadout tab is the build's own URL.
  await tabs.getByRole('link', { name: 'Loadout' }).click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001$/);
  await expect(page.getByRole('region', { name: 'Loadout' })).toBeVisible();
});

test('a build without a write-up has a generated description', async ({ page }) => {
  await page.goto('/build/SEEDNAKED001/description');
  const tabs = page.getByRole('navigation', { name: 'Build sections' });
  await expect(tabs.getByRole('link')).toHaveText([
    'Loadout',
    'Description',
    'How to get',
    /^Comments/,
  ]);
  await expect(page.getByText(/^A level \d+ .*build/)).toBeVisible();
  await expect(page.getByText('This description was automatically generated.')).toBeVisible();
});
