// Comments worth reading (T62): sort the seeded thread (Top, Newest), then on a build of your own
// post, reply (a reply to a reply names who it answers), like, and see it all after a reload.
// `npm run e2e`.
import { expect, test, type Page } from '@playwright/test';
import { completeSignUp } from './helpers';

/** The discussion tab's comments panel. */
const comments = (page: Page) => page.getByRole('region', { name: /^Comments/ });
/** Top-level threads (the replies are lists inside them). */
const threads = (page: Page) => comments(page).locator(':scope > ol > li');

test('sort, post, reply and like comments', async ({ page }) => {
  // The seeded Carian Moon Knight: a liked thread with the author replying, a deleted comment's
  // reply, and a newer comment.
  await page.goto('/build/SEEDMOON0001/carian-moon-knight/discussion');
  await expect(comments(page).getByRole('heading', { name: 'Comments · 5' })).toBeVisible();
  await expect(threads(page).first()).toContainText('Does this work without Moonveil?');
  await expect(threads(page).first()).toContainText('Author');
  await expect(threads(page).nth(1)).toContainText('Comment deleted');
  await comments(page).getByRole('button', { name: 'Newest' }).click();
  await expect(threads(page).first()).toContainText('Comment deleted');
  await expect(threads(page).last()).toContainText('Does this work without Moonveil?');

  // Signed out, Like asks you to log in.
  await comments(page)
    .getByRole('button', { name: /^Like Tarnished’s comment/ })
    .first()
    .click();
  await expect(page.getByRole('dialog', { name: 'Log in' })).toBeVisible();
  await page.keyboard.press('Escape');

  // A build of your own, then a conversation on it.
  await page.getByRole('button', { name: 'Sign up' }).click();
  await completeSignUp(page, 'talker');
  await page.getByRole('link', { name: 'New build' }).click();
  await page.getByLabel('Build name').fill('Chatty build');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page).toHaveURL(/\/build\/[0-9A-Z]{12}\/[a-z0-9-]+$/);
  await page.getByRole('link', { name: /^Comments/ }).click();

  await page.getByLabel('Post a comment').fill('Does it hold up in the DLC?');
  await page.getByRole('button', { name: 'Post' }).click();
  const thread = threads(page).first();
  await expect(thread).toContainText('Does it hold up in the DLC?');
  await expect(thread).toContainText('Author');

  await thread.getByRole('button', { name: /^Reply to / }).click();
  await page.getByRole('textbox', { name: /^Reply to / }).fill('Yes, with +10 scadutree.');
  await page.getByRole('button', { name: 'Reply', exact: true }).click();
  await expect(thread.getByRole('listitem')).toHaveCount(1);
  await expect(thread.getByRole('listitem')).toContainText('Yes, with +10 scadutree.');

  // A reply to a reply joins the same thread and names who it answers.
  await thread
    .getByRole('listitem')
    .getByRole('button', { name: /^Reply to / })
    .click();
  const box = page.getByRole('textbox', { name: /^Reply to / });
  await expect(box).toHaveValue(/^@talker \S+ $/);
  await box.pressSequentially('Thanks!');
  await page.getByRole('button', { name: 'Reply', exact: true }).click();
  await expect(thread.getByRole('listitem')).toHaveCount(2);
  await expect(thread.getByRole('listitem').last()).toContainText(/@talker \S+ Thanks!/);

  const like = thread.getByRole('button', { name: /^Like .*’s comment/ });
  await expect(like).toHaveAttribute('aria-pressed', 'false');
  await like.click();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await expect(like).toHaveAccessibleName(/1 like$/);

  // All of it was saved.
  await page.reload();
  await expect(comments(page).getByRole('heading', { name: 'Comments · 3' })).toBeVisible();
  await expect(like).toHaveAttribute('aria-pressed', 'true');
  await expect(like).toHaveAccessibleName(/1 like$/);
  await expect(thread.getByRole('listitem')).toHaveCount(2);
});
