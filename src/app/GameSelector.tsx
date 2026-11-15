import { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  COLOR_DARKER_GREEN,
  COLOR_GOLD,
  COLOR_GREEN,
  COLOR_LIGHTEST_GREEN_LOW_OPACITY,
  BELOW_500,
} from '@/theme';

const TIMEOUT_LENGTH = 1500;
const COMING_SOON = ['Dark Souls', 'Dark Souls II', 'Dark Souls III'] as const;

/** Game tabs: Elden Ring, plus "Coming soon!" (for 1.5 s) when another game is chosen. */
function GameSelector() {
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  useEffect(() => {
    if (comingSoon === null) return undefined;
    const timer = setTimeout(() => setComingSoon(null), TIMEOUT_LENGTH);
    return () => clearTimeout(timer);
  }, [comingSoon]);

  return (
    <Container aria-label="Games">
      <Game type="button" aria-current="page" $current>
        Elden Ring
      </Game>
      {COMING_SOON.map((game) => (
        <Game key={game} type="button" onClick={() => setComingSoon(game)}>
          {game}
          <ComingSoon role="status" $visible={comingSoon === game}>
            {comingSoon === game ? 'Coming soon!' : ''}
          </ComingSoon>
        </Game>
      ))}
    </Container>
  );
}

const Container = styled.nav`
  background-color: ${COLOR_DARKER_GREEN};
  display: flex;
  font-size: 18px;
  height: 34px;
  margin-bottom: 15px;
  width: 100%;

  @media ${BELOW_500} {
    font-size: 14px;
  }
`;

const Game = styled.button<{ $current?: boolean }>`
  align-items: center;
  background-color: ${({ $current }) => ($current ? COLOR_GREEN : 'transparent')};
  border: none;
  border-bottom: 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
  border-right: 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
  border-top: 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
  color: ${COLOR_GOLD};
  cursor: pointer;
  display: flex;
  font: inherit;
  height: 100%;
  justify-content: center;
  padding: 0 4px;
  position: relative;
  white-space: nowrap;
  width: 25%;

  &:last-child {
    border-right: none;
  }

  &:hover {
    background-color: ${COLOR_GREEN};
  }

  &:focus-visible {
    outline: 2px solid ${COLOR_GOLD};
    outline-offset: -2px;
  }
`;

const ComingSoon = styled.span<{ $visible: boolean }>`
  align-items: center;
  background-color: ${COLOR_DARKER_GREEN};
  border: 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
  border-radius: 1px;
  display: flex;
  height: 30px;
  justify-content: center;
  opacity: ${({ $visible }) => ($visible ? 0.9 : 0)};
  padding: 0px 10px;
  pointer-events: none;
  position: absolute;
  top: 36px;
  transition: opacity ease-in-out 0.1s;
  z-index: 5;
`;

export default GameSelector;
