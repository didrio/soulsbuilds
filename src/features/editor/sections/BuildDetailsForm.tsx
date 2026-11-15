import styled from 'styled-components';
import Chips from '@/components/ui/Chips';
import FlexGroup from '@/components/ui/FlexGroup';
import TextInput from '@/components/ui/TextInput';
import { LIMITS } from '@/lib/models';
import { BELOW_1100, BELOW_1400 } from '@/theme';
import { EditorContainer, SectionHeader } from '../styles';

interface BuildDetailsFormProps {
  name: string;
  onAddTag: (tag: string) => void;
  onNameChange: (name: string) => void;
  onRemoveTag: (tag: string) => void;
  tags: string[];
}

/** Edit mode: build name and tags (above the equipment). */
function BuildDetailsForm({
  name,
  onAddTag,
  onNameChange,
  onRemoveTag,
  tags,
}: BuildDetailsFormProps) {
  return (
    <>
      <HeaderContainer vertical>
        <SectionHeader as="label" htmlFor="build-name">
          Build Name
        </SectionHeader>
        <NameInputContainer>
          <TextInput
            id="build-name"
            maxLength={LIMITS.buildName}
            onChange={onNameChange}
            required
            value={name}
          />
        </NameInputContainer>
      </HeaderContainer>
      <TagContainer vertical>
        <SectionHeader>Tags</SectionHeader>
        <Chips onAdd={onAddTag} onRemove={onRemoveTag} values={tags} />
      </TagContainer>
    </>
  );
}

const HeaderContainer = styled(EditorContainer)`
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  margin-top: 20px;
`;

const NameInputContainer = styled(FlexGroup)`
  width: 400px;
  margin-top: 5px;

  @media ${BELOW_1400} {
    width: 300px;
  }

  @media ${BELOW_1100} {
    width: 250px;
  }
`;

const TagContainer = styled(EditorContainer)`
  max-width: 76%;
  width: 76%;
  z-index: 10;
`;

export default BuildDetailsForm;
