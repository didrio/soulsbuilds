// The build page's fold (T66, the owner's goal): on a 1440×820 window (a laptop at its default
// resolution in Chrome) and on 1280×800, a fully equipped build's Equipment tab shows whole without
// scrolling: the title, the tab row with Track / Like / Share, the stats and every equipment row.
// Read-only, signed out. `npm run e2e`.
import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 1440, height: 820 },
  { width: 1280, height: 800 },
]) {
  test(`a full build's Equipment tab fits ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/build/SEEDFULL0001');
    const stats = page.getByRole('complementary', { name: 'Stats' });
    const equipment = page.getByRole('region', { name: 'Equipment' });
    // The last row: the items.
    await expect(equipment.getByRole('list', { name: 'Items' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Track this build' })).toBeVisible();

    for (const panel of [stats, equipment]) {
      const box = await panel.boundingBox();
      expect(box).not.toBeNull();
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
}
