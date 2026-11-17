import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { makeBuild } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import ShareButton from './ShareButton';

const usage = vi.hoisted(() => ({ countEvent: vi.fn() }));
vi.mock('@/lib/usage', () => usage);

const URL = 'https://soulsbuilds.com/build/SEEDMOON0001/carian-moon-knight';
let writeText: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  usage.countEvent.mockReset();
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
});
afterEach(() => {
  Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
});

const open = async () => {
  const user = userEvent.setup();
  // user-event installs its own clipboard stub; watch that one.
  writeText = vi.spyOn(navigator.clipboard, 'writeText');
  renderWithProviders(<ShareButton build={makeBuild()} author="Ranni Fan" />);
  await user.click(screen.getByRole('button', { name: /Share/ }));
  return user;
};

describe('ShareButton', () => {
  it('opens a menu and Escape closes it', async () => {
    const user = await open();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: 'Copy link' })).not.toBeInTheDocument();
  });

  it('copies the canonical link, says so, and counts it', async () => {
    const user = await open();
    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(writeText).toHaveBeenCalledWith(URL);
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(usage.countEvent).toHaveBeenCalledWith('share-link');
  });

  it('copies the build as Reddit markdown ending with the link', async () => {
    const user = await open();
    await user.click(screen.getByRole('button', { name: 'Copy for Reddit' }));
    const text = writeText.mock.calls[0]![0] as string;
    expect(text).toContain('# Carian Moon Knight');
    expect(text).toContain('by Ranni Fan');
    expect(text.endsWith(`(${URL})`)).toBe(true);
    expect(usage.countEvent).toHaveBeenCalledWith('share-reddit');
  });

  it('downloads the link-preview card', async () => {
    await open();
    const link = screen.getByRole('link', { name: 'Download image' });
    expect(link).toHaveAttribute('href', '/og/build/SEEDMOON0001.png');
    expect(link).toHaveAttribute('download', 'carian-moon-knight.png');
    link.addEventListener('click', (event) => event.preventDefault()); // jsdom can't download
    fireEvent.click(link);
    expect(usage.countEvent).toHaveBeenCalledWith('share-image');
  });

  it('offers Share… only where the browser has a share sheet', async () => {
    const user = await open();
    expect(screen.queryByRole('button', { name: 'Share…' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    await user.click(screen.getByRole('button', { name: /Share/ }));
    await user.click(screen.getByRole('button', { name: 'Share…' }));
    expect(share).toHaveBeenCalledWith({ title: 'Carian Moon Knight', url: URL });
    expect(usage.countEvent).toHaveBeenCalledWith('share-native');
  });
});
