// Layout pieces shared by the build page and its sections.
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import { COLOR_LIGHTEST_GREEN } from '@/theme';

export const SectionHeader = styled(FlexGroup)`
  color: ${COLOR_LIGHTEST_GREEN};
  font-size: 26px;
`;

export const EditorContainer = styled(FlexGroup)`
  align-items: center;
  justify-content: center;
  margin-bottom: 23px;
`;
