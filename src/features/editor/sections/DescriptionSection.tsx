import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import { COLOR_DARK_GREEN, COLOR_DARKER_GREEN, COLOR_GOLD, COLOR_GREEN, FONT_BODY } from '@/theme';
import { SectionHeader } from '../styles';

interface DescriptionSectionProps {
  description: string;
  editable: boolean;
  onChange: (description: string) => void;
}

/** The markdown description: an editor in edit mode, sanitized rendered markdown otherwise. */
function DescriptionSection({ description, editable, onChange }: DescriptionSectionProps) {
  const handleChange = (value?: string) => {
    onChange(value as string);
  };

  return (
    <DescriptionSectionContainer vertical>
      {editable || description.length ? <SectionHeader>Description</SectionHeader> : null}
      <DescriptionInputContainer>
        {editable ? (
          <StyledMarkdownEditor
            height={300}
            onChange={handleChange}
            preview="edit"
            previewOptions={{
              rehypePlugins: [[rehypeSanitize]],
            }}
            value={description}
          />
        ) : null}
        {!editable && description.length ? (
          <DescriptionContainer>
            <StyledMarkdownPreview rehypePlugins={[[rehypeSanitize]]} source={description} />
          </DescriptionContainer>
        ) : null}
      </DescriptionInputContainer>
    </DescriptionSectionContainer>
  );
}

const DescriptionSectionContainer = styled(FlexGroup)`
  width: 100%;
`;

const DescriptionInputContainer = styled(FlexGroup)`
  margin-top: 20px;
  width: 100%;
`;

const DescriptionContainer = styled(FlexGroup)`
  flex-direction: column;
  margin-bottom: 25px;
`;

const StyledMarkdownEditor = styled(MDEditor)`
  background-color: ${COLOR_GREEN};
  color: ${COLOR_GOLD};
  max-width: 100%;
  width: 100%;
  font-family: ${FONT_BODY};

  & .w-md-editor-text-input {
    font-size: 20px;
  }

  & .w-md-editor-toolbar {
    background-color: ${COLOR_DARKER_GREEN};
    color: ${COLOR_GOLD};
    font-family: ${FONT_BODY};

    & svg {
      color: ${COLOR_GOLD};
    }
  }

  & .w-md-editor-preview {
    background-color: ${COLOR_DARK_GREEN};
    color: ${COLOR_GOLD};
    font-family: ${FONT_BODY};
  }
`;

const StyledMarkdownPreview = styled(MDEditor.Markdown)`
  background-color: ${COLOR_DARK_GREEN} !important;
  color: ${COLOR_GOLD} !important;
  font-family: ${FONT_BODY} !important;
  font-size: 18px !important;
`;

export default DescriptionSection;
