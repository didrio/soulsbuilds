import styled from 'styled-components';
import FlexGroup from './FlexGroup';
import { COLOR_GREEN, COLOR_LIGHT_GREEN } from '@/theme';

/** A small boxed label (build tags, the like counter). */
const Tag = styled(FlexGroup)`
  background-color: ${COLOR_GREEN};
  border: 1px solid ${COLOR_LIGHT_GREEN};
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  height: 30px;
  box-shadow: 0px 0px 3px ${COLOR_GREEN};
  box-sizing: border-box;
  padding: 0 10px;
  font-size: 14px;
`;

export default Tag;
