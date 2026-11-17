// The build page's tabs (T28, T48, T63) on the seed data: Equipment at the build's own URL, old links
// redirect to their tab, the write-up (named in its tab, T71) and its "Jump to" row, tab switches keep the page
// (and Back goes to the previous tab), and a build without a write-up has none. Read-only. `npm run e2e`.
import { expect, test } from '@playwright/test';

test('tabs: old links, jump to, switching and Back', async ({ page }) => {
  await page.goto('/build/SEEDBLEED001');
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai$/);
  const tabs = page.getByRole('navigation', { name: 'Build sections' });
  await expect(tabs.getByRole('link')).toHaveText(['Equipment', 'Guide', /^Write-up & comments/]);
  await expect(tabs.getByRole('link', { name: 'Equipment' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  // Equipment: the stats beside the equipment, the two panels the same height.
  const stats = page.getByRole('complementary', { name: 'Stats' });
  const equipment = page.getByRole('region', { name: 'Equipment' });
  await expect(equipment.getByRole('button', { name: /^Uchigatana/ })).toBeVisible();
  const [left, right] = [await stats.boundingBox(), await equipment.boundingBox()];
  expect(Math.abs((left?.height ?? 0) - (right?.height ?? 1))).toBeLessThan(2);

  // A link from before T63: the write-up is at the top of the discussion tab.
  await page.goto('/build/SEEDBLEED001/description');
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai\/discussion$/);
  await expect(page.getByRole('heading', { name: 'Write-up', exact: true })).toBeVisible();
  const sidebar = page.getByRole('complementary', { name: 'Stats and equipment' });
  await expect(sidebar.getByRole('button', { name: /^Uchigatana/ })).toBeVisible();

  // Jump to a section of the write-up: it lands under the sticky tab bar.
  const jump = page.getByRole('navigation', { name: 'Jump to' });
  await jump.getByRole('link', { name: 'Playing it' }).click();
  await expect(page).toHaveURL(/#user-content-playing-it$/);
  await expect(page.getByRole('heading', { name: 'Playing it' })).toBeInViewport();
  await expect(tabs).toBeInViewport();

  // Another tab (same sidebar), then Back to the write-up and comments.
  await tabs.getByRole('link', { name: 'Guide' }).click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai\/guide$/);
  await expect(page.getByRole('heading', { name: 'How to get this build' })).toBeVisible();
  await expect(sidebar.getByRole('button', { name: /^Uchigatana/ })).toBeAttached();
  await page.goBack();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai\/discussion(#.*)?$/);
  await expect(page.getByRole('heading', { name: 'Write-up', exact: true })).toBeVisible();

  // A wrong or missing name slug is replaced with the build's own (T56); the ID alone decides.
  await page.goto('/build/SEEDBLEED001/an-old-name/guide');
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai\/guide$/);

  // The old route and comments links open their tabs.
  await page.goto('/build/SEEDBLEED001/route');
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai\/guide$/);
  await page.goto('/build/SEEDBLEED001/bloodhound-samurai/comments');
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai\/discussion$/);
});

test('a build without a write-up shows none: nothing is generated', async ({ page }) => {
  await page.goto('/build/SEEDNAKED001/discussion');
  await expect(page.getByRole('heading', { name: /^Comments/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Write-up', exact: true })).toHaveCount(0);
  // The tab says what it holds: comments only (T71).
  await expect(page.getByRole('link', { name: 'Comments 0', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByText(/automatically generated/)).toHaveCount(0);
});
