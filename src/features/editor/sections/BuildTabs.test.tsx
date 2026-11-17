import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import BuildTabs from './BuildTabs';

const renderTabs = (route: string, props: Partial<Parameters<typeof BuildTabs>[0]> = {}) =>
  renderWithProviders(
    <BuildTabs
      buildId="abc"
      current="equipment"
      tabs={['equipment', 'guide', 'discussion']}
      {...props}
    />,
    { route, path: '/build/:buildId/*' },
  );

describe('BuildTabs', () => {
  it('links every tab and marks the current page', () => {
    renderTabs('/build/abc/guide', { current: 'guide', commentCount: 3 });
    const bar = screen.getByRole('navigation', { name: 'Build sections' });
    const links = within(bar).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/build/abc',
      '/build/abc/guide',
      '/build/abc/discussion',
    ]);
    expect(within(bar).getByRole('link', { name: 'Guide' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // Equipment matches its path exactly, so it isn't current on another tab.
    expect(within(bar).getByRole('link', { name: 'Equipment' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(within(bar).getByRole('link', { name: 'Discussion 3' })).toBeInTheDocument();
  });

  it('shows only the tabs it is given', () => {
    renderTabs('/build/abc', { tabs: ['equipment'] });
    const links = within(screen.getByRole('navigation')).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Equipment']);
  });

  it('shows the actions it is given beside the tabs, outside the tab navigation (T66)', () => {
    renderTabs('/build/abc', { actions: <button type="button">Share</button> });
    const bar = screen.getByRole('navigation', { name: 'Build sections' });
    expect(within(bar).queryByRole('button', { name: 'Share' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
  });
});
