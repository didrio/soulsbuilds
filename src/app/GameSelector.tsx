import { useState, useEffect } from 'react';
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import { COLOR_DARKER_GREEN, COLOR_LIGHTEST_GREEN_LOW_OPACITY, COLOR_GREEN } from '@/theme';

const TIMEOUT_LENGTH = 1500;

/** Cosmetic game tabs: Elden Ring, plus "Coming soon!" for the other games. */
function GameSelector() {
  const [showFirstComingSoon, setShowFirstComingSoon] = useState(false);
  const [showSecondComingSoon, setShowSecondComingSoon] = useState(false);
  const [showThirdComingSoon, setShowThirdComingSoon] = useState(false);

  const handleShowFirstComingSoon = () => {
    setShowFirstComingSoon(true);
  };

  const handleShowSecondComingSoon = () => {
    setShowSecondComingSoon(true);
  };

  const handleShowThirdComingSoon = () => {
    setShowThirdComingSoon(true);
  };

  // The cleanups pass the function, not the timer id, so they never clear anything (T5).
  useEffect(() => {
    const timeoutFunc = () => {
      setShowFirstComingSoon(false);
    };
    if (showFirstComingSoon) {
      setTimeout(timeoutFunc, TIMEOUT_LENGTH);
    }
    return () => {
      clearTimeout(timeoutFunc as unknown as number);
    };
  }, [showFirstComingSoon]);

  useEffect(() => {
    const timeoutFunc = () => {
      setShowSecondComingSoon(false);
    };
    if (showSecondComingSoon) {
      setTimeout(timeoutFunc, TIMEOUT_LENGTH);
    }
    return () => {
      clearTimeout(timeoutFunc as unknown as number);
    };
  }, [showSecondComingSoon]);

  useEffect(() => {
    const timeoutFunc = () => {
      setShowThirdComingSoon(false);
    };
    if (showThirdComingSoon) {
      setTimeout(timeoutFunc, TIMEOUT_LENGTH);
    }
    return () => {
      clearTimeout(timeoutFunc as unknown as number);
    };
  }, [showThirdComingSoon]);

  return (
    <Container>
      <Game>Elden Ring</Game>
      <Game onClick={handleShowFirstComingSoon}>
        Dark Souls
        <ComingSoon $visible={showFirstComingSoon}>Coming soon!</ComingSoon>
      </Game>
      <Game onClick={handleShowSecondComingSoon}>
        Dark Souls II
        <ComingSoon $visible={showSecondComingSoon}>Coming soon!</ComingSoon>
      </Game>
      <Game onClick={handleShowThirdComingSoon}>
        Dark Souls III
        <ComingSoon $visible={showThirdComingSoon}>Coming soon!</ComingSoon>
      </Game>
    </Container>
  );
}

// Two rules below are missing their colon (`border-top 1px…`, `border 1px…`), so browsers drop
// them (T5).
const Container = styled(FlexGroup)`
  font-size: 18px;
  height: 34px;
  width: 100%;
  background-color: ${COLOR_DARKER_GREEN};
  margin-bottom: 15px;

  & > div {
    border-right: 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
    border-bottom: 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
    border-top 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
  }

  & > div:last-child {
    border-right: none;
  }

  & > div:first-child {
    background-color: ${COLOR_GREEN};
  }
`;

const Game = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 25%;
  cursor: pointer;
  position: relative;

  &:hover {
    background-color: ${COLOR_GREEN};
  }
`;

const ComingSoon = styled(FlexGroup)<{ $visible: boolean }>`
  position: absolute;
  padding: 0px 10px;
  height: 30px;
  top: 36px;
  background-color: ${COLOR_DARKER_GREEN};
  border 1px solid ${COLOR_LIGHTEST_GREEN_LOW_OPACITY};
  border-radius: 1px;
  transition: opacity ease-in-out .1s;
  opacity: ${({ $visible }) => ($visible ? '.9' : '0')};
  justify-content: center;
  align-items: center;
`;

export default GameSelector;
