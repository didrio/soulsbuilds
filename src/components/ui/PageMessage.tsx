import type { ReactNode } from 'react';
import styled from 'styled-components';
import { COLOR_TEXT, COLOR_TEXT_MUTED, FONT_DISPLAY, TEXT_XL } from '@/theme';
import LoadingAnimation from './LoadingAnimation';
import Ornament from './Ornament';

/** A centered page state: loading spinner, or a title with optional text/actions (empty, not found…). */
function PageMessage({
  loading = false,
  title,
  children,
}: {
  loading?: boolean;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <Container aria-busy={loading || undefined}>
      {loading ? <LoadingAnimation size={40} /> : null}
      {title ? (
        <>
          <Title>{title}</Title>
          <Ornament compact />
        </>
      ) : null}
      {children}
    </Container>
  );
}

const Container = styled.section`
  align-items: center;
  color: ${COLOR_TEXT_MUTED};
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  min-height: 280px;
  padding: 20px;
  text-align: center;

  & > p {
    margin: 0;
  }
`;

const Title = styled.h2`
  color: ${COLOR_TEXT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_XL};
  font-weight: 700;
  letter-spacing: 0.03em;
  margin: 0;
`;

export default PageMessage;
