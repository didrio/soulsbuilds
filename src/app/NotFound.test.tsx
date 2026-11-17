import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import Terms from '@/features/legal/Terms';
import NotFound from './NotFound';

describe('page heads', () => {
  it('the 404 page is titled and noindex', () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(document.title).toBe('Page not found | Souls Builds');
    expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex',
    );
  });

  it('a legal page has its title and canonical', () => {
    renderWithProviders(<Terms />);
    expect(document.title).toBe('Terms of use | Souls Builds');
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://soulsbuilds.com/terms',
    );
  });
});
