// Shared steps for the e2e tests.
import { expect, type Locator, type Page } from '@playwright/test';

export const E2E_PASSWORD = 'e2e-password-123';

/** A unique suffix for emails and names. */
export const uniqueId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** The "Choose a display name" step after creating an account (T30); waits until it's done. */
export async function chooseName(page: Page, displayName: string) {
  const step = page.getByRole('dialog', { name: 'Choose a display name' });
  await step.getByLabel('Display name', { exact: true }).fill(displayName);
  await step.getByRole('button', { name: 'Continue' }).click();
  await expect(step).toBeHidden();
  await expect(accountButton(page)).toBeVisible();
}

/** The header's account menu button (T31: the signed-in user's display name). */
export const accountButton = (page: Page, name?: string) =>
  page
    .getByRole('navigation', { name: 'Main' })
    .getByRole('button', name ? { name, exact: true } : { expanded: false });

/** The header's Log in button (signed out, `/account` shows its own too). */
export const headerLogIn = (page: Page) =>
  page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Log in' });

/** Opens the header's account menu and picks Profile, Account or Log out (T31). */
export async function accountMenu(page: Page, item: 'Profile' | 'Account' | 'Log out') {
  await accountButton(page).click();
  const panel = page.getByRole('navigation', { name: 'Your account' });
  await (
    item === 'Log out'
      ? panel.getByRole('button', { name: item })
      : panel.getByRole('link', { name: item })
  ).click();
  await expect(panel).toBeHidden();
}

/** Fills the open sign-up form (email + password), then chooses the display name. */
export async function signUpWithEmail(
  page: Page,
  email: string,
  displayName: string,
  password = E2E_PASSWORD,
) {
  const form = page.getByRole('form', { name: 'Sign up' });
  await form.getByLabel('Email').fill(email);
  await form.getByLabel('Password').fill(password);
  await form.getByRole('button', { name: 'Create account' }).click();
  await chooseName(page, displayName);
}

/** Fills the open sign-up form with a new account and waits until it's signed in. */
export async function completeSignUp(page: Page, prefix: string) {
  const unique = uniqueId();
  await signUpWithEmail(page, `${prefix}-${unique}@example.test`, `${prefix} ${unique}`);
}

/**
 * Clicks `trigger` ("Continue with Google", or a re-authentication) and picks a Google account in
 * the Auth emulator's popup: a new one with that email (and a real-looking name the site must never
 * show), or the existing one.
 */
export async function pickGoogleAccount(
  page: Page,
  trigger: Locator,
  email: string,
  { existing = false } = {},
) {
  const popupOpened = page.waitForEvent('popup');
  await trigger.click();
  const popup = await popupOpened;
  // The emulator's page wires its buttons up once its scripts have loaded.
  await popup.waitForLoadState('load');
  if (existing) {
    await popup.getByText(email).click();
  } else {
    await popup.getByRole('button', { name: 'Add new account' }).click();
    await popup.locator('#email-input').fill(email);
    await popup.locator('#display-name-input').fill('Real Person Name');
    await popup.locator('#sign-in').click();
  }
  await popup.waitForEvent('close');
}
