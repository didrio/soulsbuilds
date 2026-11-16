import { useState } from 'react';
import styled from 'styled-components';
import Button from '@/components/ui/Button';
import Chips from '@/components/ui/Chips';
import Frame from '@/components/ui/Frame';
import ItemTile from '@/components/ui/ItemTile';
import TextInput from '@/components/ui/TextInput';
import { getCardItem, iconUrl } from '@/data/core';
import { buildImage, hasImageItem, imageChoices } from '@/lib/equipment';
import { LIMITS, type BuildImage, type Equipment } from '@/lib/models';
import {
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_DISPLAY,
  SPACE_LG,
  SPACE_MD,
  SPACE_XS,
  TEXT_MD,
  TEXT_SM,
  TEXT_XL,
  WEIGHT_DISPLAY,
} from '@/theme';
import BuildImageDialog, { IMAGE_KIND_LABELS } from './BuildImageDialog';
import { labelText } from '@/components/ui/typography';

interface BuildDetailsFormProps {
  isNew: boolean;
  name: string;
  /** The build image draft (T40) and the slots it's chosen from. */
  image: BuildImage | null;
  equipment: Equipment;
  onImageChange: (image: BuildImage | null) => void;
  onAddTag: (tag: string) => void;
  onNameChange: (name: string) => void;
  onRemoveTag: (tag: string) => void;
  tags: string[];
}

/**
 * Edit mode's title pane (in the view's spot): "New build" / "Edit build", the build's name, tags and
 * image (T40: the current one, and "Change image" opens BuildImageDialog).
 */
function BuildDetailsForm({
  isNew,
  name,
  image,
  equipment,
  onImageChange,
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
        <BuildImageField image={image} equipment={equipment} onChange={onImageChange} />
      </Fields>
    </Frame>
  );
}

function BuildImageField({
  image,
  equipment,
  onChange,
}: {
  image: BuildImage | null;
  equipment: Equipment;
  onChange: (image: BuildImage | null) => void;
}) {
  const [choosing, setChoosing] = useState(false);
  const shown = buildImage({ image, equipment });
  const item = getCardItem(shown);
  const picked = image !== null && hasImageItem(equipment, image);
  const hasChoices = imageChoices(equipment).length > 0;
  return (
    <Field>
      <Label as="span" id="build-image-label">
        Build image
      </Label>
      <ImageRow>
        <ItemTile src={item ? iconUrl(item.icon) : null} size={56} />
        <ImageText>
          <ImageName>{item ? item.name : 'None yet'}</ImageName>
          <ImageHint>
            {picked && shown
              ? IMAGE_KIND_LABELS[shown.kind]
              : item
                ? 'Main weapon (default)'
                : 'Add a weapon, or choose one of the build’s items'}
          </ImageHint>
        </ImageText>
        <Button
          variant="secondary"
          aria-describedby="build-image-label"
          disabled={!hasChoices}
          onClick={() => setChoosing(true)}>
          Change image
        </Button>
      </ImageRow>
      {choosing ? (
        <BuildImageDialog
          image={image}
          equipment={equipment}
          onChoose={onChange}
          onClose={() => setChoosing(false)}
        />
      ) : null}
    </Field>
  );
}

const Title = styled.h1`
  color: ${COLOR_TEXT};
  font-family: ${FONT_DISPLAY};
  font-size: ${TEXT_XL};
  font-weight: ${WEIGHT_DISPLAY};
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

const ImageRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${SPACE_MD};
`;

const ImageText = styled.span`
  display: flex;
  flex: 1 1 160px;
  flex-direction: column;
  min-width: 0;
`;

const ImageName = styled.span`
  color: ${COLOR_TEXT};
  font-size: ${TEXT_MD};
  font-weight: 600;
`;

const ImageHint = styled.span`
  color: ${COLOR_TEXT_MUTED};
  font-size: ${TEXT_SM};
`;

const Label = styled.label`
  ${labelText}
`;

export default BuildDetailsForm;
