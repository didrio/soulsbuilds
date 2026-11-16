import type { ReactNode } from 'react';
import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import Ornament from '@/components/ui/Ornament';
import PageHero from '@/components/ui/PageHero';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_FRAME,
  COLOR_TEXT,
  FONT_DISPLAY,
  SPACE_LG,
  SPACE_XL,
  TEXT_LG,
  TEXT_MD,
} from '@/theme';

export const ISSUES_URL = 'https://github.com/didrio/soulsbuilds/issues';

/** Layout for the static legal pages: a title, the last-updated date, and a readable framed column. */
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
    <>
      <PageHero title={title} tagline={`Last updated ${updated}`} />
      <Ornament />
      <Article as="article">{children}</Article>
    </>
  );
}

const Article = styled(Frame)`
  font-size: ${TEXT_MD};
  line-height: 1.7;
  margin: 0 auto;
  max-width: 760px;
  padding: ${SPACE_XL};

  & > :first-child {
    margin-top: 0;
  }

  & h2 {
    color: ${COLOR_ACCENT};
    font-family: ${FONT_DISPLAY};
    font-size: ${TEXT_LG};
    font-weight: 700;
    letter-spacing: 0.04em;
    margin: ${SPACE_XL} 0 ${SPACE_LG};
  }

  & p,
  & li {
    color: ${COLOR_TEXT};
  }

  & a {
    color: ${COLOR_ACCENT};
    text-decoration: underline;
    text-decoration-color: ${COLOR_FRAME};
    text-underline-offset: 3px;
  }

  & a:hover {
    color: ${COLOR_ACCENT_STRONG};
  }

  & ul {
    padding-left: ${SPACE_LG};
  }
`;

export default LegalPage;
