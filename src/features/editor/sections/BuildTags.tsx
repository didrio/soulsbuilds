import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import Tag from '@/components/ui/Tag';
import { COLOR_LIGHTEST_GREEN } from '@/theme';

/** View mode: the build's tags, below the description. */
function BuildTags({ tags }: { tags: string[] }) {
  return (
    <TagViewContainer>
      <TagLabel>Tags:</TagLabel>
      <TagDisplay>
        {tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </TagDisplay>
    </TagViewContainer>
  );
}

const TagViewContainer = styled(FlexGroup)`
  align-items: center;
  margin-bottom: 20px;
  margin-top: 10px;
`;

const TagLabel = styled(FlexGroup)`
  font-size: 18px;
  color: ${COLOR_LIGHTEST_GREEN};
  margin-right: 10px;
`;

const TagDisplay = styled(FlexGroup)`
  justify-content: center;
`;

export default BuildTags;
