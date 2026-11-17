// The build page's tabs (T28, T48) on the seed data: an old link redirects to its tab, the
// Description tab's "Jump to" row, tab switches keep the page and the sidebar (and Back goes to the
// previous tab), and a build without a write-up has a generated one. Read-only. `npm run e2e`.
import { expect, test } from '@playwright/test';

test('tabs: old links, jump to, switching and Back', async ({ page }) => {
  // A link from before T48: Description is now the build's own URL.
  await page.goto('/build/SEEDBLEED001/description');
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai$/);
  const tabs = page.getByRole('navigation', { name: 'Build sections' });
  await expect(tabs.getByRole('link')).toHaveText(['Description', 'Guide', /^Comments/]);
  await expect(tabs.getByRole('link', { name: 'Description' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('heading', { name: 'About this build' })).toBeVisible();
  const sidebar = page.getByRole('complementary', { name: 'Stats and gear' });
  await expect(sidebar.getByRole('button', { name: /^Uchigatana/ })).toBeVisible();

  // Jump to a section of the write-up: it lands under the sticky tab bar.
  const jump = page.getByRole('navigation', { name: 'Jump to' });
  await jump.getByRole('link', { name: 'Playing it' }).click();
  await expect(page).toHaveURL(/#user-content-playing-it$/);
  await expect(page.getByRole('heading', { name: 'Playing it' })).toBeInViewport();
  await expect(tabs).toBeInViewport();

  // Another tab (same sidebar), then Back to the write-up.
  await tabs.getByRole('link', { name: 'Guide' }).click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai\/guide$/);
  await expect(page.getByRole('heading', { name: 'How to get this build' })).toBeVisible();
  await expect(sidebar.getByRole('button', { name: /^Uchigatana/ })).toBeAttached();
  await page.goBack();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai(#.*)?$/);
  await expect(page.getByRole('heading', { name: 'About this build' })).toBeVisible();

  // A wrong or missing name slug is replaced with the build's own (T56); the ID alone decides.
  await page.goto('/build/SEEDBLEED001/an-old-name/guide');
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai\/guide$/);
  await page.goto('/build/SEEDBLEED001');
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai$/);
  await expect(page.getByRole('heading', { name: 'Bloodhound Samurai' })).toBeVisible();

  // The old route link opens the Guide.
  await page.goto('/build/SEEDBLEED001/route');
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai\/guide$/);
});

test('a build without a write-up has a generated description', async ({ page }) => {
  await page.goto('/build/SEEDNAKED001');
  await expect(page.getByText(/^A level \d+ .*build/)).toBeVisible();
  await expect(page.getByText('This description was automatically generated.')).toBeVisible();
});
