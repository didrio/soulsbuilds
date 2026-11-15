import type { ReactNode } from 'react';
import styled from 'styled-components';

const noop = () => {};

export interface FlexGroupProps {
  basis?: string;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  /** Column instead of row. */
  vertical?: boolean;
}

/** A flex `<div>` (row, or column with `vertical`). The 2022 layout is built from these. */
function FlexGroup({
  basis = '1',
  children,
  className = '',
  onClick = noop,
  onMouseEnter = noop,
  onMouseLeave = noop,
  vertical = false,
}: FlexGroupProps) {
  const handleClick = () => {
    onClick();
  };

  const handleMouseEnter = () => {
    onMouseEnter();
  };

  const handleMouseLeave = () => {
    onMouseLeave();
  };

  return (
    <Container
      $basis={basis}
      $vertical={vertical}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {children}
    </Container>
  );
}

const Container = styled.div<{ $basis: string; $vertical: boolean }>`
  display: flex;
  flex-basis: ${({ $basis }) => $basis};
  flex-direction: ${({ $vertical }) => ($vertical ? 'column' : 'row')};
`;

export default FlexGroup;
