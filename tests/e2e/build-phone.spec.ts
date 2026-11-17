// The build page on a phone (T49, T63): collapsible sections instead of the tab bar and the sidebar.
// Read-only, on the seed data. `npm run e2e`.
import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

test('phone sections: glances, open and close, the URL', async ({ page }) => {
  await page.goto('/build/SEEDBLEED001');
  await expect(page.getByRole('navigation', { name: 'Build sections' })).toHaveCount(0);
  const section = (name: string) => page.getByRole('region', { name, exact: true });
  const header = (name: string) => section(name).getByRole('button').first();

  // Closed headers say something; Weapons is open (Equipment, the build's own URL), items by name.
  await expect(header('Stats')).toContainText('RL 131');
  await expect(header('Guide')).toContainText('items to find');
  await expect(header('Write-up')).toContainText('build around Rivers of Blood');
  await expect(header('Comments')).toContainText('1 comment · “Corpse Piler');
  await expect(header('Weapons')).toHaveAttribute('aria-expanded', 'true');
  await expect(section('Weapons').getByText('Rivers of Blood', { exact: true })).toBeVisible();
  await header('Weapons').click();
  await expect(header('Weapons')).toHaveAttribute('aria-expanded', 'false');

  // The write-up: its own section (T71), opened where it is.
  await header('Write-up').click();
  await expect(section('Write-up').getByRole('heading', { name: 'Playing it' })).toBeVisible();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai$/);

  // Comments: its URL (replaced, not pushed).
  await header('Comments').click();
  await expect(page).toHaveURL(/\/build\/SEEDBLEED001\/bloodhound-samurai\/discussion$/);
  await expect(section('Comments').getByText(/Corpse Piler is absurd/)).toBeVisible();

  // A link to the Guide opens it.
  await page.goto('/build/SEEDBLEED001/guide');
  await expect(header('Guide')).toHaveAttribute('aria-expanded', 'true');
  await expect(header('Weapons')).toHaveAttribute('aria-expanded', 'false');
  await expect(section('Guide').getByText('Limgrave').first()).toBeVisible();
});
