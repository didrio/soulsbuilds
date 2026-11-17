// The build page on a phone (T49): collapsible sections instead of the tab bar and the sidebar.
// Read-only, on the seed data. `npm run e2e`.
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('phone sections: glances, open and close, the URL', async ({ page }) => {
  await page.goto('/build/SEEDBLEED001');
  await expect(page.getByRole('navigation', { name: 'Build sections' })).toHaveCount(0);
  const section = (name: string) => page.getByRole('region', { name, exact: true });
  const header = (name: string) => section(name).getByRole('button').first();

  // Closed headers say something; Description is open.
  await expect(header('Stats')).toContainText('RL 131');
  await expect(header('Guide')).toContainText('items to find');
  await expect(header('Comments')).toContainText('1 comment · “Corpse Piler');
  await expect(header('Description')).toHaveAttribute('aria-expanded', 'true');

  // A gear section opens to its items by name, and closes again.
  await header('Weapons').click();
  await expect(section('Weapons').getByText('Rivers of Blood', { exact: true })).toBeVisible();
  await header('Weapons').click();
  await expect(header('Weapons')).toHaveAttribute('aria-expanded', 'false');

  // Comments: its URL (replaced, not pushed) and the list.
  await header('Comments').click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/comments$/);
  await expect(section('Comments').getByText(/Corpse Piler is absurd/)).toBeVisible();

  // A link to the Guide opens it.
  await page.goto('/build/SEEDBLEED001/guide');
  await expect(header('Guide')).toHaveAttribute('aria-expanded', 'true');
  await expect(header('Description')).toHaveAttribute('aria-expanded', 'false');
  await expect(section('Guide').getByText('Limgrave').first()).toBeVisible();
});
