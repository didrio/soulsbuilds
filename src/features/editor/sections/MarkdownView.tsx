// Read-only rendering of a build's markdown description. Light on purpose (react-markdown + GFM, no
// editor, no syntax highlighter): view mode is what most visitors load (T11). Raw HTML in the source is
// not rendered, and everything that is goes through rehype-sanitize. Then `rehypeJumpTo` adds section
// ids and the "Jump to" row (T28).
import Markdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import styled from 'styled-components';
import { displayText, labelText } from '@/components/ui/typography';
import {
  BELOW_TABLET,
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_INSET,
  COLOR_LINE,
  COLOR_LINE_STRONG,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_PROSE,
  FONT_UI,
  SPACE_SM,
  TEXT_SM,
  TEXT_XL,
  TEXT_XS,
} from '@/theme';
import { TAB_BAR_HEIGHT } from './BuildTabs';
import { PHONE_OPEN_HEADER_HEIGHT } from './PhoneSection';
import rehypeJumpTo from './rehypeJumpTo';

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeSanitize, rehypeJumpTo];

function MarkdownView({ source }: { source: string }) {
  return (
    <Body>
      <Markdown
        components={{
          // User links open in a new tab without handing over the opener; links within the
          // write-up (Jump to) stay in it.
          a: ({ node: _node, children, ...props }) =>
            props.href?.startsWith('#') ? (
              <a {...props}>{children}</a>
            ) : (
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

// The write-up: EB Garamond 18px/1.6. Headings follow the type tiers (T26): h1 and h2 in the serif
// (h2 with a hairline under it), h3 as the caps label, h4 Inter 15px/600; h5 and h6 as h4.
const Body = styled.div`
  color: ${COLOR_TEXT};
  font-family: ${FONT_PROSE};
  font-size: 18px;
  line-height: 1.6;
  max-width: 68ch;
  overflow-wrap: anywhere;

  & > :first-child {
    margin-top: 0;
  }

  & > :last-child {
    margin-bottom: 0;
  }

  /* A section heading jumped to lands under the sticky tab bar (phones: the open section's header). */
  & [id] {
    scroll-margin-top: ${TAB_BAR_HEIGHT + 16}px;

    @media ${BELOW_TABLET} {
      scroll-margin-top: ${PHONE_OPEN_HEADER_HEIGHT + 16}px;
    }
  }

  /* "Jump to": the label, then the sections as small chips (44 px tap targets). */
  & > nav.jump-to {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    font-family: ${FONT_UI};
    gap: 0 6px;
    margin: 0 0 ${SPACE_SM};
  }

  & > nav.jump-to > span {
    ${labelText}
    margin-right: 6px;
  }

  & > nav.jump-to > a {
    align-items: center;
    color: ${COLOR_TEXT_MUTED};
    display: inline-flex;
    font-size: ${TEXT_SM};
    isolation: isolate;
    min-height: 44px;
    padding: 0 10px;
    position: relative;
    text-decoration: none;
  }

  /* The visible chip is 32 px, inside the 44 px link. */
  & > nav.jump-to > a::before {
    background: ${COLOR_INSET};
    border: 1px solid ${COLOR_LINE};
    border-radius: 3px;
    content: '';
    inset: 6px 0;
    position: absolute;
    z-index: -1;
  }

  & > nav.jump-to > a:hover {
    color: ${COLOR_TEXT};
  }

  & > nav.jump-to > a:hover::before {
    border-color: ${COLOR_LINE_STRONG};
  }

  & h1,
  & h2 {
    ${displayText}
    line-height: 1.2;
    margin: 1.4em 0 0.4em;
  }

  & h1 {
    font-size: 28px;
  }

  & h2 {
    border-bottom: 1px solid ${COLOR_LINE};
    font-size: ${TEXT_XL};
    padding-bottom: 6px;
  }

  & h3 {
    ${labelText}
    font-size: ${TEXT_XS};
    margin: 1.4em 0 0.3em;
  }

  & h4,
  & h5,
  & h6 {
    color: ${COLOR_TEXT};
    font-family: ${FONT_UI};
    font-size: 15px;
    font-weight: 600;
    line-height: 1.4;
    margin: 1em 0 0.3em;
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
    border-left: 2px solid ${COLOR_LINE_STRONG};
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
