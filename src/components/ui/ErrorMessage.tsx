import styled from 'styled-components';

/** Small red error text; renders nothing for an empty message. Unused until T4. */
function ErrorMessage({ children = '' }: { children?: string }) {
  return children.length === 0 ? null : <Container>{children}</Container>;
}

const Container = styled.span`
  color: red;
  font-size: 12px;
`;

export default ErrorMessage;
