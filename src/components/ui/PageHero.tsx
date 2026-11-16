import type { ReactNode } from 'react';
import styled from 'styled-components';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_GLOW,
  COLOR_GLOW_STRONG,
  COLOR_HIGHLIGHT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  FONT_PROSE,
  TEXT_DISPLAY,
  TEXT_XXL,
} from '@/theme';

interface PageHeroProps {
  /** The page's `<h1>`. */
  title: ReactNode;
  /** A line under the title, in the prose face. */
  tagline?: ReactNode;
  /** Anything under the tagline (meta line, actions). */
  children?: ReactNode;
}

/** A page's title block: centered display title with the "grace" glow behind it, and a tagline. */
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
  padding-top: 56px;
  position: relative;
  text-align: center;

  &::before {
    background:
      radial-gradient(ellipse 40% 45% at 50% 40%, ${COLOR_GLOW_STRONG}, transparent 70%),
      radial-gradient(ellipse at 50% 30%, ${COLOR_GLOW}, transparent 70%);
    content: '';
    height: 300px;
    left: 50%;
    pointer-events: none;
    position: absolute;
    top: -40px;
    transform: translateX(-50%);
    width: min(900px, 140%);
  }

  & > * {
    position: relative;
  }

  @media ${BELOW_MOBILE} {
    padding-top: 32px;
  }
`;

const Title = styled.h1`
  background: linear-gradient(${COLOR_HIGHLIGHT} 30%, ${COLOR_ACCENT});
  background-clip: text;
  color: transparent;
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_DISPLAY};
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.1;
  margin: 0;
  overflow-wrap: anywhere;

  @media ${BELOW_MOBILE} {
    font-size: ${TEXT_XXL};
  }
`;

const Tagline = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-family: ${FONT_PROSE};
  font-size: 20px;
  font-style: italic;
  margin: 8px 0 0;

  @media ${BELOW_MOBILE} {
    font-size: 17px;
  }
`;

export default PageHero;
