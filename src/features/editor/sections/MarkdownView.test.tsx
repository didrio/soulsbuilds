import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import MarkdownView from './MarkdownView';

describe('MarkdownView', () => {
  it('renders headings, lists and GFM tables', () => {
    render(
      <MarkdownView source={'# Plan\n\n- first\n- second\n\n| a | b |\n|---|---|\n| 1 | 2 |'} />,
    );
    expect(screen.getByRole('heading', { name: 'Plan' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('opens links in a new tab without the opener', () => {
    render(<MarkdownView source="[wiki](https://example.com)" />);
    const link = screen.getByRole('link', { name: 'wiki' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('links the sections from a Jump to row, in the same tab', () => {
    render(<MarkdownView source={'## Weapon\n\nSword.\n\n## Stats\n\nFaith.'} />);
    const jump = screen.getByRole('navigation', { name: 'Jump to' });
    const link = within(jump).getByRole('link', { name: 'Stats' });
    expect(link).toHaveAttribute('href', '#user-content-stats');
    expect(link).not.toHaveAttribute('target');
    expect(screen.getByRole('heading', { name: 'Stats' })).toHaveAttribute(
      'id',
      'user-content-stats',
    );
  });

  it('never renders scripts, raw HTML or javascript: links', () => {
    const { container } = render(
      <MarkdownView
        source={'<script>alert(1)</script><img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))'}
      />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
    expect(container.querySelector('a[href^="javascript"]')).toBeNull();
  });
});
