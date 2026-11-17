// The player's tracked builds on their profile (T36): Playing while in progress, Completed once
// finished, and the build's public "N playing · M finished" moving with them. Uses the seed's
// all-10s build without a class (three weapons, no levels to gain), so three clicks finish it.
// Tests create their own users and don't need a fresh database, so the counts are compared with
// what the build showed before. `npm run e2e`.
import { expect, test, type Page } from '@playwright/test';
import { accountMenu, completeSignUp } from './helpers';

const BUILD = '/build/SEEDNAKED001';
const NAME = 'Wretch Speedrun';
const WEAPONS = ['Club', 'Battle Axe', 'Greatsword'];

/** The hero's counts: [playing, finished] (a part that's 0 isn't shown). */
async function heroCounts(page: Page): Promise<[number, number]> {
  // The meta line's "N playing · M finished" part (absent while both are 0).
  const parts = page.getByRole('region', { name: NAME }).getByText(/ (playing|finished)$/);
  const text = (await parts.allTextContents()).join(' ');
  const count = (label: string) => Number(new RegExp(`(\\d+) ${label}`).exec(text)?.[1] ?? 0);
  return [count('playing'), count('finished')];
}

async function expectCounts(page: Page, expected: [number, number]) {
  await expect.poll(() => heroCounts(page)).toEqual(expected);
}

test('Playing and Completed on the profile, with the counts on the build', async ({ page }) => {
  await page.goto(BUILD);
  await expect(page.getByRole('heading', { name: NAME })).toBeVisible();
  const [playing, finished] = await heroCounts(page);

  // Sign up from the tracking intro: tracking starts, and the hero counts the new player.
  await page.getByRole('button', { name: 'Track this build' }).click();
  await page
    .getByRole('dialog', { name: 'Track this build' })
    .getByRole('button', { name: 'Create account' })
    .click();
  await completeSignUp(page, 'playing');
  await expect(page.getByRole('region', { name: 'Your progress', exact: true })).toBeVisible();
  await expectCounts(page, [playing + 1, finished]);
  await page.getByRole('checkbox', { name: /^Club/ }).click();

  // The profile's Playing tab: the build with its progress and next stop. Private.
  await accountMenu(page, 'Profile');
  await page.getByRole('tab', { name: 'Playing 1' }).click();
  await expect(page.getByText('Only you can see what you’re playing.')).toBeVisible();
  const card = page.getByRole('link', { name: new RegExp(NAME) });
  await expect(card).toContainText('Gear 1 of 3');
  await expect(card).toContainText('Next stop');

  // The card opens the Guide (T46). Finish it: Build complete there, the counts move, and it's a
  // trophy on the profile.
  await card.click();
  await expect(page).toHaveURL(new RegExp(`${BUILD}/guide$`));
  for (const weapon of WEAPONS.slice(1)) {
    await page.getByRole('checkbox', { name: new RegExp(`^${weapon}`) }).click();
  }
  await expect(page.getByText('Build complete')).toBeVisible();
  await expectCounts(page, [playing, finished + 1]);
  await page.waitForTimeout(1000); // the save waits for a pause (500 ms)
  await page.reload();
  await expectCounts(page, [playing, finished + 1]);

  await accountMenu(page, 'Profile');
  await expect(page.getByText(/1 build finished/)).toBeVisible();
  await page.getByRole('tab', { name: 'Completed 1' }).click();
  await expect(
    page.getByRole('tabpanel').getByRole('link', { name: new RegExp(NAME) }),
  ).toBeVisible();

  // Removing it from Completed deletes the progress and the counts drop back.
  await page.goto(`${BUILD}/guide`);
  await page.getByRole('button', { name: 'Remove from Completed' }).click();
  await page.getByRole('button', { name: 'Yes, remove' }).click();
  await expect(page.getByRole('button', { name: 'Track this build' })).toBeVisible();
  await expectCounts(page, [playing, finished]);
  await page.reload();
  await expectCounts(page, [playing, finished]);
  await accountMenu(page, 'Profile');
  await page.getByRole('tab', { name: 'Completed' }).click();
  await expect(page.getByText(/No finished builds yet/)).toBeVisible();
});
