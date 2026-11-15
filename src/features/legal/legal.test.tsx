import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Footer from '@/app/Footer';
import { renderWithProviders } from '@/test/render';
import Privacy from './Privacy';
import Terms from './Terms';

describe('legal pages', () => {
  it('the privacy policy says what is stored and how to get it deleted', () => {
    renderWithProviders(<Privacy />);
    expect(screen.getByRole('heading', { level: 1, name: 'Privacy policy' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What we store' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Keeping and deleting your data' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute(
      'href',
      'https://policies.google.com/terms',
    );
    expect(screen.getByRole('link', { name: 'terms of use' })).toHaveAttribute('href', '/terms');
  });

  it('the terms link back to the privacy policy', () => {
    renderWithProviders(<Terms />);
    expect(screen.getByRole('heading', { level: 1, name: 'Terms of use' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'privacy policy' })).toHaveAttribute(
      'href',
      '/privacy',
    );
  });

  it('the footer links to both', () => {
    renderWithProviders(<Footer />);
    const nav = screen.getByRole('navigation', { name: 'Legal' });
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Privacy' }));
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  });
});
