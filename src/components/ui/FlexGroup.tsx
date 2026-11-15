import type { ComponentPropsWithoutRef } from 'react';
import styled from 'styled-components';

export type FlexGroupProps = ComponentPropsWithoutRef<'div'> & {
  basis?: string;
  /** Column instead of row. */
  vertical?: boolean;
};

/**
 * A flex `<div>` (row, or column with `vertical`). The 2022 layout is built from these. Other div
 * props (role, aria-*, tabIndex, handlers…) pass through.
 */
function FlexGroup({ basis = '1', vertical = false, ...rest }: FlexGroupProps) {
  return <Container $basis={basis} $vertical={vertical} {...rest} />;
}

const Container = styled.div<{ $basis: string; $vertical: boolean }>`
  display: flex;
  flex-basis: ${({ $basis }) => $basis};
  flex-direction: ${({ $vertical }) => ($vertical ? 'column' : 'row')};
`;

export default FlexGroup;
