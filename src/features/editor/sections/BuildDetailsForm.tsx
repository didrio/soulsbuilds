import styled from 'styled-components';
import Chips from '@/components/ui/Chips';
import PageHero from '@/components/ui/PageHero';
import TextInput from '@/components/ui/TextInput';
import { LIMITS } from '@/lib/models';
import { COLOR_TEXT_MUTED, SPACE_LG, SPACE_XS, TEXT_XS, TRACKING_CAPS } from '@/theme';

interface BuildDetailsFormProps {
  isNew: boolean;
  name: string;
  onAddTag: (tag: string) => void;
  onNameChange: (name: string) => void;
  onRemoveTag: (tag: string) => void;
  tags: string[];
}

/** Edit mode's title block: "New build" / "Edit build", then the build's name and tags. */
function BuildDetailsForm({
  isNew,
  name,
  onAddTag,
  onNameChange,
  onRemoveTag,
  tags,
}: BuildDetailsFormProps) {
  return (
    <PageHero title={isNew ? 'New build' : 'Edit build'}>
      <Fields>
        <Field>
          <Label htmlFor="build-name">Build name</Label>
          <TextInput
            id="build-name"
            maxLength={LIMITS.buildName}
            onChange={onNameChange}
            placeholder="e.g. Bloodhound Samurai"
            required
            value={name}
          />
        </Field>
        <Field>
          <Label as="span">Tags</Label>
          <Chips onAdd={onAddTag} onRemove={onRemoveTag} values={tags} />
        </Field>
      </Fields>
    </PageHero>
  );
}

const Fields = styled.div`
  display: grid;
  gap: ${SPACE_LG};
  margin: ${SPACE_LG} auto 0;
  max-width: 560px;
  text-align: left;
`;

const Field = styled.div`
  display: grid;
  gap: ${SPACE_XS};
`;

const Label = styled.label`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_XS};
  font-weight: 600;
  letter-spacing: ${TRACKING_CAPS};
  text-transform: uppercase;
`;

export default BuildDetailsForm;
