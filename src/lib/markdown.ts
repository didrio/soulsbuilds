// Plain text from a build's markdown write-up, for previews (framework-free, no markdown parser:
// previews only need to read well, and the full write-up renders through react-markdown).

/** Inline markdown → plain text: links and images to their text, emphasis, code and HTML tags dropped. */
function inlineText(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(^|[^\w*])[*_]([^*_\n]+)[*_](?![\w*])/g, '$1$2')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const NOT_PROSE = /^(#{1,6}\s|```|~~~|[-*_]{3,}\s*$|\||<)/;
const LIST_OR_QUOTE = /^(\s*([-*+]|\d+[.)])\s+|>\s?)/;

/**
 * The write-up's first paragraph as plain text ("Read the description" card, T28): the first block of
 * prose, skipping headings, rules, code, tables and HTML; a list or quote if there's no prose; '' if
 * nothing reads as text.
 */
export function firstParagraph(markdown: string): string {
  const blocks = markdown
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    // A heading is one line: what follows it without a blank line is its own block.
    .map((block) => block.replace(/^(\s*#{1,6}\s.*(\n|$))+/, '').trim())
    .filter(Boolean);
  const prose = blocks.find((block) => !NOT_PROSE.test(block) && !LIST_OR_QUOTE.test(block));
  const fallback = blocks.find((block) => LIST_OR_QUOTE.test(block));
  const block = prose ?? fallback ?? '';
  const lines = block.split('\n').map((line) => line.replace(LIST_OR_QUOTE, ''));
  return inlineText(lines.join(' '));
}
