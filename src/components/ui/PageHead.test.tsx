import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import PageHead from './PageHead';

const tag = (selector: string) => document.head.querySelector(selector);

afterEach(() => {
  document.head.innerHTML = '';
  document.title = '';
});

describe('PageHead', () => {
  it('sets the title and the description, creating the tag when the page has none', () => {
    render(<PageHead title="Privacy | Souls Builds" description="What we store." />);
    expect(document.title).toBe('Privacy | Souls Builds');
    expect(tag('meta[name="description"]')).toHaveAttribute('content', 'What we store.');
  });

  it("edits the head's own tags instead of adding second ones", () => {
    document.head.innerHTML = `<title>Old</title><meta name="description" content="Old" /><link rel="canonical" href="https://soulsbuilds.com/build/A" />`;
    render(
      <PageHead
        title="New | Souls Builds"
        description="New text"
        canonical="https://soulsbuilds.com/build/A"
      />,
    );
    expect(document.head.querySelectorAll('title')).toHaveLength(1);
    expect(document.title).toBe('New | Souls Builds');
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });

  it('adds a canonical link and removes it with the page', () => {
    const { unmount } = render(<PageHead title="T" canonical="https://soulsbuilds.com/terms" />);
    expect(tag('link[rel="canonical"]')).toHaveAttribute('href', 'https://soulsbuilds.com/terms');
    unmount();
    expect(tag('link[rel="canonical"]')).toBeNull();
  });

  it('marks a page noindex, and lifts it when the page goes', () => {
    const { unmount } = render(<PageHead title="T" noindex />);
    expect(tag('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    unmount();
    expect(tag('meta[name="robots"]')).toBeNull();
  });

  it('puts no canonical or robots tag on a page that asks for neither', () => {
    render(<PageHead title="T" />);
    expect(tag('link[rel="canonical"]')).toBeNull();
    expect(tag('meta[name="robots"]')).toBeNull();
  });
});
