import type { ReactNode } from 'react';
import styled from 'styled-components';
import { COLOR_LIGHTEST_GREEN, FONT_DISPLAY } from '@/theme';
import LoadingAnimation from './LoadingAnimation';

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
      {loading ? <LoadingAnimation size={50} /> : null}
      {title ? <Title>{title}</Title> : null}
      {children}
    </Container>
  );
}

const Container = styled.section`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 16px;
  justify-content: center;
  min-height: 300px;
  padding: 20px;
  text-align: center;
`;

const Title = styled.h2`
  color: ${COLOR_LIGHTEST_GREEN};
  font-family: ${FONT_DISPLAY};
  font-size: 28px;
  font-weight: normal;
  margin: 0;
`;

export default PageMessage;
