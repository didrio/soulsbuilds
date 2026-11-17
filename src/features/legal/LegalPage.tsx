import type { ReactNode } from 'react';
import styled from 'styled-components';
import Frame from '@/components/ui/Frame';
import PageHead from '@/components/ui/PageHead';
import PageHero from '@/components/ui/PageHero';
import { displayText } from '@/components/ui/typography';
import { pageTitle, SITE_ORIGIN } from '@/lib/share';
import {
  COLOR_ACCENT,
  COLOR_ACCENT_STRONG,
  COLOR_TEXT,
  MEASURE,
  SPACE_GROUP,
  SPACE_LG,
  SPACE_PANEL,
  SPACE_REGION,
  SPACE_XL,
  TEXT_BODY,
  TEXT_XL,
} from '@/theme';

export const ISSUES_URL = 'https://github.com/didrio/soulsbuilds/issues';

/** Layout for the static legal pages: a title, the last-updated date, and a readable panel. */
function LegalPage({
  title,
  path,
  updated,
  children,
}: {
  title: string;
  /** The page's URL path, for its canonical link. */
  path: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHead title={pageTitle(title)} canonical={`${SITE_ORIGIN}${path}`} />
      <PageHero title={title} tagline={`Last updated ${updated}`} />
      <Article as="article">{children}</Article>
    </>
  );
}

const Article = styled(Frame)`
  font-size: ${TEXT_BODY};
  line-height: 1.7;
  margin: ${SPACE_REGION} 0 0;
  max-width: calc(${MEASURE} + 2 * ${SPACE_PANEL});

  & > :first-child {
    margin-top: 0;
  }

  & h2 {
    ${displayText}
    font-size: ${TEXT_XL};
    margin: ${SPACE_XL} 0 ${SPACE_GROUP};
  }

  & p,
  & li {
    color: ${COLOR_TEXT};
  }

  & a {
    color: ${COLOR_ACCENT};
    text-decoration: underline;
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
