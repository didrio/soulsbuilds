import styled from 'styled-components';
import { COLOR_DANGER, TEXT_SM } from '@/theme';

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
  color: ${COLOR_DANGER};
  font-size: ${TEXT_SM};
  margin: 8px 0;
`;

const Retry = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  margin-left: 4px;
  min-height: 44px;
  padding: 0 4px;
  text-decoration: underline;
  text-underline-offset: 3px;
`;

export default ErrorMessage;
