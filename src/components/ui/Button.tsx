import type { ReactNode } from 'react';
import styled from 'styled-components';
import {
  COLOR_GOLD,
  COLOR_DARK_GOLD,
  COLOR_LIGHT_GREEN,
  COLOR_DARKER_GREEN,
  COLOR_LIGHT_GOLD,
  COLOR_GREEN,
  COLOR_SHADOW,
  FONT_BODY,
} from '@/theme';

interface ButtonProps {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}

function Button({ className = '', children, disabled = false, onClick }: ButtonProps) {
  return (
    <Container className={className} disabled={disabled} onClick={onClick}>
      {children}
    </Container>
  );
}

const Container = styled.button`
  width: 150px;
  height: 40px;
  color: ${COLOR_DARKER_GREEN};
  font-size: 16px;
  border-radius: 5px;
  padding: 10px 25px;
  font-weight: bold;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: inline-block;
  box-shadow:
    inset 2px 2px 2px 0px ${COLOR_LIGHT_GOLD},
    7px 7px 20px 0px ${COLOR_SHADOW},
    4px 4px 5px 0px ${COLOR_SHADOW};
  outline: none;
  background-color: ${COLOR_GOLD};
  background-image: linear-gradient(315deg, ${COLOR_GOLD} 0%, ${COLOR_DARK_GOLD} 74%);
  border: none;
  z-index: 1;
  font-family: ${FONT_BODY};

  &:after {
    position: absolute;
    content: '';
    width: 100%;
    height: 0;
    bottom: 0;
    left: 0;
    z-index: -1;
    border-radius: 5px;
    background-image: linear-gradient(315deg, ${COLOR_LIGHT_GOLD} 0%, ${COLOR_GOLD} 74%);
    box-shadow: 0px 0px 10px ${COLOR_LIGHT_GREEN};
    transition: all 0.3s ease;
  }

  &:enabled:hover {
    color: ${COLOR_GREEN};
  }

  &:enabled:hover:after {
    top: 0;
    height: 100%;
  }

  &:enabled:active {
    top: 2px;
  }

  &:disabled {
    cursor: auto;
    opacity: 0.4;
  }
`;

export default Button;
