import type { ReactNode } from 'react';
import styled from 'styled-components';

interface FlexItemProps {
  alignSelf?: string;
  basis?: string;
  children?: ReactNode;
  className?: string;
}

function FlexItem({ alignSelf = 'auto', basis = '1', children, className = '' }: FlexItemProps) {
  return (
    <Container $alignSelf={alignSelf} $basis={basis} className={className}>
      {children}
    </Container>
  );
}

const Container = styled.div<{ $alignSelf: string; $basis: string }>`
  align-self: ${({ $alignSelf }) => $alignSelf};
  flex-basis: ${({ $basis }) => $basis};
`;

export default FlexItem;
