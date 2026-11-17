import { useId, useState } from 'react';
import { Link } from 'react-router';
import styled from 'styled-components';
import FocusScope from '@/components/ui/FocusScope';
import { CheckIcon, ChevronDownIcon } from '@/components/ui/icons';
import OutsideClickHandler from '@/components/ui/OutsideClickHandler';
import {
  BELOW_MOBILE,
  COLOR_ACCENT,
  COLOR_BG,
  COLOR_LINE,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  SHADOW_OVERLAY,
  TEXT_MD,
  TEXT_XS,
} from '@/theme';
import { UPCOMING_GAMES, useCurrentGame } from './game';

/**
 * The header's game name (T79): a disclosure listing the games, which is where players will switch
 * between them (on phones, in the Menu panel). Only the current one exists; the others say "Coming soon" (visible, so it works on
 * touch too). Same pattern as `AccountMenu`: Escape or a click outside closes it.
 */
function GameMenu() {
  const game = useCurrentGame();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <OutsideClickHandler onOutsideClick={close}>
      <Anchor>
        <GameButton
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          aria-label={`Game: ${game.name}`}
          onClick={() => setOpen(!open)}>
          {game.name}
          <ChevronDownIcon size={14} aria-hidden="true" />
        </GameButton>
        {open ? (
          <Panel id={panelId} onEscape={close}>
            <GameList onNavigate={close} />
          </Panel>
        ) : null}
      </Anchor>
    </OutsideClickHandler>
  );
}

/**
 * The games, current first (a link home, checked), then the ones coming (T79). In the header's panel on
 * wider screens, and in the phone menu.
 */
export function GameList({ onNavigate }: { onNavigate: () => void }) {
  const game = useCurrentGame();
  return (
    <List aria-label="Games">
      <li>
        <Current to="/" aria-current="true" onClick={onNavigate}>
          {game.name}
          <CheckIcon size={16} aria-hidden="true" />
        </Current>
      </li>
      {UPCOMING_GAMES.map((name) => (
        <Upcoming key={name} aria-disabled="true">
          <span>{name}</span>
          <Soon>Coming soon</Soon>
        </Upcoming>
      ))}
    </List>
  );
}

// Phones: the game list lives in the header's Menu panel instead (T79: the bar has no room for it).
const Anchor = styled.div`
  position: relative;

  @media ${BELOW_MOBILE} {
    display: none;
  }
`;

const GameButton = styled.button`
  align-items: center;
  background: none;
  border: none;
  color: ${COLOR_TEXT_MUTED};
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: ${TEXT_MD};
  gap: 4px;
  min-height: 44px;
  padding: 0 8px;
  white-space: nowrap;

  &:hover,
  &[aria-expanded='true'] {
    color: ${COLOR_TEXT};
  }

  & > svg {
    flex: none;
    position: relative;
    top: 1px;
    transition: transform 0.15s;
  }

  &[aria-expanded='true'] > svg {
    color: ${COLOR_ACCENT};
    transform: rotate(180deg);
  }
`;

const Panel = styled(FocusScope)`
  background: ${COLOR_BG};
  border: 1px solid ${COLOR_LINE};
  border-radius: 4px;
  box-shadow: ${SHADOW_OVERLAY};
  left: 0;
  min-width: 280px;
  outline: none;
  padding: 4px 0;
  position: absolute;
  top: calc(100% + 4px);
  z-index: 50;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const row = `
  align-items: center;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  min-height: 44px;
  padding: 0 16px;
`;

const Current = styled(Link)`
  ${row}
  color: ${COLOR_TEXT};
  font-weight: 500;

  &:hover {
    background: ${COLOR_SURFACE_RAISED};
    color: ${COLOR_TEXT};
  }

  & > svg {
    color: ${COLOR_ACCENT};
  }
`;

const Upcoming = styled.li`
  ${row}
  white-space: nowrap;
  border-top: 1px solid ${COLOR_LINE};
  color: ${COLOR_TEXT_MUTED};
  cursor: default;
`;

const Soon = styled.span`
  font-size: ${TEXT_XS};
  white-space: nowrap;
`;

export default GameMenu;
