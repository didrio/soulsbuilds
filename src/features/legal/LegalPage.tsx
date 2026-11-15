import type { ReactNode } from 'react';
import styled from 'styled-components';
import { COLOR_LIGHTEST_GREEN, FONT_DISPLAY, SPACE_GUTTER, SPACE_LG, SPACE_XL } from '@/theme';

export const ISSUES_URL = 'https://github.com/didrio/soulsbuilds/issues';

/** Layout for the static legal pages: a readable column with a title and the last-updated date. */
function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <Article>
      <h1>{title}</h1>
      <p>Last updated: {updated}</p>
      {children}
    </Article>
  );
}

const Article = styled.article`
  box-sizing: border-box;
  font-size: 18px;
  line-height: 1.6;
  margin: 0 auto;
  max-width: 760px;
  padding: 0 ${SPACE_GUTTER} ${SPACE_XL};
  width: 100%;

  & h1,
  & h2 {
    color: ${COLOR_LIGHTEST_GREEN};
    font-family: ${FONT_DISPLAY};
    font-weight: normal;
  }

  & h1 {
    font-size: 32px;
    margin: 0 0 ${SPACE_LG};
  }

  & h2 {
    font-size: 22px;
    margin: ${SPACE_XL} 0 0;
  }

  & a {
    color: ${COLOR_LIGHTEST_GREEN};
    text-decoration: underline;
  }

  & ul {
    padding-left: ${SPACE_LG};
  }
`;

export default LegalPage;
