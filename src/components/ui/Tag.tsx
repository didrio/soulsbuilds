import styled from 'styled-components';
import { COLOR_LINE_STRONG, COLOR_TEXT_MUTED, TEXT_XS } from '@/theme';

/** A small framed label (build tags). Not interactive; wrap it in a button or link for that. */
const Tag = styled.span`
  align-items: center;
  border: 1px solid ${COLOR_LINE_STRONG};
  color: ${COLOR_TEXT_MUTED};
  display: inline-flex;
  font-size: ${TEXT_XS};
  font-weight: 600;
  letter-spacing: 0.03em;
  line-height: 1.4;
  padding: 1px 8px;
  white-space: nowrap;
`;

export default Tag;
