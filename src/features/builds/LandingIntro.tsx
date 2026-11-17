import styled from 'styled-components';
import { useCurrentGame } from '@/app/game';
import Button, { ButtonLink } from '@/components/ui/Button';
import Frame from '@/components/ui/Frame';
import ItemTile from '@/components/ui/ItemTile';
import PageHero from '@/components/ui/PageHero';
import SectionHeading from '@/components/ui/SectionHeading';
import { iconUrl } from '@/data/core';
import { countEvent } from '@/lib/usage';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_REGION,
  TEXT_MD,
  TEXT_SM,
} from '@/theme';
import { INTRO_LEAD, INTRO_PANELS, introItem, introTitle, LIST_HEADING_ID } from './intro';

/** Scrolls to the list's heading and moves focus there, so the keyboard carries on from the list. */
function browseBuilds() {
  const heading = document.getElementById(LIST_HEADING_ID);
  if (!heading) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  heading.focus({ preventScroll: true });
  heading.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

/**
 * The home page's intro for signed-out visitors (T69): the page's `<h1>`, one sentence, and three panels,
 * one button each: plan a build, see an example build's route, browse the list below. Phones get compact
 * rows (one icon beside the text) so the list starts within about a screen.
 */
function LandingIntro() {
  const game = useCurrentGame();
  return (
    <Intro aria-labelledby="intro-title">
      <PageHero
        title={<span id="intro-title">{introTitle(game.name)}</span>}
        tagline={INTRO_LEAD}
      />
      <Panels>
        {INTRO_PANELS.map((panel) => (
          <Panel as="li" key={panel.key}>
            <Icons aria-hidden="true">
              {panel.icons.map((icon) => {
                const item = introItem(icon);
                return item ? <ItemTile key={item.id} src={iconUrl(item.icon)} size={56} /> : null;
              })}
            </Icons>
            <Body>
              <PanelHeading>{panel.title}</PanelHeading>
              <Text>{panel.text}</Text>
            </Body>
            <Action>
              {panel.to ? (
                <ButtonLink
                  to={panel.to}
                  variant={panel.key === 'plan' ? 'primary' : 'secondary'}
                  onClick={() => countEvent(panel.event)}>
                  {panel.action}
                </ButtonLink>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    countEvent(panel.event);
                    browseBuilds();
                  }}>
                  {panel.action}
                </Button>
              )}
            </Action>
          </Panel>
        ))}
      </Panels>
    </Intro>
  );
}

const Intro = styled.section`
  margin-bottom: 40px;

  @media ${BELOW_MOBILE} {
    margin-bottom: ${SPACE_REGION};
  }
`;

const Panels = styled.ul`
  display: grid;
  gap: ${SPACE_GROUP};
  grid-template-columns: repeat(3, minmax(0, 1fr));
  list-style: none;
  margin: ${SPACE_REGION} 0 0;
  padding: 0;

  @media ${BELOW_TABLET} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

// Desktop: icons, text, then the button at the bottom (the three line up). Below 900 px: one row,
// the first icon beside the heading and text, the button under the text.
const Panel = styled(Frame)`
  display: grid;
  gap: ${SPACE_GROUP};
  grid-template-rows: auto 1fr auto;

  @media ${BELOW_TABLET} {
    column-gap: 14px;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
    row-gap: 10px;
  }
`;

const Icons = styled.div`
  display: flex;
  gap: 8px;

  @media ${BELOW_TABLET} {
    grid-row: 1 / span 2;

    & > :not(:first-child) {
      display: none;
    }
  }
`;

const Body = styled.div`
  min-width: 0;
`;

const PanelHeading = styled(SectionHeading)`
  margin-bottom: 6px;
`;

const Text = styled.p`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_MD};
  line-height: 1.5;
  margin: 0;

  @media ${BELOW_TABLET} {
    font-size: ${TEXT_SM};
  }

  /* Phones: the lead sentence already says it; the rows stay short so the list starts within a screen. */
  @media ${BELOW_MOBILE} {
    display: none;
  }
`;

const Action = styled.div`
  display: flex;

  @media ${BELOW_TABLET} {
    grid-column: 2;
  }
`;

export default LandingIntro;
