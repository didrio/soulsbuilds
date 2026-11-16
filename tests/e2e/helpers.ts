// Shared steps for the e2e tests.
import { expect, type Page } from '@playwright/test';

/** Fills the open sign-up form with a new account and waits until it's signed in. */
export async function completeSignUp(page: Page, prefix: string) {
  const unique = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const form = page.getByRole('form', { name: 'Sign up' });
  await form.getByLabel('Email').fill(`${prefix}-${unique}@example.test`);
  await form.getByLabel('Password').fill('e2e-password-123');
  await form.getByLabel('Display name').fill(`${prefix} ${unique}`);
  await form.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
}
