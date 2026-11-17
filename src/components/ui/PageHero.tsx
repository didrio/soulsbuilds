import type { ReactNode } from 'react';
import styled from 'styled-components';
import { BELOW_MOBILE, COLOR_TEXT_MUTED, MEASURE, TEXT_LG, TEXT_MD, TEXT_XXL } from '@/theme';
import { displayText } from './typography';

interface PageHeroProps {
  /** The page's `<h1>`. */
  title: ReactNode;
  /** A line under the title, muted. */
  tagline?: ReactNode;
  /** Anything under the tagline (meta line, actions). */
  children?: ReactNode;
}

/** A page's title block: the serif `<h1>` in the text color, and an optional tagline. */
function PageHero({ title, tagline, children }: PageHeroProps) {
  return (
    <Hero>
      <Title>{title}</Title>
      {tagline ? <Tagline>{tagline}</Tagline> : null}
      {children}
    </Hero>
  );
}

const Hero = styled.section`
  padding-top: 32px;

  @media ${BELOW_MOBILE} {
    padding-top: 16px;
  }
`;

const Title = styled.h1`
  ${displayText}
  font-size: ${TEXT_XXL};
  margin: 0;
  overflow-wrap: anywhere;

  @media ${BELOW_MOBILE} {
    font-size: 1.75rem;
  }
`;

const Tagline = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_LG};
  margin: 6px 0 0;
  max-width: ${MEASURE};

  @media ${BELOW_MOBILE} {
    font-size: ${TEXT_MD};
  }
`;

export default PageHero;
