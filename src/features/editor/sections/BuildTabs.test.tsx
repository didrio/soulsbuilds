import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import BuildTabs from './BuildTabs';

const renderTabs = (route: string, props: Partial<Parameters<typeof BuildTabs>[0]> = {}) =>
  renderWithProviders(
    <BuildTabs
      buildId="abc"
      current="description"
      tabs={['description', 'guide', 'comments']}
      {...props}
    />,
    { route, path: '/build/:buildId/:tab?' },
  );

describe('BuildTabs', () => {
  it('links every tab and marks the current page', () => {
    renderTabs('/build/abc/guide', { current: 'guide', commentCount: 3 });
    const bar = screen.getByRole('navigation', { name: 'Build sections' });
    const links = within(bar).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/build/abc',
      '/build/abc/guide',
      '/build/abc/comments',
    ]);
    expect(within(bar).getByRole('link', { name: 'Guide' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // Description matches its path exactly, so it isn't current on another tab.
    expect(within(bar).getByRole('link', { name: 'Description' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(within(bar).getByRole('link', { name: 'Comments 3' })).toBeInTheDocument();
  });

  it('shows only the tabs it is given', () => {
    renderTabs('/build/abc', { tabs: ['description'] });
    const links = within(screen.getByRole('navigation')).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Description']);
  });
});
