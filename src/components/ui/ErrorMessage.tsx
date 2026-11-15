import styled from 'styled-components';
import { COLOR_RED } from '@/theme';

interface ErrorMessageProps {
  children?: string;
  /** Shows a "Try again" button. */
  onRetry?: () => void;
}

/** Error text, announced to screen readers; renders nothing for an empty message. */
function ErrorMessage({ children = '', onRetry }: ErrorMessageProps) {
  if (children.length === 0) return null;
  return (
    <Container role="alert">
      {children}
      {onRetry ? (
        <Retry type="button" onClick={onRetry}>
          Try again
        </Retry>
      ) : null}
    </Container>
  );
}

const Container = styled.p`
  color: ${COLOR_RED};
  font-size: 14px;
  margin: 8px 0;
`;

const Retry = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  margin-left: 8px;
  text-decoration: underline;
`;

export default ErrorMessage;
