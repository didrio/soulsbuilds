// Read-only rendering of a build's markdown description. Light on purpose (react-markdown + GFM, no
// editor, no syntax highlighter): view mode is what most visitors load (T11). Raw HTML in the source is
// not rendered, and everything that is goes through rehype-sanitize.
import Markdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import styled from 'styled-components';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_INSET,
  COLOR_LINE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  FONT_PROSE,
  FONT_UI,
} from '@/theme';

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeSanitize];

function MarkdownView({ source }: { source: string }) {
  return (
    <Body>
      <Markdown
        components={{
          // User links open in a new tab without handing over the opener.
          a: ({ node: _node, children, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
        rehypePlugins={REHYPE_PLUGINS}
        remarkPlugins={REMARK_PLUGINS}>
        {source}
      </Markdown>
    </Body>
  );
}

// The write-up in the prose face, with a drop cap on the first paragraph.
const Body = styled.div`
  color: ${COLOR_TEXT};
  font-family: ${FONT_PROSE};
  font-size: 19px;
  line-height: 1.6;
  max-width: 68ch;
  overflow-wrap: anywhere;

  & > p:first-child::first-letter {
    color: ${COLOR_ACCENT};
    float: left;
    font-family: ${FONT_DISPLAY};
    font-size: 3.1em;
    line-height: 0.9;
    padding: 4px 8px 0 0;
  }

  /* A short first paragraph still holds the whole drop cap, so a list after it doesn't wrap round it. */
  & > p:first-child::after {
    clear: both;
    content: '';
    display: block;
  }

  & > :first-child {
    margin-top: 0;
  }

  & > :last-child {
    margin-bottom: 0;
  }

  & h1,
  & h2,
  & h3,
  & h4,
  & h5,
  & h6 {
    color: ${COLOR_TEXT};
    font-family: ${FONT_DISPLAY};
    line-height: 1.25;
    margin: 1.2em 0 0.5em;
  }

  & h1 {
    border-bottom: 1px solid ${COLOR_LINE};
    font-size: 1.6em;
    padding-bottom: 0.2em;
  }

  & h2 {
    border-bottom: 1px solid ${COLOR_LINE};
    font-size: 1.35em;
    padding-bottom: 0.2em;
  }

  & h3 {
    font-size: 1.15em;
  }

  & h4,
  & h5,
  & h6 {
    font-size: 1em;
  }

  & p,
  & ul,
  & ol,
  & blockquote,
  & pre,
  & table {
    margin: 0 0 1em;
  }

  & ul,
  & ol {
    padding-left: 1.6em;
  }

  & a {
    color: ${COLOR_ACCENT};
    cursor: pointer;
    text-decoration: underline;
  }

  & a:hover {
    color: ${COLOR_ACCENT_STRONG};
  }

  & blockquote {
    border-left: 2px solid ${COLOR_ACCENT};
    color: ${COLOR_TEXT_MUTED};
    margin-left: 0;
    padding: 0 1em;
  }

  & code {
    background-color: ${COLOR_INSET};
    font-family: ui-monospace, monospace;
    border-radius: 3px;
    font-size: 0.9em;
    padding: 0.15em 0.35em;
  }

  & pre {
    background-color: ${COLOR_INSET};
    border-radius: 4px;
    overflow: auto;
    padding: 12px;
  }

  & pre code {
    background: none;
    padding: 0;
  }

  & hr {
    border: none;
    border-top: 1px solid ${COLOR_LINE};
    margin: 1.5em 0;
  }

  & img {
    height: auto;
    max-width: 100%;
  }

  & table {
    border-collapse: collapse;
    display: block;
    max-width: 100%;
    overflow-x: auto;
  }

  & th,
  & td {
    border: 1px solid ${COLOR_LINE};
    padding: 6px 12px;
  }

  & th {
    background-color: ${COLOR_SURFACE_RAISED};
  }

  & table {
    font-family: ${FONT_UI};
    font-size: 15px;
  }
`;

export default MarkdownView;
