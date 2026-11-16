import styled from 'styled-components';
import Chips from '@/components/ui/Chips';
import Frame from '@/components/ui/Frame';
import TextInput from '@/components/ui/TextInput';
import { LIMITS } from '@/lib/models';
import {
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  SPACE_LG,
  SPACE_MD,
  SPACE_XS,
  TEXT_XL,
  TEXT_XS,
  TRACKING_CAPS,
} from '@/theme';

interface BuildDetailsFormProps {
  isNew: boolean;
  name: string;
  onAddTag: (tag: string) => void;
  onNameChange: (name: string) => void;
  onRemoveTag: (tag: string) => void;
  tags: string[];
}

/** Edit mode's title pane (in the view's spot): "New build" / "Edit build", the build's name and tags. */
function BuildDetailsForm({
  isNew,
  name,
  onAddTag,
  onNameChange,
  onRemoveTag,
  tags,
}: BuildDetailsFormProps) {
  return (
    <Frame aria-labelledby="build-title">
      <Title id="build-title">{isNew ? 'New build' : 'Edit build'}</Title>
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
    </Frame>
  );
}

const Title = styled.h1`
  color: ${COLOR_TEXT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_XL};
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 0 0 ${SPACE_MD};
`;

const Fields = styled.div`
  display: grid;
  gap: ${SPACE_LG};
  max-width: 640px;
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
