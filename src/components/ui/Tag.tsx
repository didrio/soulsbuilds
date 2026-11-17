import styled from 'styled-components';
import { COLOR_INSET, COLOR_LINE_CONTROL, COLOR_TEXT, RADIUS_FRAME, TEXT_XS } from '@/theme';
import { opticalCenter } from './typography';

/** A small neutral chip (build tags). Not interactive; wrap it in a button or link for that. */
const Tag = styled.span`
  align-items: center;
  background: ${COLOR_INSET};
  border: 1px solid ${COLOR_LINE_CONTROL};
  border-radius: ${RADIUS_FRAME};
  color: ${COLOR_TEXT};
  display: inline-flex;
  font-size: ${TEXT_XS};
  font-weight: 500;
  height: 26px;
  line-height: 1;
  padding: 0 10px;
  ${opticalCenter}
  white-space: nowrap;
`;

export default Tag;
