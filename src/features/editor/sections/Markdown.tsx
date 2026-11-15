// The markdown editor (@uiw/react-md-editor, the biggest dependency). DescriptionSection loads this
// module lazily, so it is its own chunk, fetched only when a description is edited; view mode uses the
// much lighter ./MarkdownView. User markdown always renders through rehype-sanitize.
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import styled from 'styled-components';
import { COLOR_DARK_GREEN, COLOR_DARKER_GREEN, COLOR_GOLD, COLOR_GREEN, FONT_BODY } from '@/theme';

export function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <StyledMarkdownEditor
      height={300}
      onChange={(next?: string) => onChange(next ?? '')}
      preview="edit"
      previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
      textareaProps={{ 'aria-label': 'Description (markdown)' }}
      value={value}
    />
  );
}

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
