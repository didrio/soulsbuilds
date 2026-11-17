import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { setViewportWidth } from '@/test/viewport';
import NewHereStrip from './NewHereStrip';

describe('NewHereStrip', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setViewportWidth(1000);
  });

  it('shows signed out on a build page, with both links', () => {
    renderWithProviders(<NewHereStrip place="row" />, {
      route: '/build/abc/guide',
      path: '/build/:buildId/*',
    });
    expect(screen.getByText(/step-by-step route to every item/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Plan your own' })).toHaveAttribute(
      'href',
      '/build/new',
    );
  });

  it('sits in the header row on wide windows, without the planner link', () => {
    setViewportWidth(1440);
    const row = renderWithProviders(<NewHereStrip place="row" />, { route: '/weapons/moonveil' });
    expect(row.container).toBeEmptyDOMElement();
    row.unmount();
    renderWithProviders(<NewHereStrip place="header" />, { route: '/weapons/moonveil' });
    expect(screen.getByRole('link', { name: 'How it works' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Plan your own' })).toBeNull();
  });

  it('shows on weapon and tag pages', () => {
    renderWithProviders(<NewHereStrip place="row" />, { route: '/weapons/moonveil' });
    expect(screen.getByRole('region', { name: 'About Souls Builds' })).toBeInTheDocument();
  });

  it('is hidden signed in, on other pages and in the planner', () => {
    const signedIn = renderWithProviders(<NewHereStrip place="row" />, {
      route: '/build/abc',
      path: '/build/:buildId/*',
      uid: 'alice',
    });
    expect(signedIn.container).toBeEmptyDOMElement();
    const home = renderWithProviders(<NewHereStrip place="row" />, { route: '/' });
    expect(home.container).toBeEmptyDOMElement();
    const planner = renderWithProviders(<NewHereStrip place="row" />, {
      route: '/build/new',
      path: '/build/:buildId/*',
    });
    expect(planner.container).toBeEmptyDOMElement();
  });

  it('stays closed once dismissed', async () => {
    const { user } = renderWithProviders(<NewHereStrip place="row" />, {
      route: '/build/abc',
      path: '/build/:buildId/*',
    });
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('region')).toBeNull();
    expect(window.localStorage.getItem('sb-new-here-dismissed')).toBe('1');
    const again = renderWithProviders(<NewHereStrip place="row" />, {
      route: '/build/abc',
      path: '/build/:buildId/*',
    });
    expect(again.container).toBeEmptyDOMElement();
  });
});
