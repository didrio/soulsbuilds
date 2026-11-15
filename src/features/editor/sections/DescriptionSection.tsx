import { lazy, Suspense } from 'react';
import styled from 'styled-components';
import FlexGroup from '@/components/ui/FlexGroup';
import LoadingAnimation from '@/components/ui/LoadingAnimation';
import { SectionHeader } from '../styles';

// The markdown editor is large: load it only when a description is edited (view mode has a light renderer).
const MarkdownEditor = lazy(() =>
  import('./Markdown').then((module) => ({ default: module.MarkdownEditor })),
);
const MarkdownView = lazy(() => import('./MarkdownView'));

interface DescriptionSectionProps {
  description: string;
  editable: boolean;
  onChange: (description: string) => void;
}

/** The markdown description: an editor in edit mode, sanitized rendered markdown otherwise. */
function DescriptionSection({ description, editable, onChange }: DescriptionSectionProps) {
  if (!editable && !description) return null;
  return (
    <DescriptionSectionContainer vertical>
      <SectionHeader>Description</SectionHeader>
      <DescriptionInputContainer>
        <Suspense fallback={<LoadingAnimation size={30} />}>
          {editable ? (
            <MarkdownEditor value={description} onChange={onChange} />
          ) : (
            <DescriptionContainer>
              <MarkdownView source={description} />
            </DescriptionContainer>
          )}
        </Suspense>
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

export default DescriptionSection;
