import styled from 'styled-components';

/** Text for screen readers only (e.g. "Level " before a bare number). */
const VisuallyHidden = styled.span`
  clip: rect(0 0 0 0);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`;

export default VisuallyHidden;
