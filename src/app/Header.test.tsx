import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import Header from './Header';

const signOut = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock('@/lib/firebase', () => ({ signOut }));

const renderHeader = (uid: string | null = null) => {
  const onLogIn = vi.fn();
  const onSignUp = vi.fn();
  const result = renderWithProviders(
    <Header openDialog={null} onLogIn={onLogIn} onSignUp={onSignUp} />,
    { uid },
  );
  return { ...result, onLogIn, onSignUp };
};

// jsdom doesn't apply media queries, so the desktop nav is what's visible; the phone controls are
// display: none and queried with `hidden: true`.
describe('Header', () => {
  it('signed out: Builds, Log in and Sign up', async () => {
    const { user, onLogIn, onSignUp } = renderHeader();
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Builds' })).toHaveAttribute('href', '/');
    expect(within(nav).queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
    await user.click(within(nav).getByRole('button', { name: 'Log in' }));
    expect(onLogIn).toHaveBeenCalled();
    await user.click(within(nav).getByRole('button', { name: 'Sign up' }));
    expect(onSignUp).toHaveBeenCalled();
  });

  it('signed in: Profile, Log out and New build', async () => {
    const { user } = renderHeader('u1');
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/user/u1');
    expect(within(nav).getByRole('link', { name: 'New build' })).toHaveAttribute(
      'href',
      '/build/new',
    );
    await user.click(within(nav).getByRole('button', { name: 'Log out' }));
    expect(signOut).toHaveBeenCalled();
  });

  it('phones: a labelled "+" and a menu that closes on Escape or a choice', async () => {
    const { user } = renderHeader('u1');
    const plus = screen.getAllByRole('link', { name: 'New build', hidden: true });
    expect(plus).toHaveLength(2);
    const menuButton = screen.getByRole('button', { name: 'Menu', hidden: true });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    const menu = document.getElementById(menuButton.getAttribute('aria-controls')!)!;
    const builds = within(menu).getByRole('link', { name: 'Builds', hidden: true });
    expect(builds).toHaveAttribute('href', '/');
    // (jsdom won't focus inside a display: none phone control, so send Escape to the item directly.)
    fireEvent.keyDown(builds, { key: 'Escape' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(menuButton);
    const reopened = document.getElementById(menuButton.getAttribute('aria-controls')!)!;
    await user.click(within(reopened).getByRole('link', { name: 'Profile', hidden: true }));
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });
});
