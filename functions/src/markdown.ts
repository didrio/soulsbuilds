// A build's markdown write-up as HTML for the page the function serves (T50): the app's MarkdownView
// pipeline (GFM, raw HTML dropped, rehype-sanitize) without React or the "Jump to" row. Links get
// rel="nofollow ugc" because the write-ups are user content.
import type { Element, Root, RootContent } from 'hast';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

function markUserLinks() {
  const visit = (node: Root | RootContent) => {
    if (node.type === 'element' && node.tagName === 'a') {
      (node as Element).properties.rel = ['nofollow', 'ugc', 'noopener'];
    }
    if ('children' in node) node.children.forEach(visit);
  };
  return (tree: Root) => visit(tree);
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(markUserLinks)
  .use(rehypeStringify);

/** Sanitized HTML for the write-up (raw HTML in the source is dropped, as in the app). */
export function markdownToHtml(markdown: string): string {
  return String(processor.processSync(markdown));
}
