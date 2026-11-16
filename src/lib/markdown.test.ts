import { describe, expect, it } from 'vitest';
import { firstParagraph } from './markdown';

describe('firstParagraph', () => {
  it('skips headings and joins the first paragraph into one line', () => {
    expect(
      firstParagraph('# Spoilers\n\n## Note\nThe early game\nis sword and board.\n\nLater.'),
    ).toBe('The early game is sword and board.');
  });

  it('turns links, emphasis and code into plain text', () => {
    expect(
      firstParagraph(
        'Use **Moonveil** with *Glintstone* `Pebble` and [Rennala](https://x.y) ![i](a.png)',
      ),
    ).toBe('Use Moonveil with Glintstone Pebble and Rennala');
  });

  it('keeps underscores inside words', () => {
    expect(firstParagraph('snake_case_name stays')).toBe('snake_case_name stays');
  });

  it('skips rules, code and tables, then falls back to a list', () => {
    expect(firstParagraph('---\n\n```\ncode\n```\n\n| a | b |\n\n- one\n- two')).toBe('one two');
  });

  it('is empty for an empty or heading-only write-up', () => {
    expect(firstParagraph('')).toBe('');
    expect(firstParagraph('## Only a heading')).toBe('');
  });
});
