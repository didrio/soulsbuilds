// The markdown editor (@uiw/react-md-editor, the biggest dependency). DescriptionSection loads this
// module lazily, so it is its own chunk, fetched only when a description is edited; view mode uses the
// much lighter ./MarkdownView. User markdown always renders through rehype-sanitize.
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from 'rehype-sanitize';
import styled from 'styled-components';
import {
  COLOR_ACCENT,
  COLOR_INSET,
  COLOR_LINE,
  COLOR_LINE_STRONG,
  COLOR_SURFACE_RAISED,
  COLOR_TEXT,
  COLOR_TEXT_MUTED,
  FONT_UI,
  TEXT_MD,
} from '@/theme';

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
      textareaProps={{ 'aria-label': 'Write-up (markdown)' }}
      value={value}
    />
  );
}

// The editor in the field style: sunken, framed, the UI face (markdown is easier to edit in it).
const StyledMarkdownEditor = styled(MDEditor)`
  background-color: ${COLOR_INSET};
  border: 1px solid ${COLOR_LINE_STRONG};
  border-radius: 2px;
  box-shadow: none;
  color: ${COLOR_TEXT};
  font-family: ${FONT_UI};
  max-width: 100%;
  width: 100%;

  &:focus-within {
    border-color: ${COLOR_ACCENT};
  }

  & .w-md-editor-text-input,
  & .w-md-editor-text-pre > code,
  & .w-md-editor-text {
    color: ${COLOR_TEXT};
    font-family: ${FONT_UI} !important;
    font-size: ${TEXT_MD} !important;
    line-height: 1.6 !important;
  }

  & .w-md-editor-toolbar {
    background-color: ${COLOR_SURFACE_RAISED};
    border-bottom: 1px solid ${COLOR_LINE};

    & button {
      color: ${COLOR_TEXT_MUTED};
    }

    & button:hover,
    & button.active {
      background-color: ${COLOR_INSET};
      color: ${COLOR_ACCENT};
    }
  }

  & .w-md-editor-bar {
    color: ${COLOR_TEXT_MUTED};
  }
`;
