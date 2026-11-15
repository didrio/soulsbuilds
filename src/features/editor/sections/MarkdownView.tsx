// Read-only rendering of a build's markdown description. Light on purpose (react-markdown + GFM, no
// editor, no syntax highlighter): view mode is what most visitors load (T11). Raw HTML in the source is
// not rendered, and everything that is goes through rehype-sanitize.
import Markdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import styled from 'styled-components';
import {
  COLOR_DARK_GREEN,
  COLOR_GOLD,
  COLOR_GREEN,
  COLOR_LIGHT_GREEN,
  COLOR_LIGHTEST_GREEN,
  FONT_BODY,
  FONT_DISPLAY,
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

const Body = styled.div`
  background-color: ${COLOR_DARK_GREEN};
  color: ${COLOR_GOLD};
  font-family: ${FONT_BODY};
  font-size: 18px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  padding: 16px;
  width: 100%;

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
    color: ${COLOR_LIGHTEST_GREEN};
    font-family: ${FONT_DISPLAY};
    line-height: 1.25;
    margin: 1.2em 0 0.5em;
  }

  & h1 {
    border-bottom: 1px solid ${COLOR_LIGHT_GREEN};
    font-size: 1.6em;
    padding-bottom: 0.2em;
  }

  & h2 {
    border-bottom: 1px solid ${COLOR_LIGHT_GREEN};
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
    color: ${COLOR_LIGHTEST_GREEN};
    cursor: pointer;
    text-decoration: underline;
  }

  & blockquote {
    border-left: 4px solid ${COLOR_LIGHT_GREEN};
    margin-left: 0;
    padding: 0 1em;
  }

  & code {
    background-color: ${COLOR_GREEN};
    border-radius: 3px;
    font-size: 0.9em;
    padding: 0.15em 0.35em;
  }

  & pre {
    background-color: ${COLOR_GREEN};
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
    border-top: 1px solid ${COLOR_LIGHT_GREEN};
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
    border: 1px solid ${COLOR_LIGHT_GREEN};
    padding: 6px 12px;
  }

  & th {
    background-color: ${COLOR_GREEN};
  }
`;

export default MarkdownView;
