import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Counter = { goatcounter?: { count: (vars: unknown) => void } };

describe('usage counts', () => {
  beforeEach(() => {
    vi.resetModules();
    document.head.innerHTML = '';
  });
  afterEach(() => {
    delete (window as unknown as Counter).goatcounter;
    vi.restoreAllMocks();
  });

  it('only counts on the live domain', async () => {
    const { usageEnabled } = await import('./usage');
    expect(usageEnabled('soulsbuilds.com')).toBe(true);
    for (const host of [
      'localhost',
      '127.0.0.1',
      'soulsbuilds.web.app',
      'soulsbuilds--pr-4.web.app',
    ]) {
      expect(usageEnabled(host)).toBe(false);
    }
  });

  it('loads nothing and counts nothing off the live site (tests run on localhost)', async () => {
    const { countPage, countEvent } = await import('./usage');
    countPage('/');
    countEvent('tracking-started');
    expect(document.head.querySelector('script')).toBeNull();
  });

  it('on the live site: loads the script once, then sends the queued counts when it has loaded', async () => {
    const { usageEnabled } = await import('./usage');
    // jsdom's location can't be changed, so exercise the queue by stubbing the host check's source.
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      hostname: 'soulsbuilds.com',
    } as Location);
    expect(usageEnabled()).toBe(true);
    const { countPage, countEvent } = await import('./usage');
    countPage('/build/abc', '');
    countEvent('route-opened');
    expect(document.head.querySelectorAll('script')).toHaveLength(1);
    const script = document.head.querySelector('script')!;
    expect(script.dataset.goatcounter).toBe('https://abhpro.goatcounter.com/count');
    expect(JSON.parse(script.dataset.goatcounterSettings ?? '{}')).toEqual({ no_onload: true });

    const count = vi.fn();
    (window as unknown as Counter).goatcounter = { count };
    script.dispatchEvent(new Event('load'));
    expect(count).toHaveBeenNthCalledWith(1, { path: '/build/abc', referrer: '' });
    expect(count).toHaveBeenNthCalledWith(2, { path: 'route-opened', event: true });

    countEvent('item-collected');
    expect(count).toHaveBeenLastCalledWith({ path: 'item-collected', event: true });
  });
});
