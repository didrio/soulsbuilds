import styled from 'styled-components';
import { labelText } from './typography';

/**
 * A small caps label over a group or value ("Right hand", "Rune level"). A `<span>` by default; use
 * `as` for a heading (`as="h3"`) or a form `<label>`.
 */
const Label = styled.span`
  ${labelText}
  margin: 0;
`;

export default Label;
