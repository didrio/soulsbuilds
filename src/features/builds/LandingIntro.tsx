import { useState } from 'react';
import styled from 'styled-components';
import { useCurrentGame } from '@/app/game';
import { ButtonLink } from '@/components/ui/Button';
import CloseButton from '@/components/ui/CloseButton';
import Frame from '@/components/ui/Frame';
import ItemTile from '@/components/ui/ItemTile';
import PageHero from '@/components/ui/PageHero';
import SectionHeading from '@/components/ui/SectionHeading';
import { iconUrl } from '@/data/core';
import { countEvent } from '@/lib/usage';
import {
  BELOW_MOBILE,
  BELOW_TABLET,
  COLOR_LINE,
  COLOR_TEXT_MUTED,
  SPACE_GROUP,
  SPACE_LG,
  SPACE_MD,
  SPACE_REGION,
  TEXT_MD,
  TEXT_SM,
} from '@/theme';
import { BUILDS_PATH } from './filters';
import { INTRO_LEAD, INTRO_PANELS, introItem, introTitle } from './intro';

/** localStorage key: the visitor closed the intro's panels (T79). */
export const INTRO_PANELS_KEY = 'sb-intro-panels-dismissed';

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(INTRO_PANELS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * The home page's intro (T69; T79: for everyone): the page's `<h1>`, one sentence and the way to every
 * build ("View all builds"), always; then three panels in one box, one button each (plan a build, see an
 * example build's route, browse builds), until the visitor closes the box (remembered in localStorage;
 * without storage they just come back next visit). Phones get compact rows (one icon beside the text).
 */
function LandingIntro() {
  const game = useCurrentGame();
  const [dismissed, setDismissed] = useState(wasDismissed);

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(INTRO_PANELS_KEY, '1');
    } catch {
      // Private mode or blocked storage: the panels come back next visit.
    }
  };

  return (
    <Intro aria-labelledby="intro-title" $panels={!dismissed}>
      <Top>
        <PageHero
          title={<span id="intro-title">{introTitle(game.name)}</span>}
          tagline={INTRO_LEAD}
        />
        <AllLink to={BUILDS_PATH}>View all builds →</AllLink>
      </Top>
      {dismissed ? null : (
        <Box aria-label="Getting started">
          <Close>
            <CloseButton onClick={dismiss} label="Hide these tips" />
          </Close>
          <Panels>
            {INTRO_PANELS.map((panel) => (
              <Panel key={panel.key}>
                <Icons aria-hidden="true">
                  {panel.icons.map((icon) => {
                    const item = introItem(icon);
                    return item ? (
                      <ItemTile key={item.id} src={iconUrl(item.icon)} size={56} />
                    ) : null;
                  })}
                </Icons>
                <Body>
                  <PanelHeading>{panel.title}</PanelHeading>
                  <Text>{panel.text}</Text>
                </Body>
                <Action>
                  <ButtonLink
                    to={panel.to}
                    variant={panel.key === 'plan' ? 'primary' : 'secondary'}
                    onClick={() => countEvent(panel.event)}>
                    {panel.action}
                  </ButtonLink>
                </Action>
              </Panel>
            ))}
          </Panels>
        </Box>
      )}
    </Intro>
  );
}

const Intro = styled.section<{ $panels: boolean }>`
  margin-bottom: ${({ $panels }) => ($panels ? '40px' : SPACE_REGION)};

  @media ${BELOW_MOBILE} {
    margin-bottom: ${SPACE_REGION};
  }
`;

// The title block on the left, "View all builds" level with the tagline's end on the right.
const Top = styled.div`
  align-items: flex-end;
  display: flex;
  gap: ${SPACE_MD} ${SPACE_LG};
  justify-content: space-between;

  @media ${BELOW_TABLET} {
    align-items: stretch;
    flex-direction: column;
  }
`;

const AllLink = styled(ButtonLink)`
  @media ${BELOW_MOBILE} {
    width: 100%;
  }
`;

// The three panels as one closable box: a frame with the panels inside, divided by rules.
const Box = styled(Frame)`
  margin-top: ${SPACE_REGION};
  padding: 0;
  position: relative;
`;

const Close = styled.div`
  position: absolute;
  right: 4px;
  top: 4px;
  z-index: 1;
`;

const Panels = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  list-style: none;
  margin: 0;
  padding: 0;

  & > li + li {
    border-left: 1px solid ${COLOR_LINE};
  }

  @media ${BELOW_TABLET} {
    grid-template-columns: minmax(0, 1fr);

    & > li + li {
      border-left: none;
      border-top: 1px solid ${COLOR_LINE};
    }
  }
`;

// Desktop: icons, text, then the button at the bottom (the three line up). Below 900 px: one row,
// the first icon beside the heading and text, the button under the text.
const Panel = styled.li`
  display: grid;
  gap: ${SPACE_GROUP};
  grid-template-rows: auto 1fr auto;
  padding: 20px;

  @media ${BELOW_TABLET} {
    column-gap: 14px;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
    padding: 16px 52px 16px 16px;
    row-gap: 10px;

    & + & {
      padding-right: 16px;
    }
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
